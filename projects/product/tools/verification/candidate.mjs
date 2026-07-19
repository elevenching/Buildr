#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { executePlan } from './plan-runner.mjs';
import { createVerificationPlan } from './planner.mjs';
import { CANDIDATE_TOTAL_BUDGET_MS } from './timing/budgets.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-candidate-verification-'));
const timingFile = path.join(root, 'timing.tsv');
const timingOutput = process.env.BUILDR_TIMING_OUTPUT || path.join(os.tmpdir(), 'buildr-product-verification-timing.json');
const diagnosticsOutput = process.env.BUILDR_DIAGNOSTICS_OUTPUT || timingOutput.replace(/\.json$/, '') + '-diagnostics';
const reporter = path.join(productRoot, 'tools', 'verification', 'timing', 'report.mjs');
const totalStartedAt = Date.now();
let results = [];

function writeSummary(status) {
  const rows = results.map((result) => [
    result.name,
    result.status,
    result.exitCode ?? '',
    result.durationMs,
    result.budgetMs ?? '',
    result.stdoutPath ?? '',
    result.stderrPath ?? '',
  ].join('\t')).join('\n');
  fs.writeFileSync(timingFile, rows ? `${rows}\n` : '');
  const report = spawnSync(process.execPath, [
    reporter,
    timingFile,
    timingOutput,
    status,
    String(Date.now() - totalStartedAt),
    diagnosticsOutput,
    String(CANDIDATE_TOTAL_BUDGET_MS),
  ], { cwd: productRoot, encoding: 'utf8', env: process.env });
  if (report.stdout) process.stdout.write(report.stdout);
  if (report.stderr) process.stderr.write(report.stderr);
  if (report.status !== 0) throw new Error(`timing reporter failed with exit ${report.status}`);
}

let passed = false;
try {
  fs.rmSync(diagnosticsOutput, { recursive: true, force: true });
  fs.mkdirSync(diagnosticsOutput, { recursive: true });
  const plan = createVerificationPlan({ profiles: ['candidate'] });
  const execution = await executePlan(plan, {
    productRoot,
    diagnosticsDirectory: diagnosticsOutput,
    artifactDirectory: path.join(root, 'candidate-package'),
    stream: process.stdout,
    errorStream: process.stderr,
    prefix: 'verify-product',
  });
  results = execution.results;
  passed = execution.passed;
  writeSummary(passed ? 'passed' : 'failed');
  if (passed) process.stdout.write('\nBuildr product verification passed.\n');
} catch (error) {
  process.stderr.write(`${error.stack || error.message}\n`);
  if (!fs.existsSync(timingOutput)) {
    try { writeSummary('failed'); } catch {}
  }
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

if (!passed) process.exitCode = results.find((result) => result.status === 'failed')?.exitCode || 1;
