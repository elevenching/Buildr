import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { createRuntimeDiagnostics } from '../../tools/cli/application/doctor/runtime-diagnostics.mjs';
import { createScopeDiagnostics } from '../../tools/cli/application/doctor/scope-diagnostics.mjs';
import { buildDoctorHealth, buildDoctorRepairPlan } from '../../tools/cli/application/doctor/result-model.mjs';
import { PACKAGE_VERIFIERS, selectPackageVerifiers } from '../../tools/cli/application/package-maintenance/verification-registry.mjs';

test('package verifier selector 保持稳定顺序、去重并拒绝未知 owner', () => {
  assert.deepEqual(selectPackageVerifiers().map((item) => item.id), PACKAGE_VERIFIERS.map((item) => item.id));
  assert.deepEqual(selectPackageVerifiers('runtime,static,runtime').map((item) => item.id), ['static', 'runtime']);
  assert.throws(() => selectPackageVerifiers('static,unknown'), /Unknown package verifier: unknown/);
});

test('runtime doctor 过滤 info 并汇总全部 finding status', () => {
  const recorded = [];
  const diagnostics = createRuntimeDiagnostics({
    RUNTIME_CHECKERS: {},
    SUPPORTED_AGENT_IDS: ['codex'],
    UNSUPPORTED_AGENT_GUIDANCE: { message: 'unsupported ', nextStep: 'choose supported' },
    addDoctorFinding: (...args) => recorded.push(args),
    componentRegistryPath: () => '',
    existsFile: () => true,
    getRuntimeAdapter: () => ({ traits: { checker: {} } }),
    isSupportedAgent: (agent) => agent === 'codex',
    managedRuntimeSkillOrphans: () => [],
    packageComponentsStatus: () => ({ components: [], ownership: [], findings: [] }),
    path,
    runCommandsCheck: () => ({ findings: [] }),
    runtimeImplementation: () => () => ({ findings: [] }),
    toPosixRelative: (_root, value) => value,
  });
  const findings = [{ status: 'ok' }, { status: 'info' }, { status: 'warning' }, { status: 'conflict' }];
  assert.deepEqual(diagnostics.runtimeFindingsForDoctor(findings, false), [findings[0], findings[2], findings[3]]);
  assert.deepEqual(diagnostics.summarizeRuntimeFindings(findings), {
    ok: 1, info: 1, warning: 1, missing: 0, stale: 0, orphan: 0, conflict: 1,
  });
  diagnostics.addUnsupportedAgentFinding({}, 'unknown');
  assert.equal(recorded[0][1], 'warning');
  assert.equal(recorded[0][2], 'runtime.agent_unsupported');
  assert.equal(recorded[0][4].mustNotUseFallbackAdapter, true);
});

test('doctor scope parser 只接受 root/project 层级并稳定发现显式 scope', () => {
  const diagnostics = createScopeDiagnostics({
    addDoctorFinding: () => {},
    execFileSync: () => {},
    existsDirectory: () => false,
    existsFile: () => false,
    fs,
    gitBoundaryFor: () => null,
    gitBoundaryIgnored: () => true,
    gitOutput: () => '',
    parseProjectsYaml: () => ({}),
    parseYamlValue: (value) => value,
    path,
    projectsManifestPath: (root) => path.join(root, 'projects', 'manifest.yml'),
    servicesManifestPath: (root) => path.join(root, 'services', 'manifest.yml'),
    toPosixRelative: (_root, value) => value,
    validateProjectsRegistry: () => [],
  });
  assert.deepEqual(diagnostics.scopeParts('.'), ['.']);
  assert.deepEqual(diagnostics.scopeParts('projects/product/services/api'), ['projects', 'product', 'services', 'api']);
  assert.throws(() => diagnostics.scopeParts('organizations/acme'), /not supported/);
  assert.throws(() => diagnostics.scopeParts('projects'), /must be projects/);
  assert.deepEqual(diagnostics.discoverDoctorScopes('/workspace', 'projects/product/services/api'), [{
    org: 'workspace', project: 'product', servicePath: 'api', scope: 'projects/product/services/api',
  }]);
});

test('doctor health 分离 ok、workspace validity 与 action requirement', () => {
  assert.deepEqual(buildDoctorHealth({
    workspace: { identity: { state: 'valid' } },
    findings: [
      { status: 'info', userActionRequired: false },
      { status: 'warning', userActionRequired: false },
    ],
  }), {
    workspaceValid: true,
    ready: true,
    actionRequired: false,
    actionableCount: 0,
  });
  assert.deepEqual(buildDoctorHealth({
    workspace: { identity: { state: 'valid' } },
    findings: [{ status: 'warning', userActionRequired: true }],
  }), {
    workspaceValid: true,
    ready: false,
    actionRequired: true,
    actionableCount: 1,
  });
});

test('doctor repair plan 按根因动作去重并让 error 优先', () => {
  assert.deepEqual(buildDoctorRepairPlan([
    { status: 'warning', code: 'runtime.one', suggestion: '重新 render。', commands: ['buildr render'] },
    { status: 'warning', code: 'runtime.two', suggestion: '重新 render。', command: 'buildr render' },
    { status: 'error', code: 'workspace.invalid', suggestion: '重新初始化。', command: 'buildr init' },
    { status: 'info', code: 'metadata.stale', suggestion: '无需操作。', userActionRequired: false },
  ]), [
    {
      id: 'repair-1',
      priority: 'blocking',
      codes: ['workspace.invalid'],
      suggestion: '重新初始化。',
      commands: ['buildr init'],
    },
    {
      id: 'repair-2',
      priority: 'required',
      codes: ['runtime.one', 'runtime.two'],
      suggestion: '重新 render。',
      commands: ['buildr render'],
    },
  ]);
});
