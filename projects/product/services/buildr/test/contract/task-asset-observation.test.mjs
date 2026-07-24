import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const helper = path.join(productRoot, 'package/targets/workspace/skills/buildr/task-asset-review/scripts/observation.mjs');
const ID_A = '11111111-1111-4111-8111-111111111111';
const ID_B = '22222222-2222-4222-8222-222222222222';

function workspace(root, id) {
  fs.mkdirSync(path.join(root, '.buildr'), { recursive: true });
  fs.writeFileSync(path.join(root, '.buildr', 'workspace.yml'), `schemaVersion: buildr.workspace/v1\nid: ${id}\nname: Test\n`);
}

function run(action, root, appData, extra = [], expectedStatus = 0) {
  const result = spawnSync(process.execPath, [helper, action, '--workspace-root', root, ...extra], {
    encoding: 'utf8',
    env: { ...process.env, BUILDR_APP_DATA_DIR: appData },
  });
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return JSON.parse(expectedStatus === 0 ? result.stdout : result.stderr);
}

test('同一 Workspace 的不同目录共享 inbox，不同 Workspace 隔离', (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-asset-observation-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const rootA = path.join(base, 'workspace-a');
  const nestedA = path.join(rootA, '.worktrees', 'task-a', 'service');
  const rootB = path.join(base, 'workspace-b');
  const appData = path.join(base, 'app-data');
  workspace(rootA, ID_A);
  workspace(path.join(rootA, '.worktrees', 'task-a'), ID_A);
  workspace(rootB, ID_B);
  fs.mkdirSync(nestedA, { recursive: true });

  const first = run('list', rootA, appData);
  const nested = run('list', nestedA, appData);
  const other = run('list', rootB, appData);
  assert.equal(first.inbox, nested.inbox);
  assert.notEqual(first.inbox, other.inbox);
  assert.ok(first.inbox.includes(path.join('asset-review', ID_A, 'inbox')));
});

test('lifecycle 保持 owner、状态和删除边界', (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-asset-observation-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const root = path.join(base, 'workspace');
  const appData = path.join(base, 'app-data');
  workspace(root, ID_A);
  const identity = ['--observation-id', 'task-1', '--owner', 'root-agent'];

  const started = run('start', root, appData, [...identity, '--source', '{"task":"task-1"}']);
  assert.equal(started.observation.status, 'observing');
  assert.equal(fs.statSync(started.file).mode & 0o777, 0o600);
  const mismatch = run('observe', root, appData, ['--observation-id', 'task-1', '--owner', 'other-agent', '--message', 'bad'], 1);
  assert.equal(mismatch.error.code, 'observation_owner_mismatch');

  run('observe', root, appData, [...identity, '--message', 'stable finding', '--evidence', 'test']);
  const finalized = run('finalize', root, appData, [...identity, '--review', 'skill candidate']);
  assert.equal(finalized.observation.status, 'awaiting-human');
  const accepted = run('accept', root, appData, [...identity, '--candidate-type', 'skill', '--summary', 'improve provider']);
  assert.equal(accepted.observation.status, 'accepted');
  const premature = run('complete', root, appData, [...identity, '--outcome', 'asset-integrated'], 1);
  assert.equal(premature.error.code, 'observation_handoff_incomplete');
  run('handoff', root, appData, [...identity, '--destination', '{"task":"asset-task","assetId":"task-asset-review"}']);
  run('complete', root, appData, [...identity, '--outcome', 'asset-integrated']);
  assert.equal(fs.existsSync(started.file), false);
  assert.equal(fs.readdirSync(path.dirname(started.file)).some((name) => name.endsWith('.tmp')), false);
});

test('reject 精确删除且不创建 tombstone', (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-asset-observation-'));
  t.after(() => fs.rmSync(base, { recursive: true, force: true }));
  const root = path.join(base, 'workspace');
  const appData = path.join(base, 'app-data');
  workspace(root, ID_A);
  const identity = ['--observation-id', 'task-reject', '--owner', 'root-agent'];
  const started = run('start', root, appData, identity);
  run('reject', root, appData, identity);
  assert.equal(fs.existsSync(started.file), false);
  assert.deepEqual(run('list', root, appData).files, []);
});
