#!/usr/bin/env node

import fs from 'node:fs';
import process from 'node:process';
import { cleanupVerificationTimingEvidence } from './evidence.mjs';

const [summaryPath] = process.argv.slice(2);
if (!summaryPath) {
  process.stderr.write('Usage: node cleanup-evidence.mjs <timing-summary.json>\n');
  process.exitCode = 2;
} else {
  try {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
    const result = cleanupVerificationTimingEvidence(summary);
    process.stdout.write(`${JSON.stringify({ schemaVersion: 'buildr.verification-evidence-cleanup/v1', ...result }, null, 2)}\n`);
    if (!result.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  }
}
