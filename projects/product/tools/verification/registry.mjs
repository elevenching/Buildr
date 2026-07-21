import { PACKAGE_VERIFIERS } from '../cli/application/package-maintenance/verification-registry.mjs';

const step = (definition) => Object.freeze({
  dependsOn: [],
  profiles: [],
  groups: [],
  inputs: [],
  concurrencyClass: 'default',
  ...definition,
});

const packageVerifier = (selector) => {
  const verifier = PACKAGE_VERIFIERS.find((item) => item.id === selector);
  if (!verifier) throw new Error(`Missing package verifier declaration: ${selector}`);
  return { name: verifier.name, executor: { type: 'package-selector', selector } };
};

export const VERIFICATION_CONCURRENCY = Object.freeze({
  global: 4,
  classes: Object.freeze({
    default: 4,
    'cpu-heavy': 2,
    'workspace-heavy': 3,
    network: 2,
    exclusive: 1,
  }),
});

export const VERIFICATION_IGNORED_INPUTS = Object.freeze([
  'node_modules/**',
  '.buildr/**',
  '.gitignore',
]);

export const verificationSteps = Object.freeze([
  step({ id: 'unit', name: 'fine-grained unit tests', executor: { type: 'npm', args: ['run', 'test:unit'] }, profiles: ['fast', 'candidate'], inputs: [
    'test/unit/**',
    'tools/cli/domains/commands.mjs',
    'tools/cli/application/doctor/runtime-diagnostics.mjs',
    'tools/cli/application/doctor/scope-diagnostics.mjs',
    'tools/cli/application/package-maintenance/verification-registry.mjs',
    'tools/runtime/adapter-contract.mjs',
    'tools/runtime/skills/arguments.mjs',
    'tools/runtime/skills/capabilities.mjs',
    'tools/runtime/skills/manifests.mjs',
    'tools/runtime/skills/primitives.mjs',
    'tools/runtime/skills/render-plan.mjs',
    'tools/verification/dag-scheduler.mjs',
    'tools/verification/planner.mjs',
    'tools/verification/registry.mjs',
    'tools/verification/unit-coverage.mjs',
  ], concurrencyClass: 'cpu-heavy' }),
  step({ id: 'contract', name: 'static contract tests', executor: { type: 'npm', args: ['run', 'test:contract'] }, profiles: ['fast', 'candidate'], inputs: [
    'test/contract/**', 'test/fixtures/**',
    'tools/cli/**',
    'tools/runtime/render-claude-code.mjs',
    'tools/verification/candidate.mjs',
    'tools/verification/changed.mjs',
    'tools/verification/affected.mjs',
    'tools/verification/focus.mjs',
    'tools/verification/executor.mjs',
    'tools/verification/package/run.mjs',
    'tools/verification/plan-runner.mjs',
    'tools/verification/planner.mjs',
    'tools/verification/profile.mjs',
    'tools/verification/registry.mjs',
    'tools/verification/release/**',
    'tools/verification/workspace/run.mjs',
    'tools/verification/workspace/suites.mjs',
    'tools/verification/runtime/adapter-smoke-workspace.mjs',
    'tools/verification/runtime/adapter-smoke-workspace.test.mjs',
    'tools/verify-buildr-product', 'tools/verify-buildr-product-fast',
    'package/manifest.yml', 'package/targets/workspace/rules/buildr/core.md',
    'package/targets/workspace/skills/**', 'package/targets/runtime/skills/**',
    'skills/buildr-release/**', 'docs/skill-capability-contracts.md',
    'package.json', 'package-lock.json',
  ], concurrencyClass: 'cpu-heavy' }),
  step({ id: 'integration-fast', name: 'fast integration tests', executor: { type: 'npm', args: ['run', 'test:integration:fast'] }, profiles: ['fast', 'candidate'], inputs: [
    'test/integration-fast/**',
    'tools/buildr', 'buildr',
    'tools/cli/application/cli-update.mjs',
    'tools/cli/application/release/bridge-main-to-dev.mjs',
    'tools/cli/shared/json-contracts.mjs',
    'tools/verification/changed-paths.mjs',
    'tools/verification/release/release-convergence.mjs',
    'tools/verification/timing/**',
    'tools/verification/workspace/fixture.mjs',
    'tools/verification/workspace/suites.mjs',
  ], budgetMs: 30000, schedulingCostMs: 24000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'cli-architecture', name: 'CLI modular architecture', executor: { type: 'node', file: 'tools/verification/cli/architecture.mjs' }, profiles: ['fast', 'candidate'], inputs: ['tools/*', 'tools/cli/**', 'tools/verification/cli/architecture.mjs', 'package.json'] }),
  step({ id: 'openspec-spec-quality', name: 'OpenSpec canonical spec quality', executor: { type: 'node', file: 'tools/verification/openspec/spec-quality.mjs' }, profiles: ['fast', 'candidate'], inputs: ['openspec/**/*.md', 'openspec/**/*.yaml'] }),
  step({ id: 'openspec-strict', name: 'openspec strict validation', executor: { type: 'openspec', args: ['validate', '--all', '--strict'] }, profiles: ['fast', 'candidate'], inputs: ['openspec/**'] }),
  step({ id: 'runtime-adapter-contract', name: 'runtime adapter contract', executor: { type: 'node', file: 'tools/verification/runtime/adapter-contract.mjs' }, profiles: ['fast', 'candidate'], groups: ['runtime'], inputs: ['tools/runtime/**', 'tools/cli/domains/runtime.mjs', 'tools/cli/application/doctor/runtime-diagnostics.mjs', 'tools/verification/runtime/adapter-contract.mjs', 'package/targets/runtime/**', 'docs/agent-runtime-adapters.md'] }),

  step({ id: 'candidate-tarball', name: 'candidate npm tarball', executor: { type: 'candidate-artifact' }, profiles: ['candidate'], inputs: ['package.json', 'package-lock.json', 'buildr', 'tools/buildr', 'tools/install-buildr-cli', 'tools/uninstall-buildr-cli'] }),
  step({ id: 'open-source-candidate', name: 'open-source candidate', executor: { type: 'node', file: 'tools/verification/release/open-source-candidate.mjs', consumesArtifact: true }, profiles: ['candidate'], groups: ['public', 'release'], inputs: ['package.json', 'package-lock.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'CONTRIBUTING.md', 'SECURITY.md', '.github/**', 'docs/cli-reference.md', 'docs/cli-architecture.md', 'docs/known-limitations.md', 'docs/agent-runtime-adapters.md'], dependsOn: ['candidate-tarball'] }),
  step({ id: 'openspec-candidate-audit', name: 'OpenSpec contract candidate audit', executor: { type: 'node', file: 'tools/verification/openspec/contract-audit.mjs' }, profiles: ['candidate'], groups: ['openspec'], inputs: ['openspec/**'] }),
  step({ id: 'managed-mutations', name: 'managed mutations', executor: { type: 'node', file: 'tools/verification/integrity/managed-mutations.mjs' }, profiles: ['candidate'], groups: ['package'], inputs: ['tools/cli/**', 'tools/runtime/**', 'package.json'] }),

  step({ id: 'capability-cli-integration', name: 'capability CLI integration', executor: { type: 'node', file: 'test/capability-cli.integration.mjs' }, profiles: ['candidate'], inputs: ['test/capability-cli.integration.mjs', 'tools/cli/**', 'package/targets/workspace/skills/**', 'package/targets/runtime/skills/**', 'skills/**', 'capabilities.yml'], budgetMs: 25000, schedulingCostMs: 19000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'commands-cli-integration', name: 'Commands context CLI integration', executor: { type: 'node', file: 'test/commands-cli.integration.mjs' }, profiles: ['candidate'], groups: ['cli', 'package'], inputs: ['commands.yml', 'test/commands-cli.integration.mjs', 'tools/cli/domains/commands.mjs', 'tools/cli/domains/components.mjs', 'tools/cli/domains/workspace.mjs', 'tools/cli/application/doctor/**', 'tools/cli/command/help.mjs', 'package/targets/workspace/commands/**', 'package/targets/workspace/projects/commands.yml'], budgetMs: 10000, schedulingCostMs: 10000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'openspec-contract-fixtures', name: 'OpenSpec contract fixtures', executor: { type: 'node', file: 'tools/verification/openspec/contract.mjs' }, profiles: ['candidate'], groups: ['openspec'], inputs: ['tools/cli/domains/openspec.mjs', 'tools/verification/openspec/**', 'openspec/**', 'package/targets/workspace/skills/buildr/openspec-contract-guard/**'], budgetMs: 20000, concurrencyClass: 'cpu-heavy' }),
  step({ id: 'package-static', ...packageVerifier('static'), profiles: ['candidate'], groups: ['package'], inputs: ['package/**', 'package.json', 'package-lock.json', 'tools/cli/application/package-maintenance/**', 'tools/verification/package/**'], budgetMs: 5000 }),
  step({ id: 'package-workspace', ...packageVerifier('workspace'), profiles: ['candidate'], groups: ['package'], inputs: ['package/targets/workspace/manifest.yml', 'package/targets/workspace/components/**', 'tools/cli/domains/workspace.mjs', 'tools/cli/application/workspace-operations.mjs', 'tools/cli/application/package-maintenance/**'], budgetMs: 6000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'package-commands', ...packageVerifier('commands'), profiles: ['candidate'], groups: ['package'], inputs: ['package/targets/workspace/commands/**', 'tools/cli/domains/commands.mjs', 'tools/cli/application/package-maintenance/**'], budgetMs: 7000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'package-rules', ...packageVerifier('rules'), profiles: ['candidate'], groups: ['package'], inputs: ['package/targets/workspace/rules/**', 'tools/cli/domains/rules.mjs', 'tools/runtime/**', 'tools/cli/application/package-maintenance/**'], budgetMs: 8000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'package-skills', ...packageVerifier('skills'), profiles: ['candidate'], groups: ['package'], inputs: ['package/targets/workspace/skills/**', 'package/targets/runtime/skills/**', 'tools/cli/domains/skills.mjs', 'tools/runtime/skills/**', 'tools/cli/application/package-maintenance/**'], budgetMs: 12000, schedulingCostMs: 10000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'package-runtime', ...packageVerifier('runtime'), profiles: ['candidate'], groups: ['package', 'runtime'], inputs: ['package/targets/runtime/**', 'package/targets/workspace/rules/**', 'tools/runtime/**', 'tools/cli/domains/runtime.mjs', 'tools/cli/application/package-maintenance/**'], budgetMs: 10000, schedulingCostMs: 7000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'runtime-adapter-parity', name: 'runtime adapter parity', executor: { type: 'node', file: 'tools/verification/runtime/adapter-parity.mjs' }, profiles: ['candidate'], groups: ['runtime'], inputs: ['tools/runtime/**', 'tools/cli/domains/runtime.mjs', 'tools/cli/application/doctor/runtime-diagnostics.mjs', 'tools/verification/runtime/adapter-parity.mjs', 'package/targets/runtime/**', 'package/targets/workspace/rules/**', 'package/targets/workspace/skills/**'], budgetMs: 40000, schedulingCostMs: 30000, concurrencyClass: 'workspace-heavy' }),

  step({ id: 'workspace-lifecycle', name: 'Workspace E2E: workspace lifecycle', executor: { type: 'workspace-suite', selector: 'workspace-lifecycle' }, profiles: ['candidate'], inputs: ['tools/cli/domains/workspace.mjs', 'tools/cli/domains/commands.mjs', 'tools/cli/domains/rules.mjs', 'tools/cli/domains/skills.mjs', 'tools/verification/workspace/fixture.mjs', 'tools/verification/workspace/workspace-lifecycle.mjs'], budgetMs: 20000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'ownership-recovery', name: 'Workspace E2E: ownership recovery', executor: { type: 'workspace-suite', selector: 'ownership-recovery' }, profiles: ['candidate'], inputs: ['tools/cli/domains/components.mjs', 'tools/cli/application/package-maintenance/**', 'tools/verification/workspace/fixture.mjs', 'tools/verification/workspace/ownership-recovery.mjs'], budgetMs: 20000, schedulingCostMs: 6000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'runtime-reconciliation', name: 'Workspace E2E: runtime reconciliation', executor: { type: 'workspace-suite', selector: 'runtime-reconciliation' }, profiles: ['candidate'], inputs: ['tools/runtime/**', 'tools/cli/domains/runtime.mjs', 'tools/verification/workspace/fixture.mjs', 'tools/verification/workspace/runtime-reconciliation.mjs', 'package/targets/runtime/**', 'package/targets/workspace/rules/**'], budgetMs: 30000, schedulingCostMs: 5000, concurrencyClass: 'workspace-heavy' }),

  step({ id: 'repository-onboarding', name: 'repository onboarding from a clean checkout', executor: { type: 'node', file: 'tools/verification/onboarding/repository.mjs' }, profiles: ['candidate'], inputs: ['tools/install-buildr-cli', 'tools/verification/onboarding/repository.mjs', 'services/**', 'package.json', 'package-lock.json', 'README.md'], budgetMs: 15000, schedulingCostMs: 6000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'init-onboarding', name: 'single-command init onboarding', executor: { type: 'node', file: 'tools/verification/onboarding/init.mjs' }, profiles: ['candidate'], inputs: ['tools/cli/domains/workspace.mjs', 'tools/cli/application/workspace-operations.mjs', 'tools/verification/onboarding/init.mjs', 'package/targets/workspace/manifest.yml', 'package/targets/workspace/components/**'], budgetMs: 15000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'cli-compatibility', name: 'CLI compatibility', executor: { type: 'node', file: 'tools/verification/cli/compatibility.mjs' }, profiles: ['candidate'], groups: ['cli'], inputs: ['buildr', 'tools/buildr', 'tools/cli/**', 'tools/verification/cli/compatibility.mjs', 'docs/cli-reference.md'], budgetMs: 15000, schedulingCostMs: 9000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'cli-package-parity', name: 'CLI package parity', executor: { type: 'node', file: 'tools/verification/cli/package-parity.mjs', consumesArtifact: true }, profiles: ['candidate'], groups: ['cli'], inputs: ['buildr', 'tools/buildr', 'tools/cli/**', 'tools/verification/cli/package-parity.mjs', 'package.json', 'package-lock.json'], dependsOn: ['candidate-tarball'], budgetMs: 10000, schedulingCostMs: 6000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'service-branch-contract', name: 'Service branch contract', executor: { type: 'node', file: 'tools/verification/onboarding/service-branch.mjs' }, profiles: ['candidate'], inputs: ['tools/cli/domains/workspace.mjs', 'tools/verification/onboarding/service-branch.mjs', 'services/**'], concurrencyClass: 'workspace-heavy' }),
  step({ id: 'remote-skill-timeout', name: 'remote Skill timeout contract', executor: { type: 'node', file: 'tools/verification/network/remote-text.mjs' }, profiles: ['candidate'], inputs: ['tools/shared/fetch-remote-text.mjs', 'tools/cli/domains/skills.mjs', 'tools/verification/network/**'], concurrencyClass: 'network' }),
  step({ id: 'release-tarball-smoke', name: 'release tarball smoke', executor: { type: 'node', file: 'tools/verification/release/release-smoke.mjs', consumesArtifact: true }, profiles: ['candidate'], groups: ['release'], inputs: ['buildr', 'tools/buildr', 'tools/cli/**', 'package.json', 'package-lock.json', 'tools/verification/release/**'], dependsOn: ['candidate-tarball'], budgetMs: 10000, concurrencyClass: 'workspace-heavy' }),
  step({ id: 'managed-data-integrity', name: 'managed data integrity', executor: { type: 'node', file: 'tools/verification/integrity/managed-data-integrity.mjs' }, profiles: ['candidate'], groups: ['package'], inputs: ['tools/cli/**', 'tools/runtime/**', 'package/**', 'tools/verification/integrity/**'], budgetMs: 15000, schedulingCostMs: 9000, concurrencyClass: 'workspace-heavy' }),

  step({ id: 'docs-quality', name: 'documentation quality', executor: { type: 'node', file: 'tools/verification/docs/quality.mjs' }, profiles: ['candidate'], inputs: ['**/*.md', 'openspec/**/*.html', 'tools/verification/docs/quality.mjs'], concurrencyClass: 'default' }),
]);

export const VERIFICATION_PROFILES = Object.freeze(['fast', 'candidate']);
export const VERIFICATION_GROUPS = Object.freeze(['public', 'cli', 'runtime', 'package', 'openspec', 'release']);
export const VERIFICATION_EXECUTORS = Object.freeze(['node', 'npm', 'openspec', 'package-selector', 'workspace-suite', 'candidate-artifact']);

export function verificationStepById(id) {
  return verificationSteps.find((item) => item.id === id);
}
