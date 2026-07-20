#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { executePlan } from './plan-runner.mjs';
import { createVerificationPlan } from './planner.mjs';
import { CANDIDATE_TOTAL_BUDGET_MS } from './timing/budgets.mjs';
import { collectVerificationSourceIdentity, createVerificationEvidencePaths, writeVerificationTimingEvidence } from './timing/evidence.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const executionRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-candidate-verification-'));
const evidence = createVerificationEvidencePaths('candidate');
const source = collectVerificationSourceIdentity(productRoot);
const totalStartedAt = Date.now();
let results = [];

function writeSummary(status) {
  return writeVerificationTimingEvidence({
    ...evidence,
    kind: 'candidate',
    source,
    status,
    results,
    startedAt: totalStartedAt,
    finishedAt: Date.now(),
    totalBudgetMs: CANDIDATE_TOTAL_BUDGET_MS,
    diagnosticsDirectory: evidence.diagnosticsOutput,
    prefix: 'verify-product',
    stream: process.stdout,
    errorStream: process.stderr,
  });
}

let passed = false;
try {
  fs.rmSync(evidence.diagnosticsOutput, { recursive: true, force: true });
  fs.mkdirSync(evidence.diagnosticsOutput, { recursive: true });
  const plan = createVerificationPlan({ profiles: ['candidate'] });
  const execution = await executePlan(plan, {
    productRoot,
    diagnosticsDirectory: evidence.diagnosticsOutput,
    artifactDirectory: path.join(executionRoot, 'candidate-package'),
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
  if (!fs.existsSync(evidence.timingOutput)) {
    try { writeSummary('failed'); } catch {}
  }
} finally {
  fs.rmSync(executionRoot, { recursive: true, force: true });
}

if (!passed) process.exitCode = results.find((result) => result.status === 'failed')?.exitCode || 1;
