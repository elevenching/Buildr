import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reporter = path.join(productRoot, 'tools', 'verification', 'timing', 'report.mjs');

test('verification timing reporter emits a versioned machine-readable summary', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-timing-'));
  try {
    const input = path.join(root, 'timing.tsv');
    const mvpInput = path.join(root, 'mvp-timing.tsv');
    const diagnostics = path.join(root, 'diagnostics');
    const output = path.join(root, 'timing.json');
    fs.mkdirSync(diagnostics);
    fs.writeFileSync(input, 'unit tests\tpassed\t0\t125\ntemporary workspace end-to-end\tfailed\t1\t375\n');
    fs.writeFileSync(mvpInput, 'Workspace\tpassed\t0\t150\nRuntime\tfailed\t1\t225\n');
    const result = spawnSync(process.execPath, [reporter, input, output, 'failed', '500', mvpInput, diagnostics], { encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(fs.readFileSync(output, 'utf8')), {
      schemaVersion: 'buildr.verification-timing/v1',
      status: 'failed',
      steps: [
        { name: 'unit tests', status: 'passed', exitCode: 0, durationMs: 125 },
        {
          name: 'temporary workspace end-to-end',
          status: 'failed',
          exitCode: 1,
          durationMs: 375,
          sections: [
            { name: 'Workspace', status: 'passed', exitCode: 0, durationMs: 150 },
            { name: 'Runtime', status: 'failed', exitCode: 1, durationMs: 225 },
          ],
        },
      ],
      totalDurationMs: 500,
      diagnosticsDirectory: diagnostics,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
