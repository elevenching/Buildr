import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PACKAGE_VERIFIERS, selectPackageVerifiers } from '../tools/cli/application/package-maintenance/verification-registry.mjs';
import { createVerificationPlan } from '../tools/verification/planner.mjs';
import { verificationSteps } from '../tools/verification/registry.mjs';
import { workspaceSuites } from '../tools/verification/workspace/suites.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(productRoot, relative), 'utf8');

test('product verification exposes fast, affected, workspace, and candidate layers', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.equal(scripts.test, './tools/verify-buildr-product-fast');
  assert.equal(scripts['test:fast'], './tools/verify-buildr-product-fast');
  assert.equal(scripts['test:affected'], './tools/verify-buildr-product-affected');
  assert.equal(scripts['test:changed'], 'node tools/verification/changed.mjs');
  assert.equal(scripts['test:package'], 'node tools/verification/package/run.mjs');
  assert.equal(scripts['test:workspace'], 'node tools/verification/workspace/run.mjs');
  assert.equal(scripts['test:candidate'], './tools/verify-buildr-product');

  const fast = read('tools/verify-buildr-product-fast');
  assert.match(fast, /verification\/profile\.mjs" fast/);
  const fastIds = createVerificationPlan({ profiles: ['fast'] }).steps.map((step) => step.id);
  assert.deepEqual(fastIds, ['unit', 'cli-architecture', 'openspec-spec-quality', 'openspec-strict', 'runtime-adapter-contract']);
  for (const forbidden of ['npm pack', 'npm install', 'verification/workspace/run.mjs', 'release-smoke.mjs']) {
    assert.equal(fast.includes(forbidden), false, `fast verifier must exclude ${forbidden}`);
  }
});

test('affected verification runs fast once and de-duplicates shared steps', () => {
  const affected = read('tools/verify-buildr-product-affected');
  assert.match(affected, /verification\/affected\.mjs/);
  assert.ok(affected.split(/\r?\n/).length < 15);
  const plan = createVerificationPlan({ profiles: ['fast'], groups: ['public', 'release', 'public'] });
  assert.equal(plan.steps.filter((step) => step.id === 'unit').length, 1);
  assert.equal(plan.steps.filter((step) => step.id === 'open-source-candidate').length, 1);
  assert.equal(plan.steps.filter((step) => step.id === 'candidate-tarball').length, 1);
});

test('affected verification validates help and unknown groups before fast', () => {
  const runner = path.join(productRoot, 'tools', 'verify-buildr-product-affected');
  const help = spawnSync(runner, ['--help'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Groups:/);
  assert.doesNotMatch(help.stdout, /Buildr fast verification/);

  const unknown = spawnSync(runner, ['unknown'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown affected verification group/);
  assert.doesNotMatch(`${unknown.stdout}${unknown.stderr}`, /Buildr fast verification/);
});

test('candidate verification retains every release gate and split package steps', () => {
  const wrapper = read('tools/verify-buildr-product');
  const candidate = read('tools/verification/candidate.mjs');
  assert.ok(wrapper.includes('tools/verification/candidate.mjs'));
  assert.ok(candidate.includes("profiles: ['candidate']"));
  assert.ok(candidate.split(/\r?\n/).length < 100);
  const candidatePlan = createVerificationPlan({ profiles: ['candidate'] });
  assert.equal(candidatePlan.steps.length, 30);
  for (const stage of [
    'fine-grained unit tests',
    'CLI modular architecture',
    'OpenSpec canonical spec quality',
    'openspec strict validation',
    'candidate npm tarball',
    'open-source candidate',
    'OpenSpec contract candidate audit',
    'managed mutations',
    'repository onboarding from a clean checkout',
    'single-command init onboarding',
    'CLI compatibility',
    'CLI package parity',
    'runtime adapter contract',
    'runtime adapter parity',
    'runtime adapter smoke workspace generator',
    'capability CLI integration',
    'Service branch contract',
    'remote Skill timeout contract',
    'release tarball smoke',
    'managed data integrity',
    'OpenSpec contract fixtures',
  ]) assert.ok(candidatePlan.steps.some((step) => step.name === stage), `candidate verifier must retain ${stage}`);
  assert.deepEqual(PACKAGE_VERIFIERS.map((step) => step.id), ['static', 'workspace', 'commands', 'rules', 'skills', 'runtime']);
  assert.equal(verificationSteps.filter((step) => step.executor.type === 'candidate-artifact').length, 1);
  assert.equal(candidate.includes('createCandidatePackage'), false);
  for (const suite of ['workspace-lifecycle', 'ownership-recovery', 'runtime-reconciliation']) {
    assert.ok(workspaceSuites.some((step) => step.id === suite), `Workspace E2E registry must retain ${suite}`);
  }
  assert.ok(candidatePlan.steps.some((step) => step.executor.file === 'test/capability-cli.integration.mjs'));
});

test('package verifier selectors are stable, focused, and fail closed', () => {
  assert.deepEqual(selectPackageVerifiers('static,runtime').map((step) => step.id), ['static', 'runtime']);
  assert.throws(() => selectPackageVerifiers('unknown'), /Unknown package verifier/);

  const runner = path.join(productRoot, 'tools', 'verification', 'package', 'run.mjs');
  const help = spawnSync(process.execPath, [runner, '--help'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  for (const step of PACKAGE_VERIFIERS) assert.match(help.stdout, new RegExp(`\\b${step.id}\\b`));

  const unknown = spawnSync(process.execPath, [runner, 'unknown'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown package verifier/);
});

test('changed verification exposes plan/json and rejects unknown options before execution', () => {
  const runner = path.join(productRoot, 'tools', 'verification', 'changed.mjs');
  const json = spawnSync(process.execPath, [runner, '--json', 'docs/buildr-product.md'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(json.status, 0, json.stderr);
  const payload = JSON.parse(json.stdout);
  assert.equal(payload.schemaVersion, 'buildr.verification-plan/v1');
  assert.deepEqual(payload.paths, ['docs/buildr-product.md']);
  assert.deepEqual(payload.steps.map((step) => step.id), ['docs-quality']);

  const unknown = spawnSync(process.execPath, [runner, '--unknown'], { cwd: productRoot, encoding: 'utf8' });
  assert.equal(unknown.status, 2);
  assert.match(unknown.stderr, /Unknown test:changed option/);
  assert.doesNotMatch(unknown.stderr, /\[verify\]/);
});
