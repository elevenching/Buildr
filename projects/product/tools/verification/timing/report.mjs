#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const [inputFile, outputFile, overallStatus, totalDuration, mvpTimingFile, diagnosticsDirectory] = process.argv.slice(2);
if (!inputFile || !outputFile || !overallStatus || totalDuration === undefined) {
  throw new Error('Usage: node report.mjs <input.tsv> <output.json> <passed|failed> <totalDurationMs> [mvp-timing.tsv]');
}

function parseTimingFile(file) {
  if (!file || !fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [name, status, exitCode, durationMs] = line.split('\t');
    return { name, status, exitCode: Number(exitCode), durationMs: Number(durationMs) };
  });
}

const steps = fs.existsSync(inputFile)
  ? parseTimingFile(inputFile)
  : [];
const mvpSections = parseTimingFile(mvpTimingFile);
const mvpStep = steps.find((step) => step.name === 'temporary workspace end-to-end');
if (mvpStep && mvpSections.length > 0) mvpStep.sections = mvpSections;
const summary = {
  schemaVersion: 'buildr.verification-timing/v1',
  status: overallStatus,
  steps,
  totalDurationMs: Number(totalDuration),
};
if (diagnosticsDirectory && fs.existsSync(diagnosticsDirectory)) {
  summary.diagnosticsDirectory = path.resolve(diagnosticsDirectory);
}
fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`[verify-product] timing summary: ${path.resolve(outputFile)}`);
