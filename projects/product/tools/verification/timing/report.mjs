#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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
const summary = {
  schemaVersion: 'buildr.verification-timing/v1',
  status: overallStatus,
  steps,
  totalDurationMs: Number(totalDuration),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    ci: process.env.CI === 'true',
  },
};
if (totalBudget) {
  summary.budgetMs = Number(totalBudget);
  summary.budgetStatus = summary.totalDurationMs <= summary.budgetMs ? 'within' : 'over';
}
if (diagnosticsDirectory && fs.existsSync(diagnosticsDirectory)) {
  summary.diagnosticsDirectory = path.resolve(diagnosticsDirectory);
}
fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`[verify-product] timing summary: ${path.resolve(outputFile)}`);
for (const step of steps.filter((item) => item.budgetStatus === 'over')) {
  console.warn(`[verify-product] warning: ${step.name} exceeded ${step.budgetMs} ms target budget.`);
}
if (summary.budgetStatus === 'over') console.warn(`[verify-product] warning: candidate exceeded ${summary.budgetMs} ms target budget.`);
