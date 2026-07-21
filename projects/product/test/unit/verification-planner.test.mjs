import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  auditVerificationInputCoverage,
  createVerificationPlan,
  globToRegExp,
  matchesInput,
  normalizeProductPath,
  validateVerificationRegistry,
} from '../../tools/verification/planner.mjs';
import { verificationSteps } from '../../tools/verification/registry.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const ids = (plan) => plan.steps.map((step) => step.id);

test('统一 registry 固化 fast 与 Candidate required gates', () => {
  const validation = validateVerificationRegistry();
  assert.deepEqual(validation, { ok: true, findings: [] });
  assert.equal(new Set(verificationSteps.map((step) => step.id)).size, verificationSteps.length);
  assert.deepEqual(ids(createVerificationPlan({ profiles: ['fast'] })), [
    'unit', 'contract', 'integration-fast', 'cli-architecture', 'openspec-spec-quality', 'openspec-strict', 'runtime-adapter-contract',
  ]);
  const candidate = createVerificationPlan({ profiles: ['candidate'] });
  for (const required of [
    'candidate-tarball', 'capability-cli-integration', 'package-static', 'package-runtime',
    'runtime-adapter-parity', 'workspace-lifecycle', 'runtime-reconciliation',
    'repository-onboarding', 'cli-package-parity', 'release-tarball-smoke', 'managed-data-integrity', 'docs-quality',
  ]) assert.ok(ids(candidate).includes(required), `candidate must retain ${required}`);
});

test('Product path 和 glob matcher 在 Node 20 语义下稳定工作', () => {
  assert.equal(normalizeProductPath('./docs/guide.md'), 'docs/guide.md');
  assert.throws(() => normalizeProductPath('../outside'), /escapes root/);
  assert.throws(() => normalizeProductPath('/tmp/file'), /Invalid Product path/);
  assert.match('docs/nested/guide.md', globToRegExp('**/*.md'));
  assert.equal(matchesInput('tools/cli/domains/rules.mjs', 'tools/**/*.mjs'), true);
  assert.equal(matchesInput('tools/buildr', 'tools/**/*.mjs'), false);
});

test('docs-only changed plan 只选择轻量文档 owner', () => {
  const plan = createVerificationPlan({ paths: ['docs/buildr-product.md'] });
  assert.deepEqual(ids(plan), ['docs-quality']);
  assert.match(plan.steps[0].reasons[0], /docs\/buildr-product\.md matches/);
});

test('CLI 与 OpenSpec 路径只选择真实 owner 和依赖', () => {
  const cli = ids(createVerificationPlan({ paths: ['tools/cli/domains/rules.mjs'] }));
  for (const required of ['contract', 'cli-architecture', 'capability-cli-integration', 'cli-compatibility', 'cli-package-parity', 'package-rules', 'managed-mutations', 'managed-data-integrity']) {
    assert.ok(cli.includes(required), `CLI plan must include ${required}`);
  }
  assert.equal(cli.includes('unit'), false);
  assert.equal(cli.includes('integration-fast'), false);
  assert.ok(cli.indexOf('candidate-tarball') < cli.indexOf('cli-package-parity'));
  const openspec = ids(createVerificationPlan({ paths: ['openspec/specs/product-verification-quality/spec.md'] }));
  for (const required of ['openspec-spec-quality', 'openspec-strict', 'openspec-candidate-audit', 'openspec-contract-fixtures', 'docs-quality']) {
    assert.ok(openspec.includes(required), `OpenSpec plan must include ${required}`);
  }
});

test('focus step 与 group 去重且只展开真实 artifact 依赖', () => {
  const plan = createVerificationPlan({ stepIds: ['release-tarball-smoke', 'release-tarball-smoke'], groups: ['release'] });
  assert.deepEqual(plan.stepIds, ['release-tarball-smoke']);
  assert.deepEqual(plan.groups, ['release']);
  assert.deepEqual(ids(plan), ['candidate-tarball', 'open-source-candidate', 'release-tarball-smoke']);
  assert.equal(ids(plan).includes('unit'), false);
  assert.throws(() => createVerificationPlan({ stepIds: ['unknown'] }), /Unknown verification step/);
});

test('未映射 Product path fail closed', () => {
  assert.throws(() => createVerificationPlan({ paths: ['new-area/contract.bin'] }), /Unmapped Product paths/);
});

test('registry validation 在启动前拒绝重复、未知依赖、未知 executor 和 cycle', () => {
  const base = {
    name: 'step', executor: { type: 'node', file: 'x.mjs' }, profiles: [], groups: [], inputs: [], concurrencyClass: 'default', dependsOn: [],
  };
  const invalid = [
    { ...base, id: 'a' },
    { ...base, id: 'c', dependsOn: ['d'] },
    { ...base, id: 'd', dependsOn: ['c'] },
    { ...base, id: 'a', executor: { type: 'mystery' }, schedulingCostMs: 0 },
  ];
  const result = validateVerificationRegistry(invalid);
  assert.equal(result.ok, false);
  for (const code of ['duplicate_or_missing_id', 'missing_inputs', 'unknown_executor', 'invalid_scheduling_cost', 'dependency_cycle']) {
    assert.ok(result.findings.some((finding) => finding.code === code), `missing ${code}`);
  }
});

test('registry validation 拒绝缺少 producer 依赖的 artifact consumer', () => {
  const definitions = [
    { id: 'artifact', name: 'artifact', executor: { type: 'candidate-artifact' }, profiles: [], groups: [], inputs: ['package.json'], concurrencyClass: 'default', dependsOn: [] },
    { id: 'consumer', name: 'consumer', executor: { type: 'node', file: 'x.mjs', consumesArtifact: true }, profiles: [], groups: [], inputs: ['x.mjs'], concurrencyClass: 'default', dependsOn: [] },
  ];
  const result = validateVerificationRegistry(definitions);
  assert.ok(result.findings.some((finding) => finding.code === 'missing_artifact_dependency' && finding.step === 'consumer'));
});

test('当前 Product inventory 每条路径都有 verifier owner 或显式 ignore', () => {
  const inventory = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: productRoot, encoding: 'utf8' })
    .split('\0')
    .filter((relative) => relative && fs.existsSync(path.join(productRoot, relative)));
  const audit = auditVerificationInputCoverage(inventory);
  assert.deepEqual(audit.unmapped, []);
  assert.equal(audit.ok, true);
});
