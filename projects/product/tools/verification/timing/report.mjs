#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const [inputFile, outputFile, overallStatus, totalDuration] = process.argv.slice(2);
if (!inputFile || !outputFile || !overallStatus || totalDuration === undefined) {
  throw new Error('Usage: node report.mjs <input.tsv> <output.json> <passed|failed> <totalDurationMs>');
}

const steps = fs.existsSync(inputFile)
  ? fs.readFileSync(inputFile, 'utf8').trim().split(/\r?\n/).filter(Boolean).map((line) => {
    const [name, status, exitCode, durationMs] = line.split('\t');
    return { name, status, exitCode: Number(exitCode), durationMs: Number(durationMs) };
  })
  : [];
const summary = {
  schemaVersion: 'buildr.verification-timing/v1',
  status: overallStatus,
  steps,
  totalDurationMs: Number(totalDuration),
};
fs.mkdirSync(path.dirname(path.resolve(outputFile)), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
console.log(`[verify-product] timing summary: ${path.resolve(outputFile)}`);
