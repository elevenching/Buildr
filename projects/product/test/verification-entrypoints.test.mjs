import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(productRoot, relative), 'utf8');

test('product verification exposes fast, affected, workspace, and candidate layers', () => {
  const scripts = JSON.parse(read('package.json')).scripts;
  assert.equal(scripts.test, './tools/verify-buildr-product-fast');
  assert.equal(scripts['test:fast'], './tools/verify-buildr-product-fast');
  assert.equal(scripts['test:affected'], './tools/verify-buildr-product-affected');
  assert.equal(scripts['test:workspace'], 'node tools/verification/workspace/run.mjs');
  assert.equal(scripts['test:candidate'], './tools/verify-buildr-product');

  const fast = read('tools/verify-buildr-product-fast');
  for (const required of [
    'npm run test:unit',
    'verification/cli/architecture.mjs',
    'verification/openspec/spec-quality.mjs',
    'openspec validate --all --strict',
    'verification/runtime/adapter-contract.mjs',
  ]) assert.ok(fast.includes(required), `fast verifier must include ${required}`);
  for (const forbidden of ['npm pack', 'npm install', 'verification/workspace/run.mjs', 'release-smoke.mjs']) {
    assert.equal(fast.includes(forbidden), false, `fast verifier must exclude ${forbidden}`);
  }
});

test('affected verification runs fast once and de-duplicates shared steps', () => {
  const affected = read('tools/verify-buildr-product-affected');
  assert.equal((affected.match(/npm run test:fast/g) || []).length, 1);
  assert.ok(affected.includes('run_once()'));
  assert.equal((affected.match(/run_once open-source-candidate/g) || []).length, 2);
  assert.ok(affected.includes('*" $step_id "*) return 0'));
  assert.equal(affected.includes('verification/cli/architecture.mjs'), false);
  assert.equal(affected.includes('verification/runtime/adapter-contract.mjs'), false);
  assert.ok(affected.includes('runtime)'));
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

test('candidate verification retains every release gate and one shared package build', () => {
  const wrapper = read('tools/verify-buildr-product');
  const candidate = read('tools/verification/candidate.mjs');
  assert.ok(wrapper.includes('tools/verification/candidate.mjs'));
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
    'package check',
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
  ]) assert.ok(candidate.includes(`'${stage}'`), `candidate verifier must retain ${stage}`);
  assert.equal((candidate.match(/createCandidatePackage\(/g) || []).length, 1);
  assert.equal((candidate.match(/runBatch\(\[/g) || []).length, 3);
  assert.equal((candidate.match(/workspaceSuiteSteps\(/g) || []).length, 1);
  const workspaceSuites = read('tools/verification/workspace/suites.mjs');
  for (const suite of ['workspace-lifecycle', 'ownership-recovery', 'runtime-reconciliation']) {
    assert.ok(workspaceSuites.includes(`id: '${suite}'`), `Workspace E2E registry must retain ${suite}`);
  }
  assert.ok(candidate.includes("test/capability-cli.integration.mjs"));
});
