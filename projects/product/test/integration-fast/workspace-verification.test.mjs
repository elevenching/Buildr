import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { selectWorkspaceSuites, workspaceSuiteSteps, workspaceSuites } from '../../tools/verification/workspace/suites.mjs';
import { createSuiteFixture } from '../../tools/verification/workspace/fixture.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const runner = path.join(productRoot, 'tools', 'verification', 'workspace', 'run.mjs');

test('Workspace E2E registry exposes stable independent suites', () => {
  assert.deepEqual(workspaceSuites.map((suite) => suite.id), [
    'workspace-lifecycle',
    'ownership-recovery',
    'runtime-reconciliation',
  ]);
  assert.equal(new Set(workspaceSuites.map((suite) => suite.file)).size, workspaceSuites.length);
  assert.ok(workspaceSuites.every((suite) => suite.budgetMs > 0));
  assert.deepEqual(selectWorkspaceSuites(['runtime-reconciliation', 'runtime-reconciliation']).map((suite) => suite.id), ['runtime-reconciliation']);
  assert.throws(() => selectWorkspaceSuites(['unknown']), /Unknown Workspace E2E suite/);
  assert.deepEqual(workspaceSuiteSteps({ productRoot }).map((step) => step.name), workspaceSuites.map((suite) => suite.name));
});

test('Workspace E2E runner lists suites and fails closed on invalid selection', () => {
  const listed = spawnSync(process.execPath, [runner, '--list'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(listed.status, 0, listed.stderr);
  assert.deepEqual(listed.stdout.trim().split(/\r?\n/), workspaceSuites.map((suite) => suite.id));

  const unknown = spawnSync(process.execPath, [runner, 'unknown'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown Workspace E2E suite/);
});

test('Workspace E2E retains failed fixtures and cleans successful fixtures', () => {
  const failed = createSuiteFixture('retained-failure-contract');
  failed.cleanup({ failed: true });
  assert.equal(fs.existsSync(failed.root), true);
  fs.rmSync(failed.root, { recursive: true, force: true });

  const passed = createSuiteFixture('successful-cleanup-contract');
  passed.cleanup();
  assert.equal(fs.existsSync(passed.root), false);
});
