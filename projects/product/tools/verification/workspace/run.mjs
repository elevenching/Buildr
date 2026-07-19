#!/usr/bin/env node

import process from 'node:process';
import { runVerificationBatch } from '../timing/parallel-runner.mjs';
import { selectWorkspaceSuites, workspaceSuites } from './suites.mjs';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  process.stdout.write('Usage: npm run test:workspace -- [--list|<suite>...]\n');
  process.exit(0);
}
if (args.includes('--list')) {
  if (args.length !== 1) {
    process.stderr.write('--list cannot be combined with suite selectors.\n');
    process.exit(2);
  }
  for (const suite of workspaceSuites) process.stdout.write(`${suite.id}\n`);
  process.exit(0);
}
if (args.some((arg) => arg.startsWith('-'))) {
  process.stderr.write(`Unknown Workspace E2E option: ${args.find((arg) => arg.startsWith('-'))}\n`);
  process.exit(2);
}

let selected;
try {
  selected = selectWorkspaceSuites(args);
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exit(2);
}

const definitions = new Map(workspaceSuites.map((suite) => [suite.id, suite]));
const steps = selected.map((suite) => ({
  name: suite.name,
  command: process.execPath,
  args: [suite.file],
  cwd: process.cwd(),
  env: process.env,
  budgetMs: definitions.get(suite.id).budgetMs,
}));
const results = await runVerificationBatch(steps, {
  onStart: (step) => process.stdout.write(`[workspace-e2e] started: ${step.name}\n`),
});
for (const result of results) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.stdout.write(`[workspace-e2e] ${result.status}: ${result.name} (${result.durationMs} ms)\n`);
  if (result.budgetStatus === 'over') process.stderr.write(`[workspace-e2e] warning: ${result.name} exceeded ${result.budgetMs} ms target budget.\n`);
}
if (results.some((result) => result.status === 'failed')) process.exitCode = results.find((result) => result.status === 'failed').exitCode || 1;
else process.stdout.write(`Workspace E2E passed: ${selected.map((suite) => suite.id).join(', ')}\n`);
