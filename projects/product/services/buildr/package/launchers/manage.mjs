#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildLauncher } from './build.mjs';

const PRODUCT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function packageVersion() { return JSON.parse(fs.readFileSync(path.join(PRODUCT_ROOT, 'package.json'), 'utf8')).version; }
function gitText(args) { try { return execFileSync('git', args, { cwd: PRODUCT_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch { return ''; } }
function checkoutIdentity() {
  const head = gitText(['rev-parse', 'HEAD']) || 'not-a-checkout';
  const dirty = gitText(['status', '--porcelain=v1', '--untracked-files=all']);
  return { head, dirty: Boolean(dirty), fingerprint: crypto.createHash('sha256').update(`${head}\0${dirty}`).digest('hex').slice(0, 16) };
}
function appName(channel) { return channel === 'development' ? 'Buildr Dev' : 'Buildr'; }
function defaultInstallRoot(platform) {
  if (process.env.BUILDR_LAUNCHER_INSTALL_DIR) return path.resolve(process.env.BUILDR_LAUNCHER_INSTALL_DIR);
  if (platform === 'darwin') return '/Applications';
  return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs');
}
function targetPath(platform, channel, installRoot = defaultInstallRoot(platform)) {
  return path.join(installRoot, platform === 'darwin' ? `${appName(channel)}.app` : appName(channel));
}
function appDataRoot() {
  if (process.env.BUILDR_APP_DATA_DIR) return path.resolve(process.env.BUILDR_APP_DATA_DIR);
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'Buildr');
  return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Buildr');
}
function runningInstance() { try { return JSON.parse(fs.readFileSync(path.join(appDataRoot(), 'instance.json'), 'utf8')); } catch { return null; } }
function identityPath(target, platform) { return platform === 'darwin' ? path.join(target, 'Contents', 'Resources', 'launcher-identity.json') : path.join(target, 'launcher-identity.json'); }
function readIdentity(target, platform) { try { return JSON.parse(fs.readFileSync(identityPath(target, platform), 'utf8')); } catch { return null; } }
function buildIdentity(platform, channel) {
  const checkout = checkoutIdentity();
  return { schemaVersion: 'buildr.launcher-identity/v1', version: packageVersion(), channel, source: channel === 'development' ? 'checkout' : 'package', buildId: channel === 'development' ? `${checkout.head.slice(0, 12)}-${checkout.fingerprint}` : packageVersion(), buildNumber: String(Date.now()), protocolVersion: 1, platform, builtAt: new Date().toISOString(), checkout };
}
function validateBundle(bundle, platform, expected) {
  const actual = readIdentity(bundle, platform);
  if (!actual || actual.buildId !== expected.buildId || actual.channel !== expected.channel) throw new Error('Staged launcher identity validation failed.');
  const runtime = platform === 'darwin' ? path.join(bundle, 'Contents', 'MacOS', 'node') : path.join(bundle, 'runtime', 'node.exe');
  if (!fs.existsSync(runtime)) throw new Error('Staged launcher runtime is missing.');
  return actual;
}
async function stopOwnedInstance({ waitMs = 3000, channel, failOnUnknown = false } = {}) {
  const state = runningInstance();
  if (!state) return { stopped: false, reason: 'not-running' };
  if (!state.launcherIdentity) {
    if (failOnUnknown) throw new Error('A running Buildr instance has no launcher identity; exit it before replacing this launcher.');
    return { stopped: false, reason: 'unknown-owner' };
  }
  if (state.launcherIdentity.channel !== channel) return { stopped: false, reason: 'different-owner' };
  try {
    const response = await fetch(`${state.url}/api/v1/health`, { headers: { 'x-buildr-instance': state.secret }, signal: AbortSignal.timeout(1000) });
    if (!response.ok) return { stopped: false, reason: 'stale' };
    process.kill(state.pid, 'SIGTERM');
  } catch { return { stopped: false, reason: 'stale' }; }
  const deadline = Date.now() + waitMs;
  while (Date.now() < deadline) {
    try { process.kill(state.pid, 0); } catch { return { stopped: true }; }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`Buildr instance ${state.pid} did not stop before launcher switch.`);
}
export function launcherStatus({ platform = process.platform, channel = 'release', installRoot } = {}) {
  const target = targetPath(platform, channel, installRoot);
  const instance = runningInstance();
  return { schemaVersion: 'buildr.launcher-status/v1', platform, channel, target, installed: fs.existsSync(target), identity: readIdentity(target, platform), runningInstance: instance ? { url: instance.url, pid: instance.pid, launcherIdentity: instance.launcherIdentity ?? null } : null };
}
export async function installLauncher({ platform = process.platform, channel = 'release', installRoot, runtime = process.execPath, stopInstance = true } = {}) {
  if (!['darwin', 'win32'].includes(platform)) throw new Error(`Unsupported launcher platform: ${platform}`);
  const target = targetPath(platform, channel, installRoot);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const identity = buildIdentity(platform, channel);
  const staging = fs.mkdtempSync(path.join(path.dirname(target), `.buildr-${channel}-staging-`));
  const backup = `${target}.previous`;
  let stagedBundle;
  try {
    stagedBundle = buildLauncher({ platform, output: staging, runtime, identity });
    validateBundle(stagedBundle, platform, identity);
    const targetExisted = fs.existsSync(target);
    if (stopInstance) await stopOwnedInstance({ channel, failOnUnknown: targetExisted });
    fs.rmSync(backup, { recursive: true, force: true });
    if (fs.existsSync(target)) fs.renameSync(target, backup);
    try {
      fs.renameSync(stagedBundle, target);
      validateBundle(target, platform, identity);
      if (platform === 'win32' && process.platform === 'win32') execFileSync('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(target, 'Install-Buildr-Shortcuts.ps1')]);
    } catch (error) {
      fs.rmSync(target, { recursive: true, force: true });
      if (fs.existsSync(backup)) fs.renameSync(backup, target);
      throw error;
    }
    return { ...launcherStatus({ platform, channel, installRoot }), previous: fs.existsSync(backup) ? backup : null };
  } finally { fs.rmSync(staging, { recursive: true, force: true }); }
}
export async function uninstallLauncher({ platform = process.platform, channel = 'release', installRoot } = {}) {
  const status = launcherStatus({ platform, channel, installRoot });
  await stopOwnedInstance({ channel, failOnUnknown: status.installed });
  if (platform === 'win32') {
    const shortcut = path.join(process.env.APPDATA || '', 'Microsoft', 'Windows', 'Start Menu', 'Programs', `${appName(channel)}.lnk`);
    if (process.env.APPDATA) fs.rmSync(shortcut, { force: true });
  }
  fs.rmSync(status.target, { recursive: true, force: true });
  fs.rmSync(`${status.target}.previous`, { recursive: true, force: true });
  return { ...status, installed: false, removed: status.installed };
}

async function main(args = process.argv.slice(2)) {
  const action = args[0] || 'status';
  const value = (name, fallback) => { const i = args.indexOf(name); return i === -1 ? fallback : args[i + 1]; };
  const options = { platform: value('--platform', process.platform), channel: value('--channel', 'release'), installRoot: value('--target', undefined) };
  const result = action === 'install' ? await installLauncher(options) : action === 'uninstall' ? await uninstallLauncher(options) : action === 'status' ? launcherStatus(options) : (() => { throw new Error(`Unknown launcher action: ${action}`); })();
  console.log(JSON.stringify(result, null, 2));
}
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
