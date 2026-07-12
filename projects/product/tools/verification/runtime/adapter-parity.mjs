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
  const result = spawnSync(process.execPath, [buildr, ...args], { cwd: productRoot, encoding: 'utf8' });
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
  visit(path.join(workspace, '.agents'));
  visit(path.join(workspace, '.claude'));
  for (const file of ['CLAUDE.md', 'AGENTS.md']) if (fs.existsSync(path.join(workspace, file))) hash.update(fs.readFileSync(path.join(workspace, file)));
  return hash.digest('hex');
}

run(['init', '--target', workspace, '--name', 'runtime-parity']);

const symlinkWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-symlink-'));
const symlinkOutside = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-outside-'));
run(['init', '--target', symlinkWorkspace, '--name', 'runtime-symlink']);
fs.mkdirSync(path.join(symlinkWorkspace, '.agents'), { recursive: true });
fs.symlinkSync(symlinkOutside, path.join(symlinkWorkspace, '.agents', 'skills'), 'dir');
const symlinkInstall = run(['skill', 'install', 'codex', '--target', symlinkWorkspace], { allowFailure: true });
assert.notEqual(symlinkInstall.status, 0, 'runtime install must reject a target path that crosses a symbolic link');
assert.equal(fs.existsSync(path.join(symlinkOutside, 'buildr', 'SKILL.md')), false, 'runtime install must not write outside the workspace through a symbolic link');

run(['project', 'create', 'scope-alpha', '--target', workspace, '--description', 'scope alpha']);
run(['project', 'create', 'scope-beta', '--target', workspace, '--description', 'scope beta']);
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

for (const agent of ['codex', 'claude-code']) {
  run(['skill', 'install', agent, '--target', workspace]);
  run(['render', agent, '--scope', '.', '--target', workspace]);
  const check = run(['runtime', 'check', agent, '--scope', '.', '--target', workspace]);
  assert.equal(check.status, 0, `${agent} runtime check should pass after render`);
}

assert.ok(fs.existsSync(path.join(workspace, '.agents', 'skills', 'buildr', 'SKILL.md')));
assert.ok(fs.existsSync(path.join(workspace, '.claude', 'skills', 'buildr', 'SKILL.md')));
assert.ok(fs.readFileSync(path.join(workspace, 'CLAUDE.md'), 'utf8').includes('@AGENTS.md'));
assert.ok(!fs.existsSync(path.join(workspace, '.agents', 'CLAUDE.md')));

const codexBuildr = fs.readFileSync(path.join(workspace, '.agents', 'skills', 'task-finish', 'SKILL.md'), 'utf8');
const claudeBuildr = fs.readFileSync(path.join(workspace, '.claude', 'skills', 'task-finish', 'SKILL.md'), 'utf8');
assert.ok(codexBuildr.includes('buildr:contribution openspec#pre-spec-sync'));
assert.ok(claudeBuildr.includes('buildr:contribution openspec#pre-spec-sync'));

const orphan = path.join(workspace, '.agents', 'skills', 'runtime-orphan', 'SKILL.md');
fs.mkdirSync(path.dirname(orphan), { recursive: true });
fs.writeFileSync(orphan, '---\nname: runtime-orphan\n---\n<!-- Generated by Buildr. Hash: deadbeef. Do not edit. -->\n');
run(['render', 'codex', '--scope', '.', '--target', workspace]);
assert.equal(fs.existsSync(path.dirname(orphan)), false);

const before = digestRuntime();
for (const agent of ['codex', 'claude-code']) run(['render', agent, '--scope', '.', '--target', workspace]);
assert.equal(digestRuntime(), before, 'repeated render must be idempotent');

const doctor = JSON.parse(execFileSync(process.execPath, [buildr, 'doctor', '--agent', 'codex', '--target', workspace, '--json'], { cwd: productRoot, encoding: 'utf8' }));
assert.equal(doctor.agentRuntime.requested, 'codex');
assert.equal(doctor.agentRuntime.supported, true);
assert.equal(doctor.runtime.claudeCode.length, 0);
assert.ok(doctor.runtime.codex.length > 0);

console.log('runtime adapter parity verification passed');
