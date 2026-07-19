import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { runVerificationBatch, runVerificationStep } from '../tools/verification/timing/parallel-runner.mjs';
import { candidateStepBudget } from '../tools/verification/timing/budgets.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reporter = path.join(productRoot, 'tools', 'verification', 'timing', 'report.mjs');

test('verification timing reporter emits a versioned machine-readable summary', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-timing-'));
  try {
    const input = path.join(root, 'timing.tsv');
    const diagnostics = path.join(root, 'diagnostics');
    const output = path.join(root, 'timing.json');
    fs.mkdirSync(diagnostics);
    const stdoutPath = path.join(diagnostics, 'runtime.stdout.log');
    const stderrPath = path.join(diagnostics, 'runtime.stderr.log');
    fs.writeFileSync(input, `unit tests\tpassed\t0\t125\t\t\t\nWorkspace E2E: runtime reconciliation\tfailed\t1\t375\t300\t${stdoutPath}\t${stderrPath}\n`);
    const result = spawnSync(process.execPath, [reporter, input, output, 'failed', '500', diagnostics, '450'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), {
      schemaVersion: 'buildr.verification-timing/v1',
      status: 'failed',
      steps: [
        { name: 'unit tests', status: 'passed', exitCode: 0, durationMs: 125 },
        {
          name: 'Workspace E2E: runtime reconciliation',
          status: 'failed',
          exitCode: 1,
          durationMs: 375,
          budgetMs: 300,
          budgetStatus: 'over',
          stdoutPath,
          stderrPath,
        },
      ],
      totalDurationMs: 500,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        ci: process.env.CI === 'true',
      },
      budgetMs: 450,
      budgetStatus: 'over',
      diagnosticsDirectory: diagnostics,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('verification step writes independently addressable stdout and stderr diagnostics', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-step-diagnostics-'));
  try {
    const result = await runVerificationStep({
      name: 'diagnostic fixture',
      command: process.execPath,
      args: ['-e', 'console.log("step-out"); console.error("step-err")'],
      diagnosticsDirectory: root,
    });
    assert.equal(result.status, 'passed');
    assert.equal(fs.readFileSync(result.stdoutPath, 'utf8').trim(), 'step-out');
    assert.equal(fs.readFileSync(result.stderrPath, 'utf8').trim(), 'step-err');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('parallel verification preserves declaration order and failure identity', async () => {
  const started = [];
  const completed = [];
  const results = await runVerificationBatch([
    { name: 'slow pass', command: process.execPath, args: ['-e', 'setTimeout(() => console.log("slow"), 30)'], budgetMs: 1 },
    { name: 'fast failure', command: process.execPath, args: ['-e', 'console.error("failed"); process.exit(7)'] },
  ], {
    onStart: (step) => started.push(step.name),
    onComplete: (result) => completed.push(result.name),
  });
  assert.deepEqual(started, ['slow pass', 'fast failure']);
  assert.deepEqual(completed, ['slow pass', 'fast failure']);
  assert.deepEqual(results.map((result) => result.name), ['slow pass', 'fast failure']);
  assert.equal(results[0].status, 'passed');
  assert.equal(results[0].budgetStatus, 'over');
  assert.match(results[0].stdout, /slow/);
  assert.equal(results[1].status, 'failed');
  assert.equal(results[1].exitCode, 7);
  assert.match(results[1].stderr, /failed/);
});

test('identified expensive candidate steps have non-blocking target budgets', () => {
  for (const name of [
    'capability CLI integration',
    'runtime adapter parity',
    'package static validation',
    'package workspace smoke',
    'package Commands integration',
    'package Rules integration',
    'package Skills integration',
    'package runtime integration',
    'OpenSpec contract fixtures',
    'CLI compatibility',
  ]) assert.ok(candidateStepBudget(name) > 0, `${name} must have a target budget`);
});
