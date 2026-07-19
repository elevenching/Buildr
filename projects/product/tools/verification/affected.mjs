#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { VERIFICATION_GROUPS } from './registry.mjs';
import { createVerificationPlan } from './planner.mjs';
import { executePlan } from './plan-runner.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function usage(stream = process.stdout) {
  stream.write('Usage: tools/verify-buildr-product-affected <group> [group...]\n');
  stream.write('       tools/verify-buildr-product-affected --help\n\nGroups:\n');
  for (const group of VERIFICATION_GROUPS) stream.write(`  ${group}\n`);
  stream.write('\nAffected verification includes the fast profile once. Final candidates must run test:candidate.\n');
}

const args = process.argv.slice(2);
if (args.length === 1 && ['--help', '-h'].includes(args[0])) usage();
else if (args.length === 0) {
  usage(process.stderr);
  process.exitCode = 2;
} else {
  const unknown = args.filter((group) => !VERIFICATION_GROUPS.includes(group));
  if (unknown.length > 0) {
    process.stderr.write(`Unknown affected verification group: ${unknown.join(', ')}\n`);
    usage(process.stderr);
    process.exitCode = 2;
  } else {
    const groups = [...new Set(args)];
    const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-affected-verification-'));
    try {
      const plan = createVerificationPlan({ profiles: ['fast'], groups });
      const execution = await executePlan(plan, {
        productRoot,
        diagnosticsDirectory: path.join(temporaryRoot, 'diagnostics'),
        artifactDirectory: path.join(temporaryRoot, 'candidate-package'),
        stream: process.stdout,
        errorStream: process.stderr,
      });
      if (!execution.passed) process.exitCode = 1;
      else process.stdout.write(`Buildr affected verification passed: ${groups.join(' ')}\n`);
    } catch (error) {
      process.stderr.write(`${error.stack || error.message}\n`);
      process.exitCode = 1;
    } finally {
      fs.rmSync(temporaryRoot, { recursive: true, force: true });
    }
  }
}
