#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  collectVerificationSourceIdentity,
  createVerificationRunId,
  writeVerificationTimingEvidence,
} from './evidence.mjs';

const [inputFile, outputFile, overallStatus, totalDuration, diagnosticsDirectory, totalBudget] = process.argv.slice(2);
if (!inputFile || !outputFile || !overallStatus || totalDuration === undefined) {
  throw new Error('Usage: node report.mjs <input.tsv> <output.json> <passed|failed> <totalDurationMs> [diagnosticsDirectory] [totalBudgetMs]');
}

function parseTimingFile(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [name, status, exitCode, durationMs, budgetMs, stdoutPath, stderrPath] = line.split('\t');
    const result = { name, status, exitCode: Number(exitCode), durationMs: Number(durationMs) };
    if (budgetMs) {
      result.budgetMs = Number(budgetMs);
      result.budgetStatus = result.durationMs <= result.budgetMs ? 'within' : 'over';
    }
    if (stdoutPath) result.stdoutPath = path.resolve(stdoutPath);
    if (stderrPath) result.stderrPath = path.resolve(stderrPath);
    return result;
  });
}

const steps = fs.existsSync(inputFile)
  ? parseTimingFile(inputFile)
  : [];
const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const finishedAt = Date.now();
writeVerificationTimingEvidence({
  kind: 'candidate',
  runId: createVerificationRunId('candidate-report'),
  source: collectVerificationSourceIdentity(productRoot),
  status: overallStatus,
  results: steps,
  startedAt: finishedAt - Number(totalDuration),
  finishedAt,
  timingOutput: outputFile,
  totalBudgetMs: totalBudget ? Number(totalBudget) : undefined,
  diagnosticsDirectory,
  prefix: 'verify-product',
  stream: process.stdout,
  errorStream: process.stderr,
});
