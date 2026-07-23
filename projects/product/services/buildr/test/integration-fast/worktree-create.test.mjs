import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { after, before, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(productRoot, 'bin', 'buildr.mjs');
let workspace;

function runBuildr(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [cli, ...args], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return JSON.parse(result.stdout);
}

function git(args) {
  const result = spawnSync('git', ['-C', workspace, ...args], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  return result.stdout.trim();
}

describe('worktree create CLI', { concurrency: 1 }, () => {
  before(() => {
    workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-worktree-integration-'));
    const initialized = spawnSync(process.execPath, [cli, 'init', '--agent', 'codex', '--target', workspace, '--name', 'worktree-fixture', '--description', 'worktree fixture', '--profile', 'team'], { cwd: productRoot, encoding: 'utf8' });
    assert.equal(initialized.status, 0, initialized.stderr || initialized.stdout);
    git(['init', '-b', 'main']);
    git(['config', 'user.name', 'Buildr Test']);
    git(['config', 'user.email', 'buildr-test@example.com']);
    git(['add', '.']);
    git(['commit', '-m', 'baseline']);
  });

  after(() => {
    fs.rmSync(workspace, { recursive: true, force: true });
  });

  test('creates, diagnoses, auto-syncs runtime stale, then reuses without another bootstrap', () => {
    const created = runBuildr(['worktree', 'create', 'demo', '--agent', 'codex', '--branch', 'codex/demo', '--start-point', 'main', '--target', workspace, '--json']);
    assert.equal(created.schemaVersion, 'buildr.worktree-create/v1');
    assert.equal(created.state, 'created');
    assert.equal(created.treeChanged, true);
    assert.equal(created.bootstrap.doctorBefore.health.ready, false);
    assert.deepEqual(created.bootstrap.doctorBefore.findings.map((finding) => finding.code), ['runtime.codex_stale']);
    assert.deepEqual(created.bootstrap.sync, { status: 'applied', reason: 'runtime-stale-only' });
    assert.equal(created.bootstrap.doctorAfter.health.ready, true);
    assert.equal(created.ready, true);
    assert.equal(git(['-C', created.worktree.path, 'status', '--porcelain']), '');

    const reused = runBuildr(['worktree', 'create', 'demo', '--agent', 'codex', '--branch', 'codex/demo', '--start-point', 'main', '--target', workspace, '--json']);
    assert.equal(reused.state, 'reused');
    assert.equal(reused.treeChanged, false);
    assert.equal(reused.bootstrap.doctorBefore, null);
    assert.deepEqual(reused.bootstrap.sync, { status: 'skipped', reason: 'reused-without-tree-transition' });
  });

  test('skips sync when tracked runtime is already healthy', () => {
    git(['add', '-f', '.agents']);
    git(['commit', '-m', 'track runtime fixture']);
    const healthy = runBuildr(['worktree', 'create', 'healthy', '--agent', 'codex', '--branch', 'codex/healthy', '--start-point', 'main', '--target', workspace, '--json']);
    assert.equal(healthy.state, 'created');
    assert.equal(healthy.bootstrap.doctorBefore.health.ready, true);
    assert.deepEqual(healthy.bootstrap.sync, { status: 'skipped', reason: 'doctor-ready' });
    assert.equal(healthy.bootstrap.doctorAfter.health.ready, true);
  });

  test('retains a created checkout and blocks sync for non-runtime doctor findings', () => {
    fs.rmSync(path.join(workspace, 'rules', 'buildr', 'core.md'));
    git(['add', '-A']);
    git(['commit', '-m', 'break workspace fixture']);
    const unsafe = runBuildr(['worktree', 'create', 'unsafe', '--agent', 'codex', '--branch', 'codex/unsafe', '--start-point', 'main', '--target', workspace, '--json'], 1);
    assert.equal(unsafe.state, 'blocked');
    assert.equal(unsafe.treeChanged, true);
    assert.equal(unsafe.bootstrap.sync.status, 'blocked');
    assert.equal(unsafe.blocked.code, 'worktree.auto_sync_unsafe');
    assert.equal(fs.existsSync(unsafe.worktree.path), true);
    assert.ok(unsafe.bootstrap.doctorBefore.findings.some((finding) => finding.code !== 'runtime.codex_stale'));
  });

  test('fails closed before writes for occupied path and branch identity conflict', () => {
    const occupied = path.join(workspace, '.worktrees', 'occupied');
    fs.mkdirSync(occupied, { recursive: true });
    const occupiedResult = runBuildr(['worktree', 'create', 'occupied', '--agent', 'codex', '--branch', 'codex/occupied', '--start-point', 'main', '--target', workspace, '--json'], 1);
    assert.equal(occupiedResult.state, 'blocked');
    assert.equal(occupiedResult.treeChanged, false);
    assert.match(occupiedResult.blocked.message, /occupied but not registered/);
    assert.equal(git(['branch', '--list', 'codex/occupied']), '');

    const conflict = runBuildr(['worktree', 'create', 'other', '--agent', 'codex', '--branch', 'codex/demo', '--start-point', 'main', '--target', workspace, '--json'], 1);
    assert.equal(conflict.state, 'blocked');
    assert.equal(conflict.treeChanged, false);
    assert.match(conflict.blocked.message, /already checked out/);
    assert.equal(fs.existsSync(path.join(workspace, '.worktrees', 'other')), false);
  });
});
