#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  CANDIDATE_PACK_METADATA_ENV,
  CANDIDATE_TARBALL_ENV,
  createCandidatePackage,
} from './release/candidate-package.mjs';
import { runVerificationBatch, runVerificationStep } from './timing/parallel-runner.mjs';
import { CANDIDATE_TOTAL_BUDGET_MS, candidateStepBudget } from './timing/budgets.mjs';
import { workspaceSuiteSteps } from './workspace/suites.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const nodeModulesBin = path.join(productRoot, 'node_modules', '.bin');
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const openspecExecutable = path.join(nodeModulesBin, process.platform === 'win32' ? 'openspec.cmd' : 'openspec');
const buildr = path.join(productRoot, 'tools', 'buildr');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-candidate-verification-'));
const timingFile = path.join(root, 'timing.tsv');
const candidatePackageDirectory = path.join(root, 'candidate-package');
const timingOutput = process.env.BUILDR_TIMING_OUTPUT || path.join(os.tmpdir(), 'buildr-product-verification-timing.json');
const diagnosticsOutput = process.env.BUILDR_DIAGNOSTICS_OUTPUT || timingOutput.replace(/\.json$/, '') + '-diagnostics';
const reporter = path.join(productRoot, 'tools', 'verification', 'timing', 'report.mjs');
const totalStartedAt = Date.now();
const results = [];
const baseEnv = { ...process.env, PATH: `${nodeModulesBin}${path.delimiter}${process.env.PATH || ''}` };

fs.writeFileSync(timingFile, '');
fs.rmSync(diagnosticsOutput, { recursive: true, force: true });
fs.mkdirSync(diagnosticsOutput, { recursive: true });

function nodeStep(name, relative, args = [], env = {}) {
  return { name, command: process.execPath, args: [path.join(productRoot, relative), ...args], cwd: productRoot, env: { ...baseEnv, ...env }, diagnosticsDirectory: diagnosticsOutput, budgetMs: candidateStepBudget(name) };
}

function commandStep(name, command, args = [], env = {}, options = {}) {
  return { name, command, args, cwd: productRoot, env: { ...baseEnv, ...env }, shell: options.shell ?? false, diagnosticsDirectory: diagnosticsOutput, budgetMs: candidateStepBudget(name) };
}

function printStart(step) {
  process.stdout.write(`\n[verify-product] ${step.name}\n`);
}

function printResult(result, options = {}) {
  if (!options.suppressStdout && result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  process.stdout.write(`[verify-product] ${result.status}: ${result.name} (${result.durationMs} ms)\n`);
}

async function runSerial(step, options = {}) {
  printStart(step);
  const result = await runVerificationStep(step);
  results.push(result);
  printResult(result, options);
  return result.status === 'passed';
}

async function runBatch(steps) {
  const batchResults = await runVerificationBatch(steps, { onStart: printStart });
  for (const result of batchResults) printResult(result);
  results.push(...batchResults);
  return batchResults.every((result) => result.status === 'passed');
}

function recordInlineResult(name, startedAt, error = null) {
  const diagnosticBase = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const stdoutPath = path.join(diagnosticsOutput, `${diagnosticBase}.stdout.log`);
  const stderrPath = path.join(diagnosticsOutput, `${diagnosticBase}.stderr.log`);
  fs.writeFileSync(stdoutPath, '', 'utf8');
  fs.writeFileSync(stderrPath, error ? `${error.message}\n` : '', 'utf8');
  const result = {
    name,
    status: error ? 'failed' : 'passed',
    exitCode: error ? 1 : 0,
    durationMs: Date.now() - startedAt,
    stdout: '',
    stderr: error ? `${error.message}\n` : '',
    stdoutPath,
    stderrPath,
  };
  results.push(result);
  printResult(result);
  return result;
}

function writeSummary(status) {
  const rows = results.map((result) => `${result.name}\t${result.status}\t${result.exitCode}\t${result.durationMs}\t${result.budgetMs ?? ''}\t${result.stdoutPath ?? ''}\t${result.stderrPath ?? ''}`).join('\n');
  fs.writeFileSync(timingFile, rows ? `${rows}\n` : '');
  const report = spawnSync(process.execPath, [
    reporter,
    timingFile,
    timingOutput,
    status,
    String(Date.now() - totalStartedAt),
    diagnosticsOutput,
    String(CANDIDATE_TOTAL_BUDGET_MS),
  ], { cwd: productRoot, encoding: 'utf8', env: baseEnv });
  if (report.stdout) process.stdout.write(report.stdout);
  if (report.stderr) process.stderr.write(report.stderr);
  if (report.status !== 0) throw new Error(`timing reporter failed with exit ${report.status}`);
}

async function main() {
  const serialSteps = [
    commandStep('fine-grained unit tests', npmExecutable, ['run', 'test:unit'], {}, { shell: process.platform === 'win32' }),
    nodeStep('CLI modular architecture', 'tools/verification/cli/architecture.mjs'),
    nodeStep('OpenSpec canonical spec quality', 'tools/verification/openspec/spec-quality.mjs'),
    commandStep('openspec strict validation', openspecExecutable, ['validate', '--all', '--strict']),
  ];
  for (const step of serialSteps) if (!await runSerial(step)) return false;

  const packageStepName = 'candidate npm tarball';
  printStart({ name: packageStepName });
  const packageStartedAt = Date.now();
  let candidatePackage;
  try {
    candidatePackage = createCandidatePackage(productRoot, candidatePackageDirectory, { npmExecutable });
    recordInlineResult(packageStepName, packageStartedAt);
  } catch (error) {
    recordInlineResult(packageStepName, packageStartedAt, error);
    return false;
  }
  const sharedEnv = {
    [CANDIDATE_TARBALL_ENV]: candidatePackage.tarball,
    [CANDIDATE_PACK_METADATA_ENV]: candidatePackage.metadataPath,
  };

  for (const step of [
    nodeStep('open-source candidate', 'tools/verification/release/open-source-candidate.mjs', [], sharedEnv),
    nodeStep('OpenSpec contract candidate audit', 'tools/verification/openspec/contract-audit.mjs'),
    nodeStep('managed mutations', 'tools/verification/integrity/managed-mutations.mjs'),
    nodeStep('runtime adapter contract', 'tools/verification/runtime/adapter-contract.mjs'),
  ]) if (!await runSerial(step)) return false;

  if (!await runBatch([
    nodeStep('capability CLI integration', 'test/capability-cli.integration.mjs'),
    nodeStep('OpenSpec contract fixtures', 'tools/verification/openspec/contract.mjs'),
    commandStep('package check', process.execPath, [buildr, 'package', 'check']),
    nodeStep('runtime adapter parity', 'tools/verification/runtime/adapter-parity.mjs'),
  ])) return false;

  if (!await runBatch(workspaceSuiteSteps({ productRoot, env: baseEnv }).map((step) => ({ ...step, diagnosticsDirectory: diagnosticsOutput })))) return false;

  if (!await runBatch([
    nodeStep('repository onboarding from a clean checkout', 'tools/verification/onboarding/repository.mjs'),
    nodeStep('single-command init onboarding', 'tools/verification/onboarding/init.mjs'),
    nodeStep('CLI compatibility', 'tools/verification/cli/compatibility.mjs'),
    nodeStep('runtime adapter smoke workspace generator', 'tools/verification/runtime/adapter-smoke-workspace.test.mjs'),
  ])) return false;

  if (!await runBatch([
    nodeStep('CLI package parity', 'tools/verification/cli/package-parity.mjs', [], sharedEnv),
    nodeStep('Service branch contract', 'tools/verification/onboarding/service-branch.mjs'),
    nodeStep('remote Skill timeout contract', 'tools/verification/network/remote-text.mjs'),
    nodeStep('release tarball smoke', 'tools/verification/release/release-smoke.mjs', [], sharedEnv),
    nodeStep('managed data integrity', 'tools/verification/integrity/managed-data-integrity.mjs'),
  ])) return false;

  return true;
}

let passed = false;
try {
  passed = await main();
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
