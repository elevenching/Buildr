#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const buildr = path.join(productRoot, 'tools', 'buildr');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-parity-'));

function run(args, options = {}) {
  const result = spawnSync(process.execPath, [buildr, ...args], { cwd: productRoot, encoding: 'utf8', env: { ...process.env, ...(options.env || {}) } });
  if (!options.allowFailure && result.status !== 0) throw new Error(`${args.join(' ')} failed:\n${result.stdout}\n${result.stderr}`);
  return result;
}

function digestRuntime() {
  const hash = crypto.createHash('sha256');
  const visit = (directory) => {
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const item = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(item);
      else if (entry.isFile()) {
        hash.update(path.relative(workspace, item));
        hash.update('\0');
        hash.update(fs.readFileSync(item));
      }
    }
  };
  for (const directory of ['.agents', '.claude', '.cursor', '.qoder', '.trae', '.codebuddy']) visit(path.join(workspace, directory));
  for (const file of ['CLAUDE.md', 'CLAUDE.local.md', 'CODEBUDDY.md', 'AGENTS.md']) if (fs.existsSync(path.join(workspace, file))) hash.update(fs.readFileSync(path.join(workspace, file)));
  return hash.digest('hex');
}

run(['init', '--target', workspace, '--name', 'runtime-parity']);
fs.appendFileSync(path.join(workspace, 'AGENTS.md'), '\nROOT_MARKER\n');

const symlinkWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-symlink-'));
const symlinkOutside = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-outside-'));
run(['init', '--target', symlinkWorkspace, '--name', 'runtime-symlink']);
fs.mkdirSync(path.join(symlinkWorkspace, '.agents'), { recursive: true });
fs.symlinkSync(symlinkOutside, path.join(symlinkWorkspace, '.agents', 'skills'), 'dir');
const symlinkInstall = run(['skill', 'install', 'codex', '--target', symlinkWorkspace], { allowFailure: true });
assert.notEqual(symlinkInstall.status, 0, 'runtime install must reject a target path that crosses a symbolic link');
assert.equal(fs.existsSync(path.join(symlinkOutside, 'buildr', 'SKILL.md')), false, 'runtime install must not write outside the workspace through a symbolic link');

const rulesSymlinkWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-rules-symlink-'));
const rulesSymlinkOutside = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-rules-outside-'));
run(['init', '--target', rulesSymlinkWorkspace, '--name', 'runtime-rules-symlink']);
fs.symlinkSync(rulesSymlinkOutside, path.join(rulesSymlinkWorkspace, '.cursor'), 'dir');
const symlinkRulesRender = run(['rules', 'render', 'cursor', '--scope', '.', '--target', rulesSymlinkWorkspace], { allowFailure: true });
assert.notEqual(symlinkRulesRender.status, 0, 'runtime rules render must reject a target path that crosses a symbolic link');
assert.equal(fs.existsSync(path.join(rulesSymlinkOutside, 'rules', 'buildr.mdc')), false, 'rules render must not write outside the workspace through a symbolic link');

run(['project', 'create', 'scope-alpha', '--target', workspace, '--description', 'scope alpha']);
run(['project', 'create', 'scope-beta', '--target', workspace, '--description', 'scope beta']);
fs.mkdirSync(path.join(workspace, 'projects', 'scope-alpha', 'services', 'api'), { recursive: true });
fs.mkdirSync(path.join(workspace, 'projects', 'scope-alpha', 'services', 'web'), { recursive: true });
fs.writeFileSync(path.join(workspace, 'projects', 'scope-alpha', 'services', 'api', 'AGENTS.md'), '# API rules\nAPI_MARKER\n');
fs.writeFileSync(path.join(workspace, 'projects', 'scope-alpha', 'services', 'web', 'AGENTS.md'), '# Web rules\nWEB_MARKER\n');
run(['skills', 'add', 'beta-remote', '--remote-source', 'https://example.com/beta-remote', '--scope', 'projects/scope-beta', '--target', workspace, '--description', 'beta remote']);
run(['skills', 'render', 'codex', '--scope', '.', '--target', workspace]);
const betaPlan = path.join(workspace, '.agents', 'buildr', 'skill-install-plans', 'beta-remote.md');
assert.ok(fs.existsSync(betaPlan));
const betaManifest = path.join(workspace, 'projects', 'scope-beta', 'skills', 'manifest.yml');
const betaManifestContent = fs.readFileSync(betaManifest, 'utf8');
fs.writeFileSync(betaManifest, 'schemaVersion: [invalid\n', 'utf8');
const scopedRender = run(['skills', 'render', 'codex', '--scope', 'projects/scope-alpha', '--target', workspace], { allowFailure: true });
assert.equal(scopedRender.status, 0, 'Project-scoped render must not fail because an unrelated Project manifest is invalid');
assert.ok(fs.existsSync(betaPlan), 'Project-scoped render must not remove an unrelated Project install plan');
fs.writeFileSync(betaManifest, betaManifestContent, 'utf8');

const lifecycleAdapters = ['cursor', 'qoder', 'workbuddy', 'claude-code', 'codex'];
for (const agent of lifecycleAdapters) {
  run(['skill', 'install', agent, '--target', workspace]);
  run(['render', agent, '--scope', '.', '--target', workspace]);
  const check = run(['runtime', 'check', agent, '--scope', '.', '--target', workspace]);
  assert.equal(check.status, 0, `${agent} runtime check should pass after render`);
  assert.match(check.stdout, /Environment:/, `${agent} runtime check must report environment probes`);
  assert.match(check.stdout, /Activation: rules=/, `${agent} runtime check must report activation`);
  if (agent === 'cursor') assert.match(check.stdout, /installation: manual \(manual\)/);
  if (agent === 'qoder') assert.match(check.stdout, /Reload: Run \/skills reload/);
  if (agent === 'workbuddy') assert.doesNotMatch(check.stdout, /runtime\.workbuddy_reference_smoke_pending|reference traversal cannot be proven/);
}
const missingQoderEnvironment = run(['runtime', 'check', 'qoder', '--scope', '.', '--target', workspace], { env: { PATH: '' } });
assert.match(missingQoderEnvironment.stdout, /\[warning\] \. - Qoder installation probe failed\./);
assert.match(missingQoderEnvironment.stdout, /installation: missing \(command\)/);

assert.ok(fs.existsSync(path.join(workspace, '.agents', 'skills', 'buildr', 'SKILL.md')));
assert.ok(fs.existsSync(path.join(workspace, '.claude', 'skills', 'buildr', 'SKILL.md')));
assert.ok(fs.readFileSync(path.join(workspace, '.cursor', 'rules', 'buildr.mdc'), 'utf8').includes('ROOT_MARKER'));
assert.ok(fs.readFileSync(path.join(workspace, 'projects', 'scope-alpha', 'services', 'api', '.cursor', 'rules', 'buildr.mdc'), 'utf8').includes('API_MARKER'));
assert.ok(fs.readFileSync(path.join(workspace, 'projects', 'scope-alpha', 'services', 'web', '.cursor', 'rules', 'buildr.mdc'), 'utf8').includes('WEB_MARKER'));
assert.ok(fs.readdirSync(path.join(workspace, '.qoder', 'rules', 'buildr')).some((file) => file.endsWith('.md')));
assert.ok(fs.readFileSync(path.join(workspace, 'CODEBUDDY.md'), 'utf8').includes('不得读取不相关兄弟目录'));
assert.ok(fs.existsSync(path.join(workspace, '.qoder', 'skills', 'buildr', 'SKILL.md')));
assert.ok(fs.existsSync(path.join(workspace, '.codebuddy', 'skills', 'buildr', 'SKILL.md')));
assert.ok(fs.readFileSync(path.join(workspace, 'CLAUDE.md'), 'utf8').includes('@AGENTS.md'));
assert.ok(!fs.existsSync(path.join(workspace, '.agents', 'CLAUDE.md')));

const codexBuildr = fs.readFileSync(path.join(workspace, '.agents', 'skills', 'task-finish', 'SKILL.md'), 'utf8');
const claudeBuildr = fs.readFileSync(path.join(workspace, '.claude', 'skills', 'task-finish', 'SKILL.md'), 'utf8');
assert.ok(codexBuildr.includes('buildr:contribution openspec#pre-spec-sync'));
assert.ok(claudeBuildr.includes('buildr:contribution openspec#pre-spec-sync'));

const betaCursorRule = path.join(workspace, 'projects', 'scope-beta', '.cursor', 'rules', 'buildr.mdc');
const qoderDirectory = path.join(workspace, '.qoder', 'rules', 'buildr');
const betaQoderRule = fs.readdirSync(qoderDirectory)
  .map((file) => path.join(qoderDirectory, file))
  .find((file) => fs.readFileSync(file, 'utf8').includes('source: projects/scope-beta/AGENTS.md'));
assert.ok(betaQoderRule, 'Qoder must render a managed rule for scope-beta');
const betaProjectionSnapshot = new Map([
  [betaCursorRule, fs.readFileSync(betaCursorRule, 'utf8')],
  [betaQoderRule, fs.readFileSync(betaQoderRule, 'utf8')],
  [path.join(workspace, 'CODEBUDDY.md'), fs.readFileSync(path.join(workspace, 'CODEBUDDY.md'), 'utf8')],
]);
for (const agent of ['cursor', 'qoder', 'workbuddy']) run(['rules', 'render', agent, '--scope', 'projects/scope-alpha', '--target', workspace]);
for (const [file, content] of betaProjectionSnapshot) {
  assert.equal(fs.readFileSync(file, 'utf8'), content, `Project-scoped Rules render must preserve unrelated projection: ${file}`);
}

const orphan = path.join(workspace, '.agents', 'skills', 'runtime-orphan', 'SKILL.md');
fs.mkdirSync(path.dirname(orphan), { recursive: true });
fs.writeFileSync(orphan, '---\nname: runtime-orphan\n---\n<!-- Generated by Buildr. Hash: deadbeef. Do not edit. -->\n');
run(['render', 'codex', '--scope', '.', '--target', workspace]);
assert.equal(fs.existsSync(path.dirname(orphan)), false);

const before = digestRuntime();
for (const agent of lifecycleAdapters) run(['render', agent, '--scope', '.', '--target', workspace]);
assert.equal(digestRuntime(), before, 'repeated render must be idempotent');

const doctor = JSON.parse(execFileSync(process.execPath, [buildr, 'doctor', '--agent', 'codex', '--target', workspace, '--json'], { cwd: productRoot, encoding: 'utf8' }));
assert.equal(doctor.agentRuntime.requested, 'codex');
assert.equal(doctor.agentRuntime.supported, true);
assert.equal(doctor.runtime.claudeCode.length, 0);
assert.ok(doctor.runtime.codex.length > 0);

const rulesOrphanWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-rules-orphan-'));
run(['init', '--target', rulesOrphanWorkspace, '--name', 'runtime-rules-orphan']);
for (const agent of ['cursor', 'qoder', 'workbuddy']) {
  run(['rules', 'render', agent, '--scope', '.', '--target', rulesOrphanWorkspace]);
}
fs.rmSync(path.join(rulesOrphanWorkspace, 'AGENTS.md'));
for (const agent of ['cursor', 'qoder', 'workbuddy']) {
  run(['rules', 'render', agent, '--scope', '.', '--target', rulesOrphanWorkspace]);
}
assert.equal(fs.existsSync(path.join(rulesOrphanWorkspace, '.cursor', 'rules', 'buildr.mdc')), false);
assert.deepEqual(fs.readdirSync(path.join(rulesOrphanWorkspace, '.qoder', 'rules', 'buildr')), []);
assert.equal(fs.existsSync(path.join(rulesOrphanWorkspace, 'CODEBUDDY.md')), false);

const boundaryWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-boundary-orphan-'));
run(['init', '--target', boundaryWorkspace, '--name', 'runtime-boundary-orphan']);
const externalRepo = path.join(boundaryWorkspace, 'external-repo');
fs.mkdirSync(path.join(externalRepo, '.git'), { recursive: true });
fs.writeFileSync(path.join(externalRepo, '.git', 'HEAD'), 'ref: refs/heads/main\n');
fs.writeFileSync(path.join(externalRepo, 'AGENTS.md'), 'EXTERNAL_REPO_RULE_MUST_NOT_BE_DISCOVERED\n');
const externalCursorRule = path.join(externalRepo, '.cursor', 'rules', 'buildr.mdc');
const externalTraeRule = path.join(externalRepo, '.trae', 'rules', 'buildr.md');
fs.mkdirSync(path.dirname(externalCursorRule), { recursive: true });
fs.mkdirSync(path.dirname(externalTraeRule), { recursive: true });
fs.writeFileSync(externalCursorRule, '<!-- Generated by Buildr. Agent adapter: cursor; boundary fixture. -->\n');
fs.writeFileSync(externalTraeRule, '<!-- Generated by Buildr. Agent adapter: trae; boundary fixture. -->\n');
run(['rules', 'render', 'cursor', '--scope', '.', '--target', boundaryWorkspace]);
run(['rules', 'render', 'trae', '--scope', '.', '--target', boundaryWorkspace]);
assert.ok(fs.existsSync(externalCursorRule), 'orphan cleanup must not cross an unregistered nested Git boundary');
assert.ok(fs.existsSync(externalTraeRule), 'orphan cleanup must not cross an unregistered nested Git boundary');

console.log('runtime adapter parity verification passed');
