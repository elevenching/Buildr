#!/usr/bin/env node

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ADAPTER_VERIFICATION_LEVELS,
  ADAPTER_TRAIT_CATALOG,
  REQUIRED_RENDER_CAPABILITIES,
  RUNTIME_ADAPTERS,
  SUPPORTED_AGENT_IDS,
  createRuntimeAdapterDescriptor,
  createRuntimeAdapterRegistry,
  createRuntimeContext,
  createRuntimePlan,
  getRuntimeAdapter,
  reconcileRuntimePlan,
  runtimeDiscoveryPayload,
  selectAdapterImplementation,
  validateRuntimePlan,
} from '../../runtime/adapter-contract.mjs';
import { resolveSkillContributions } from '../../runtime/render-claude-code.mjs';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const repositoryRoot = path.resolve(productRoot, '../..');

assert.deepEqual(SUPPORTED_AGENT_IDS, ['claude-code', 'codex', 'cursor', 'qoder', 'trae', 'trae-work', 'workbuddy']);
assert.deepEqual(ADAPTER_VERIFICATION_LEVELS, ['documented', 'verified']);
assert.deepEqual(ADAPTER_TRAIT_CATALOG.rules, ['native-recursive', 'native-root', 'reference-bridge', 'vendor-rule-files']);
assert.equal(runtimeDiscoveryPayload().adapterTraitCatalog, ADAPTER_TRAIT_CATALOG);
for (const adapter of Object.values(RUNTIME_ADAPTERS)) {
  assert.ok(adapter.traits);
  assert.deepEqual(Object.keys(adapter.renderCapabilities), REQUIRED_RENDER_CAPABILITIES);
  const root = path.join(os.tmpdir(), `buildr-adapter-${adapter.id}`);
  const context = createRuntimeContext({
    adapterId: adapter.id,
    targetRoot: root,
    scope: '.',
    rules: { writes: [], nativeAssets: [path.join(root, 'AGENTS.md')], removals: [], actions: [] },
    skills: { writes: [], removals: [] },
  });
  validateRuntimePlan(adapter.planRuntime(context), adapter);
}

for (const adapterId of ['cursor', 'qoder', 'trae', 'trae-work', 'workbuddy']) {
  const adapter = RUNTIME_ADAPTERS[adapterId];
  assert.ok(adapter.evidence.rules, `${adapterId} must retain runtime-specific Rules evidence`);
  assert.ok(adapter.evidence.skills, `${adapterId} must retain runtime-specific Skills evidence`);
  assert.equal(adapter.evidence.verificationLevel, adapterId === 'workbuddy' ? 'verified' : 'documented');
  assert.equal(adapter.evidence.smokeStatus, adapterId === 'workbuddy' ? 'passed' : 'pending');
  assert.deepEqual(adapter.planRuntime(createRuntimeContext({
    adapterId,
    targetRoot: path.join(os.tmpdir(), `buildr-${adapterId}-evidence`),
    scope: '.',
    rules: { writes: [], nativeAssets: [], removals: [], actions: [] },
    skills: { writes: [], removals: [] },
  })).capabilityEvidence.map((item) => item.adapterId), REQUIRED_RENDER_CAPABILITIES.map(() => adapterId));
}

const adapterDocPath = path.join(productRoot, 'docs', 'agent-runtime-adapters.md');
const adapterDoc = fs.readFileSync(adapterDocPath, 'utf8');
for (const adapterId of SUPPORTED_AGENT_IDS) {
  assert.ok(adapterDoc.includes(`(\`${adapterId}\`)`), `${adapterId} must have an adapter documentation section`);
}
for (const token of ['Rules 接入', 'Skills 接入', '生效/刷新', 'checker', '证据', 'smoke']) assert.ok(adapterDoc.includes(token), `adapter documentation must contain ${token}`);
for (const readmeName of ['README.md', 'README.en.md']) {
  const readme = fs.readFileSync(path.join(repositoryRoot, readmeName), 'utf8');
  assert.ok(readme.includes('projects/product/docs/agent-runtime-adapters.md'), `${readmeName} must link the authoritative adapter documentation`);
}
assert.equal(RUNTIME_ADAPTERS.cursor.traits.rules.kind, 'vendor-rule-files');
assert.equal(RUNTIME_ADAPTERS.qoder.traits.rules.format, 'qoder-markdown');
assert.equal(RUNTIME_ADAPTERS.trae.traits.rules.format, 'trae-markdown');
assert.equal(RUNTIME_ADAPTERS.trae.traits.checker.versionProbe.kind, 'manual');
assert.equal(RUNTIME_ADAPTERS.trae.traits.skills.root, '.agents');
assert.equal(RUNTIME_ADAPTERS.cursor.traits.rules.format, 'cursor-mdc');
assert.equal(RUNTIME_ADAPTERS['trae-work'].traits.rules.placement, 'root-index');
assert.equal(RUNTIME_ADAPTERS.workbuddy.traits.rules.maxChars, 8000);
assert.equal(RUNTIME_ADAPTERS.workbuddy.traits.skills.root, '.codebuddy');
assert.deepEqual(RUNTIME_ADAPTERS.workbuddy.traits.surfaces, [{ kind: 'desktop' }, { kind: 'cli', variant: 'desktop-bundled' }]);
assert.equal(RUNTIME_ADAPTERS.workbuddy.evidence.smoke.surface, 'desktop-bundled-cli');
assert.equal(RUNTIME_ADAPTERS.workbuddy.evidence.smoke.rules.siblingIsolated, 'pass');
assert.equal(RUNTIME_ADAPTERS.workbuddy.evidence.smoke.skill.result, 'SMOKE_SKILL_DISCOVERED_19AF');
assert.ok(adapterDoc.includes('`.codebuddy/skills`'));

assert.throws(() => getRuntimeAdapter('fake-runtime'), /Unsupported Agent runtime/);
assert.throws(() => createRuntimeAdapterRegistry([{ id: 'fake-runtime', runtimeTargets: [], renderCapabilities: {}, recommendedCommands: {} }], { testOnly: true }), /Invalid runtime adapter registry/);

const fakeImplementations = { rules: ['fake-rules'], skills: ['fake-skills'], checker: ['fake-checker'] };
const fakeDescriptor = createRuntimeAdapterDescriptor({
  id: 'fake-runtime',
  displayName: 'Fake Runtime',
  traits: {
    rules: { kind: 'vendor-rule-files', implementation: 'fake-rules', format: 'qoder-markdown', targetPattern: '.fake/rules/<source>.md' },
    skills: { kind: 'vendor-root', implementation: 'fake-skills', root: '.fake' },
    surfaces: [{ kind: 'ide', variant: 'test' }],
    activation: { rules: 'explicit-reload', skills: 'explicit-reload', reloadGuidance: 'Reload Fake Runtime.' },
    checker: {
      kind: 'projection',
      implementation: 'fake-checker',
      installationProbe: { kind: 'manual', guidance: 'Confirm Fake Runtime is installed.' },
      versionProbe: { kind: 'command', executable: 'fake-runtime', args: ['--version'], timeoutMs: 1000 },
    },
  },
  recommendedCommands: {},
}, { implementations: fakeImplementations });
const fakeRegistry = createRuntimeAdapterRegistry([fakeDescriptor], { testOnly: true, implementations: fakeImplementations });
assert.equal(fakeRegistry['fake-runtime'].id, 'fake-runtime');
assert.equal(fakeRegistry['fake-runtime'].traits.skills.root, '.fake');
assert.equal(fakeRegistry['fake-runtime'].renderCapabilities['rules-entry'].projection.mode, 'rendered');
const fakeRulesPlanner = () => 'fake-plan';
assert.equal(selectAdapterImplementation(fakeRegistry['fake-runtime'], 'rules', { 'fake-rules': fakeRulesPlanner }), fakeRulesPlanner);
assert.throws(() => selectAdapterImplementation(fakeRegistry['fake-runtime'], 'rules', {}), /no registered rules implementation/);
assert.equal(RUNTIME_ADAPTERS['fake-runtime'], undefined);

const fakeValue = {
  id: 'invalid-runtime',
  displayName: 'Invalid Runtime',
  recommendedCommands: {},
  traits: {
    rules: { kind: 'vendor-rule-files', implementation: 'fake-rules', format: 'qoder-markdown', targetPattern: '.fake/rules/<source>.md' },
    skills: { kind: 'vendor-root', implementation: 'fake-skills', root: '.fake' },
    surfaces: [{ kind: 'ide' }],
    activation: { rules: 'session-start', skills: 'session-start' },
    checker: { kind: 'projection', implementation: 'fake-checker', installationProbe: { kind: 'none' }, versionProbe: { kind: 'none' } },
  },
};
assert.throws(() => createRuntimeAdapterDescriptor({ ...fakeValue, traits: { ...fakeValue.traits, rules: { ...fakeValue.traits.rules, kind: 'unknown' } } }, { implementations: fakeImplementations }), /rules trait is invalid/);
assert.throws(() => createRuntimeAdapterDescriptor({ ...fakeValue, traits: { ...fakeValue.traits, skills: { ...fakeValue.traits.skills, root: '../escape' } } }, { implementations: fakeImplementations }), /skills root is unsafe/);
assert.throws(() => createRuntimeAdapterDescriptor({ ...fakeValue, traits: { ...fakeValue.traits, rules: { kind: 'native-root', implementation: 'fake-rules' } } }, { implementations: fakeImplementations }), /do not cover recursive scope/);
assert.throws(() => createRuntimeAdapterDescriptor({ ...fakeValue, traits: { ...fakeValue.traits, rules: { ...fakeValue.traits.rules, implementation: 'missing' } } }, { implementations: fakeImplementations }), /no registered rules implementation/);
assert.throws(() => createRuntimeAdapterRegistry([fakeDescriptor, fakeDescriptor], { testOnly: true, implementations: fakeImplementations }), /duplicate adapter id/);

const codex = RUNTIME_ADAPTERS.codex;
const root = path.join(os.tmpdir(), 'buildr-invalid-plan');
const context = createRuntimeContext({ adapterId: 'codex', targetRoot: root, scope: '.', rules: { writes: [], nativeAssets: [], removals: [], actions: [] }, skills: { writes: [], removals: [] } });
const valid = codex.planRuntime(context);
assert.throws(() => validateRuntimePlan({ ...valid, writes: [{ targetFile: path.join(root, '..', 'escape'), content: 'bad' }] }, codex), /outside target root/);
assert.throws(() => validateRuntimePlan({ ...valid, capabilityEvidence: [] }, codex), /missing capability evidence/);

const symlinkPlanRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-plan-symlink-'));
const symlinkPlanOutside = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-plan-outside-'));
fs.mkdirSync(path.join(symlinkPlanRoot, '.agents'), { recursive: true });
fs.symlinkSync(symlinkPlanOutside, path.join(symlinkPlanRoot, '.agents', 'skills'), 'dir');
const symlinkPlanTarget = path.join(symlinkPlanRoot, '.agents', 'skills', 'demo', 'SKILL.md');
assert.throws(() => validateRuntimePlan({ ...valid, targetRoot: symlinkPlanRoot, writes: [{ targetFile: symlinkPlanTarget, content: 'bad' }] }, codex), /crosses a symbolic link/);
assert.throws(() => validateRuntimePlan({ ...valid, targetRoot: symlinkPlanRoot, removals: [{ targetFile: symlinkPlanTarget }] }, codex), /crosses a symbolic link/);

const reconcileRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-reconcile-'));
const targetFile = path.join(reconcileRoot, '.agents', 'skills', 'demo', 'SKILL.md');
const orphanFile = path.join(reconcileRoot, '.agents', 'buildr', 'skill-install-plans', 'orphan.md');
fs.mkdirSync(path.dirname(orphanFile), { recursive: true });
fs.writeFileSync(orphanFile, '<!-- Generated by Buildr. Agent action required. -->\n');
const evidence = REQUIRED_RENDER_CAPABILITIES.map((capability) => ({ capability, supported: true }));
const reconcilePlan = createRuntimePlan({ adapterId: 'codex', targetRoot: reconcileRoot, scope: '.', writes: [{ targetFile, content: 'managed\n', source: 'test', isManaged: (content) => content === 'managed\n' }], nativeAssets: [], removals: [{ targetFile: orphanFile, isManaged: (content) => content.includes('Generated by Buildr') }], capabilityEvidence: evidence });
assert.equal(reconcileRuntimePlan(reconcilePlan).changed.length, 1);
assert.equal(fs.existsSync(orphanFile), false);
assert.equal(reconcileRuntimePlan(reconcilePlan).changed.length, 0);
fs.writeFileSync(targetFile, 'raw source\n');
const adoptionPlan = createRuntimePlan({ adapterId: 'codex', targetRoot: reconcileRoot, scope: '.', writes: [{ targetFile, content: 'managed adoption\n', sourceContent: 'raw source\n', source: 'test', isManaged: () => false }], nativeAssets: [], removals: [], capabilityEvidence: evidence });
assert.equal(reconcileRuntimePlan(adoptionPlan).changed.length, 1);
fs.writeFileSync(targetFile, 'user content\n');
assert.throws(() => reconcileRuntimePlan(reconcilePlan), /no files were changed/);
assert.equal(fs.readFileSync(targetFile, 'utf8'), 'user content\n');

const componentRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-runtime-component-'));
const componentDir = path.join(componentRoot, 'components', 'workspace', 'demo');
const fragmentRelative = 'components/workspace/demo/contributions/demo.md';
const ruleRelative = 'rules/demo.md';
fs.mkdirSync(path.join(componentRoot, 'components'), { recursive: true });
fs.mkdirSync(path.dirname(path.join(componentRoot, fragmentRelative)), { recursive: true });
fs.mkdirSync(path.join(componentRoot, 'rules'), { recursive: true });
fs.writeFileSync(path.join(componentRoot, 'components', 'manifest.yml'), 'schemaVersion: buildr.components/v1\ncomponents:\n  - id: demo\n    path: components/workspace/demo\n    enabled: true\n    state: installed\n');
fs.writeFileSync(path.join(componentRoot, fragmentRelative), 'Contribution\n');
fs.writeFileSync(path.join(componentRoot, ruleRelative), 'Rule\n');
const integrity = (relative) => `sha256-${crypto.createHash('sha256').update(fs.readFileSync(path.join(componentRoot, relative))).digest('hex')}`;
const definition = (extra = '') => `schemaVersion: buildr.component/v1\nid: demo\nkind: addon\nversion: 1.0.0\nsource: workspace\n${extra}members:\n  rules: [${JSON.stringify(ruleRelative)}]\n  skills: []\n  commandCollections: []\n  skillContributions: [${JSON.stringify(fragmentRelative)}]\ncontributions:\n  skillFragments: [${JSON.stringify(`buildr#slot=${fragmentRelative}`)}]\nintegrity: [${JSON.stringify(`${ruleRelative}=${integrity(ruleRelative)}`)}, ${JSON.stringify(`${fragmentRelative}=${integrity(fragmentRelative)}`)}]\n`;
fs.writeFileSync(path.join(componentDir, 'component.yml'), definition('adapter: ./adapter.mjs\n'));
assert.throws(() => resolveSkillContributions(componentRoot), /cannot extend runtime adapters/);
fs.writeFileSync(path.join(componentDir, 'component.yml'), definition());
assert.equal(resolveSkillContributions(componentRoot).length, 1);
fs.writeFileSync(path.join(componentRoot, ruleRelative), 'modified\n');
assert.throws(() => resolveSkillContributions(componentRoot), /Component member integrity mismatch/);

console.log('runtime adapter contract verification passed');
