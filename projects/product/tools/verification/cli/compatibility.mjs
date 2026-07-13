#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const cli = path.join(productRoot, 'tools', 'buildr');

function run(args, options = {}) {
  return spawnSync(process.execPath, [cli, ...args], {
    cwd: options.cwd || productRoot,
    encoding: 'utf8',
    env: { ...process.env, ...(options.env || {}) },
  });
}

const helpTopics = [
  [], ['init'], ['project', 'create'], ['service', 'create'], ['doctor'],
  ['mutation', 'recover'], ['runtime', 'list'], ['runtime', 'check'],
  ['commands', 'add'], ['commands', 'remove'], ['commands', 'check'],
  ['openspec', 'baseline', 'create'], ['openspec', 'check'],
  ['component', 'list'], ['component', 'check'], ['component', 'install'], ['component', 'uninstall'],
  ['rules', 'add'], ['rules', 'remove'], ['rules', 'render'],
  ['builtin', 'list'], ['builtin', 'uninstall'], ['builtin', 'restore'],
  ['update'], ['update', 'check'], ['package', 'check'], ['package', 'build'],
  ['bootstrap', 'guide'], ['render'], ['sync'], ['skill', 'install'],
  ['skills', 'add'], ['skills', 'remove'], ['skills', 'render'],
];

for (const topic of helpTopics) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-help-'));
  try {
    const result = run([...topic, '--help'], { cwd });
    assert.equal(result.status, 0, `help failed: buildr ${topic.join(' ')}`);
    assert.match(result.stdout, /Usage:/, `help missing Usage: buildr ${topic.join(' ')}`);
    assert.equal(result.stderr, '', `help wrote stderr: buildr ${topic.join(' ')}`);
    assert.deepEqual(fs.readdirSync(cwd), [], `help changed filesystem: buildr ${topic.join(' ')}`);
  } finally {
    fs.rmSync(cwd, { recursive: true, force: true });
  }
}

for (const [args, expected] of [
  [['unknown'], /Usage:/],
  [['project', 'create'], /Missing project ref/],
  [['service', 'create'], /Missing service ref/],
  [['render', 'unsupported'], /Unsupported Agent runtime: unsupported/],
  [['commands', 'add', 'demo', '--unknown'], /Unknown argument: --unknown/],
]) {
  const result = run(args);
  assert.notEqual(result.status, 0, `invalid command unexpectedly passed: ${args.join(' ')}`);
  assert.match(`${result.stdout}${result.stderr}`, expected, `invalid command diagnostic drifted: ${args.join(' ')}`);
}

const runtime = run(['runtime', 'list', '--json']);
assert.equal(runtime.status, 0);
const runtimeJson = JSON.parse(runtime.stdout);
assert.deepEqual(runtimeJson.supportedAgents, ['claude-code', 'codex']);
assert.deepEqual(runtimeJson.adapterTraitCatalog.rules, ['native-recursive', 'native-root', 'reference-bridge', 'vendor-rule-files']);
assert.equal(runtimeJson.agents.codex.traits.rules.kind, 'native-recursive');
assert.equal(runtimeJson.agents.codex.traits.skills.root, '.agents');
assert.equal(runtimeJson.agents['claude-code'].traits.rules.kind, 'reference-bridge');
assert.equal(runtimeJson.agents['claude-code'].traits.skills.root, '.claude');

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-compat-'));
try {
  let result = run(['init', '--agent', 'codex', '--target', workspace, '--name', 'compat', '--profile', 'team']);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Buildr onboarding 已完成：codex/);
  result = run(['project', 'create', 'demo', '--target', workspace]);
  assert.equal(result.status, 0, result.stderr);
  result = run(['doctor', '--agent', 'codex', '--target', workspace, '--json']);
  assert.equal(result.status, 0, result.stderr);
  const doctor = JSON.parse(result.stdout);
  assert.equal(doctor.ok, true);
  assert.equal(doctor.projectRegistry.projects[0].name, 'demo');
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}

console.log(`CLI compatibility verification passed: ${helpTopics.length} help topics, invalid inputs, JSON discovery, and workspace mutation.`);
