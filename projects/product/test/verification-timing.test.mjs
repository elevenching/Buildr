import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { spawnSync } from 'node:child_process';

const productRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const reporter = path.join(productRoot, 'tools', 'verification', 'timing', 'report.mjs');

test('verification timing reporter emits a versioned machine-readable summary', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-timing-'));
  try {
    const input = path.join(root, 'timing.tsv');
    const output = path.join(root, 'timing.json');
    fs.writeFileSync(input, 'unit tests\tpassed\t0\t125\nrelease smoke\tfailed\t1\t375\n');
    const result = spawnSync(process.execPath, [reporter, input, output, 'failed', '500'], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), {
      schemaVersion: 'buildr.verification-timing/v1',
      status: 'failed',
      steps: [
        { name: 'unit tests', status: 'passed', exitCode: 0, durationMs: 125 },
        { name: 'release smoke', status: 'failed', exitCode: 1, durationMs: 375 },
      ],
      totalDurationMs: 500,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
