import fs from 'node:fs';
import path from 'node:path';

export const REQUIRED_RENDER_CAPABILITIES = Object.freeze([
  'rules-entry',
  'product-buildr-skill',
  'workspace-project-skills',
  'skill-install-plans',
  'runtime-check',
]);

export const ADAPTER_VERIFICATION_LEVELS = Object.freeze(['documented', 'verified']);

export const ADAPTER_TRAIT_CATALOG = Object.freeze({
  rules: Object.freeze(['native-recursive', 'native-root', 'reference-bridge', 'vendor-rule-files']),
  skills: Object.freeze(['agents-compatible', 'vendor-root']),
  surfaces: Object.freeze(['ide', 'cli', 'desktop', 'cloud']),
  activation: Object.freeze(['immediate', 'path-read', 'session-start', 'explicit-reload']),
  checker: Object.freeze(['projection']),
  environmentProbe: Object.freeze(['none', 'command', 'manual']),
});

export const BUILTIN_ADAPTER_IMPLEMENTATIONS = Object.freeze({
  rules: Object.freeze(['native-recursive', 'reference-bridge', 'vendor-rule-files']),
  skills: Object.freeze(['filesystem-skills']),
  checker: Object.freeze(['projection']),
});

export const UNSUPPORTED_AGENT_GUIDANCE = Object.freeze({
  message: 'Buildr 暂不支持当前 Agent runtime 的自动渲染。',
  nextStep: '请联系 Buildr 作者反馈该 Agent。',
  mustNotUseFallbackAdapter: true,
});

const AGENT_ID_PATTERN = /^[A-Za-z0-9._-]+$/;

function freeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) freeze(child);
  return Object.freeze(value);
}

function planFromTraits(context, traits) {
  const rules = traits.rules.kind === 'native-recursive'
    ? {
        writes: [],
        removals: [],
        nativeAssets: context.rules.nativeAssets,
        actions: [],
      }
    : context.rules;
  return createRuntimePlan({
    adapterId: context.adapterId,
    targetRoot: context.targetRoot,
    scope: context.scope,
    writes: [...rules.writes, ...context.skills.writes],
    nativeAssets: rules.nativeAssets,
    removals: [...rules.removals, ...context.skills.removals],
    capabilityEvidence: REQUIRED_RENDER_CAPABILITIES.map((capability) => ({
      capability,
      supported: true,
      adapterId: context.adapterId,
    })),
    findings: [...context.findings],
    repairs: [...context.repairs],
    warnings: [...context.warnings],
    ruleActions: rules.actions,
  });
}

function isSafeRuntimeRoot(value) {
  if (typeof value !== 'string' || value.length === 0 || path.isAbsolute(value)) return false;
  const normalized = path.posix.normalize(value.replaceAll('\\', '/'));
  return normalized !== '.' && normalized !== '..' && !normalized.startsWith('../') && normalized === value.replaceAll('\\', '/').replace(/\/$/, '');
}

function normalizeImplementationCatalog(value = {}) {
  return {
    rules: new Set(value.rules || BUILTIN_ADAPTER_IMPLEMENTATIONS.rules),
    skills: new Set(value.skills || BUILTIN_ADAPTER_IMPLEMENTATIONS.skills),
    checker: new Set(value.checker || BUILTIN_ADAPTER_IMPLEMENTATIONS.checker),
  };
}

function validateEnvironmentProbe(probe, label, errors) {
  if (!probe || !ADAPTER_TRAIT_CATALOG.environmentProbe.includes(probe.kind)) {
    errors.push(`${label} kind is invalid: ${probe?.kind || '<missing>'}`);
    return;
  }
  if (probe.kind === 'command') {
    if (typeof probe.executable !== 'string' || !AGENT_ID_PATTERN.test(probe.executable)) errors.push(`${label} command executable must be a static command name`);
    if (!Array.isArray(probe.args) || probe.args.some((item) => typeof item !== 'string')) errors.push(`${label} command args must be an array of strings`);
    if (!Number.isInteger(probe.timeoutMs) || probe.timeoutMs < 100 || probe.timeoutMs > 10000) errors.push(`${label} command timeoutMs must be between 100 and 10000`);
  }
  if (probe.kind === 'manual' && !probe.guidance) errors.push(`${label} manual guidance is required`);
}

function validateAdapterTraits(descriptor, options = {}) {
  const errors = [];
  const traits = descriptor?.traits;
  const implementations = normalizeImplementationCatalog(options.implementations);
  if (!traits || typeof traits !== 'object') return [`adapter ${descriptor?.id || '<missing>'} traits are required`];

  const rules = traits.rules;
  if (!rules || !ADAPTER_TRAIT_CATALOG.rules.includes(rules.kind)) errors.push(`adapter ${descriptor.id} rules trait is invalid: ${rules?.kind || '<missing>'}`);
  if (!rules?.implementation || !implementations.rules.has(rules.implementation)) errors.push(`adapter ${descriptor.id} has no registered rules implementation: ${rules?.implementation || '<missing>'}`);
  if (rules?.kind === 'native-recursive' && rules.implementation !== 'native-recursive') errors.push(`adapter ${descriptor.id} native-recursive rules must use native-recursive implementation`);
  if (rules?.kind === 'native-root' && rules.scopeCoverage !== 'recursive') errors.push(`adapter ${descriptor.id} native-root rules do not cover recursive scope`);
  if (['reference-bridge', 'vendor-rule-files'].includes(rules?.kind) && !rules.targetPattern) errors.push(`adapter ${descriptor.id} rendered rules targetPattern is required`);
  if (rules?.kind === 'reference-bridge' && !['per-source', 'root-index'].includes(rules.placement || 'per-source')) errors.push(`adapter ${descriptor.id} reference bridge placement is invalid: ${rules?.placement}`);
  if (rules?.kind === 'vendor-rule-files' && !['cursor-mdc', 'qoder-markdown', 'trae-markdown'].includes(rules.format)) errors.push(`adapter ${descriptor.id} vendor rules format is invalid: ${rules?.format || '<missing>'}`);
  if (rules?.maxChars !== undefined && (!Number.isInteger(rules.maxChars) || rules.maxChars < 256)) errors.push(`adapter ${descriptor.id} rules maxChars must be an integer of at least 256`);

  const skills = traits.skills;
  if (!skills || !ADAPTER_TRAIT_CATALOG.skills.includes(skills.kind)) errors.push(`adapter ${descriptor.id} skills trait is invalid: ${skills?.kind || '<missing>'}`);
  if (!skills?.implementation || !implementations.skills.has(skills.implementation)) errors.push(`adapter ${descriptor.id} has no registered skills implementation: ${skills?.implementation || '<missing>'}`);
  if (!isSafeRuntimeRoot(skills?.root)) errors.push(`adapter ${descriptor.id} skills root is unsafe: ${skills?.root || '<missing>'}`);
  if (skills?.kind === 'agents-compatible' && skills.root !== '.agents') errors.push(`adapter ${descriptor.id} agents-compatible skills root must be .agents`);

  if (!Array.isArray(traits.surfaces) || traits.surfaces.length === 0) errors.push(`adapter ${descriptor.id} surfaces are required`);
  for (const surface of traits.surfaces || []) {
    if (!surface || !ADAPTER_TRAIT_CATALOG.surfaces.includes(surface.kind)) errors.push(`adapter ${descriptor.id} surface is invalid: ${surface?.kind || '<missing>'}`);
  }

  const activation = traits.activation;
  for (const asset of ['rules', 'skills']) {
    if (!ADAPTER_TRAIT_CATALOG.activation.includes(activation?.[asset])) errors.push(`adapter ${descriptor.id} ${asset} activation is invalid: ${activation?.[asset] || '<missing>'}`);
  }
  if ([activation?.rules, activation?.skills].includes('explicit-reload') && !activation.reloadGuidance) errors.push(`adapter ${descriptor.id} explicit-reload guidance is required`);

  const checker = traits.checker;
  if (!checker || !ADAPTER_TRAIT_CATALOG.checker.includes(checker.kind)) errors.push(`adapter ${descriptor.id} checker trait is invalid: ${checker?.kind || '<missing>'}`);
  if (!checker?.implementation || !implementations.checker.has(checker.implementation)) errors.push(`adapter ${descriptor.id} has no registered checker implementation: ${checker?.implementation || '<missing>'}`);
  validateEnvironmentProbe(checker?.installationProbe, `adapter ${descriptor.id} installation probe`, errors);
  validateEnvironmentProbe(checker?.versionProbe, `adapter ${descriptor.id} version probe`, errors);
  if (checker?.prerequisites !== undefined && !Array.isArray(checker.prerequisites)) errors.push(`adapter ${descriptor.id} checker prerequisites must be an array`);
  for (const prerequisite of checker?.prerequisites || []) {
    if (!prerequisite?.code || !prerequisite?.message || !prerequisite?.guidance) errors.push(`adapter ${descriptor.id} checker prerequisite must declare code, message, and guidance`);
  }
  return errors;
}

function ruleCapability(traits) {
  const rules = traits.rules;
  const native = rules.kind === 'native-recursive';
  return {
    supported: true,
    mode: native ? 'native' : 'rendered',
    scopeSyntax: 'workspace-relative-path',
    sourceDiscovery: { pattern: '**/AGENTS.md', mode: 'recursive-scope', includesAncestors: true },
    projection: native ? { mode: 'native' } : { mode: 'rendered', targetPattern: rules.targetPattern },
    writesFiles: !native,
    ...(native ? { sourceAssets: ['**/AGENTS.md'] } : { targets: [rules.targetPattern] }),
  };
}

function renderCapabilities(traits) {
  const root = traits.skills.root;
  return {
    'rules-entry': ruleCapability(traits),
    'product-buildr-skill': { supported: true, mode: 'install', writesFiles: true, targets: [`${root}/skills/buildr/SKILL.md`] },
    'workspace-project-skills': { supported: true, mode: 'rendered', writesFiles: true, targets: [`${root}/skills/<skill>/SKILL.md`] },
    'skill-install-plans': { supported: true, mode: 'plan', writesFiles: true, targets: [`${root}/buildr/skill-install-plans/<skill>.md`] },
    'runtime-check': {
      supported: true,
      mode: 'diagnostic',
      writesFiles: false,
      projection: traits.checker.kind,
      installationProbe: traits.checker.installationProbe.kind,
      versionProbe: traits.checker.versionProbe.kind,
    },
  };
}

function runtimeTargets(traits) {
  const rules = traits.rules.kind === 'native-recursive'
    ? ['AGENTS.md']
    : [traits.rules.targetPattern.replace('<source-dir>/', '').replace('<workspace-root>/', '')];
  return [...rules, `${traits.skills.root}/skills/`, `${traits.skills.root}/buildr/skill-install-plans/`];
}

export function createRuntimeAdapterDescriptor(value, options = {}) {
  const traitErrors = validateAdapterTraits(value, options);
  if (traitErrors.length > 0) throw new Error(`Invalid runtime adapter descriptor ${value.id || '<missing>'}:\n- ${traitErrors.join('\n- ')}`);
  const traits = freeze(structuredClone(value.traits));
  const descriptor = {
    id: value.id,
    displayName: value.displayName,
    traits,
    implementation: {
      rules: traits.rules.implementation,
      skills: traits.skills.implementation,
      checker: traits.checker.implementation,
    },
    runtimeTargets: runtimeTargets(traits),
    renderCapabilities: renderCapabilities(traits),
    recommendedCommands: value.recommendedCommands,
    evidence: value.evidence || {},
    planRuntime(context) { return planFromTraits(context, traits); },
  };
  const errors = validateAdapterDescriptor(descriptor, options);
  if (errors.length > 0) throw new Error(`Invalid runtime adapter descriptor ${value.id || '<missing>'}:\n- ${errors.join('\n- ')}`);
  return freeze(descriptor);
}

function recommendedCommands(id) {
  return {
    doctor: `buildr doctor --agent ${id} --target <dir> --json`,
    syncWorkspaceEntry: `buildr sync ${id} --target <dir>`,
    renderScope: `buildr render ${id} --scope <workspace-relative-path> --target <dir>`,
    renderSkillsScope: `buildr skills render ${id} --scope <scope> --target <dir>`,
    renderRulesScope: `buildr rules render ${id} --scope <scope> --target <dir>`,
    runtimeCheckScope: `buildr runtime check ${id} --scope <workspace-relative-path> --target <dir>`,
    installProductSkill: `buildr skill install ${id} --target <dir>`,
  };
}

function renderedRulesDiagnostics(label, codeId) {
  return {
    missingStatus: 'missing',
    missingPath: 'AGENTS.md',
    missingCode: `runtime.${codeId}_rules_missing`,
    label,
    codes: {
      ok: `runtime.${codeId}_rules_ok`,
      missing: `runtime.${codeId}_rules_missing`,
      stale: `runtime.${codeId}_rules_stale`,
      conflict: `runtime.${codeId}_rules_conflict`,
      orphan: `runtime.${codeId}_rules_orphan`,
    },
  };
}

const DESCRIPTORS = [
  createRuntimeAdapterDescriptor({
    id: 'claude-code',
    displayName: 'Claude Code',
    traits: {
      rules: {
        kind: 'reference-bridge',
        implementation: 'reference-bridge',
        placement: 'per-source',
        targetPattern: '<source-dir>/CLAUDE.md',
        diagnostics: {
          missingStatus: 'conflict',
          missingPath: 'CLAUDE.md',
          missingCode: 'runtime.rules_bridge_missing',
          label: 'Claude Code rules bridge',
          codes: { ok: 'runtime.reference_bridge_ok', missing: 'runtime.rules_bridge_missing', stale: 'runtime.rules_bridge_stale', conflict: 'runtime.rules_bridge_conflict', orphan: 'runtime.rules_bridge_orphan' },
        },
      },
      skills: { kind: 'vendor-root', implementation: 'filesystem-skills', root: '.claude' },
      surfaces: [{ kind: 'cli' }],
      activation: { rules: 'session-start', skills: 'session-start' },
      checker: { kind: 'projection', implementation: 'projection', resultKey: 'claudeCode', skillsManifestAbsentCode: 'runtime.skills_manifest_absent', installationProbe: { kind: 'none' }, versionProbe: { kind: 'none' } },
    },
    recommendedCommands: {
      doctor: 'buildr doctor --agent claude-code --target <dir> --json',
      syncWorkspaceEntry: 'buildr sync claude-code --target <dir>',
      renderScope: 'buildr render claude-code --scope <workspace-relative-path> --target <dir>',
      renderSkillsScope: 'buildr skills render claude-code --scope <scope> --target <dir>',
      renderRulesScope: 'buildr rules render claude-code --scope <scope> --target <dir>',
      runtimeCheckScope: 'buildr runtime check claude-code --scope <workspace-relative-path> --target <dir>',
      installProductSkill: 'buildr skill install claude-code --target <dir>',
    },
  }),
  createRuntimeAdapterDescriptor({
    id: 'codex',
    displayName: 'Codex',
    traits: {
      rules: {
        kind: 'native-recursive',
        implementation: 'native-recursive',
        diagnostics: { missingStatus: 'missing', missingPath: 'AGENTS.md', missingCode: 'runtime.codex_rules_missing', label: 'Codex native AGENTS.md rule asset', okCode: 'runtime.codex_rules_ok' },
      },
      skills: { kind: 'agents-compatible', implementation: 'filesystem-skills', root: '.agents' },
      surfaces: [{ kind: 'cli' }, { kind: 'desktop' }],
      activation: { rules: 'path-read', skills: 'session-start' },
      checker: { kind: 'projection', implementation: 'projection', resultKey: 'codex', installationProbe: { kind: 'none' }, versionProbe: { kind: 'none' } },
    },
    recommendedCommands: {
      doctor: 'buildr doctor --agent codex --target <dir> --json',
      syncWorkspaceEntry: 'buildr sync codex --target <dir>',
      renderScope: 'buildr render codex --scope <workspace-relative-path> --target <dir>',
      renderSkillsScope: 'buildr skills render codex --scope <scope> --target <dir>',
      runtimeCheckScope: 'buildr runtime check codex --scope <workspace-relative-path> --target <dir>',
      installProductSkill: 'buildr skill install codex --target <dir>',
    },
  }),
  createRuntimeAdapterDescriptor({
    id: 'cursor',
    displayName: 'Cursor',
    traits: {
      rules: {
        kind: 'vendor-rule-files', implementation: 'vendor-rule-files', format: 'cursor-mdc',
        targetPattern: '<source-dir>/.cursor/rules/buildr.mdc',
        diagnostics: renderedRulesDiagnostics('Cursor scoped project rule', 'cursor'),
      },
      skills: { kind: 'agents-compatible', implementation: 'filesystem-skills', root: '.agents' },
      surfaces: [{ kind: 'ide' }, { kind: 'cli' }],
      activation: { rules: 'path-read', skills: 'session-start', reloadGuidance: 'Start a new Cursor chat after adding or changing project Skills; reopen the chat if project-rule discovery is stale.' },
      checker: {
        kind: 'projection', implementation: 'projection', resultKey: 'cursor',
        installationProbe: { kind: 'manual', guidance: 'Confirm Cursor IDE or Cursor Agent CLI is installed for the surface you are using.' },
        versionProbe: { kind: 'manual', guidance: 'Record the Cursor IDE About version or run agent --version when the CLI is installed.' },
      },
    },
    recommendedCommands: recommendedCommands('cursor'),
    evidence: { verificationLevel: 'documented', rules: 'official-documentation-with-version-drift-mitigation', skills: 'official-documentation', smokeStatus: 'pending' },
  }),
  createRuntimeAdapterDescriptor({
    id: 'qoder',
    displayName: 'Qoder',
    traits: {
      rules: {
        kind: 'vendor-rule-files', implementation: 'vendor-rule-files', format: 'qoder-markdown',
        targetPattern: '<workspace-root>/.qoder/rules/buildr/<source-id>.md', maxChars: 100000,
        diagnostics: renderedRulesDiagnostics('Qoder vendor rule file', 'qoder'),
      },
      skills: { kind: 'vendor-root', implementation: 'filesystem-skills', root: '.qoder' },
      surfaces: [{ kind: 'ide' }],
      activation: { rules: 'path-read', skills: 'explicit-reload', reloadGuidance: 'Run /skills reload when available, or start a new Qoder session.' },
      checker: {
        kind: 'projection', implementation: 'projection', resultKey: 'qoder',
        installationProbe: { kind: 'command', executable: 'qoder', args: ['--version'], timeoutMs: 3000 },
        versionProbe: { kind: 'command', executable: 'qoder', args: ['--version'], timeoutMs: 3000 },
      },
    },
    recommendedCommands: recommendedCommands('qoder'),
    evidence: { verificationLevel: 'documented', rules: 'official-documentation-and-local-intake', skills: 'official-documentation-and-local-intake', smokeStatus: 'pending' },
  }),
  createRuntimeAdapterDescriptor({
    id: 'trae',
    displayName: 'TRAE',
    traits: {
      rules: {
        kind: 'vendor-rule-files', implementation: 'vendor-rule-files', format: 'trae-markdown',
        targetPattern: '<source-dir>/.trae/rules/buildr.md',
        diagnostics: renderedRulesDiagnostics('TRAE vendor rule file', 'trae'),
      },
      skills: { kind: 'agents-compatible', implementation: 'filesystem-skills', root: '.agents' },
      surfaces: [{ kind: 'ide' }],
      activation: { rules: 'path-read', skills: 'session-start', reloadGuidance: 'Start a new TRAE conversation after adding or changing Rules or Skills.' },
      checker: {
        kind: 'projection', implementation: 'projection', resultKey: 'trae',
        installationProbe: { kind: 'command', executable: 'trae', args: ['--version'], timeoutMs: 3000 },
        versionProbe: { kind: 'manual', guidance: 'Record the TRAE product version from About; trae --version may report the embedded editor build instead.' },
      },
    },
    recommendedCommands: recommendedCommands('trae'),
    evidence: { verificationLevel: 'documented', rules: 'installed-product-and-local-intake', skills: 'installed-product-and-local-intake', smokeStatus: 'pending' },
  }),
  createRuntimeAdapterDescriptor({
    id: 'trae-work',
    displayName: 'TRAE Work',
    traits: {
      rules: {
        kind: 'reference-bridge', implementation: 'reference-bridge', placement: 'root-index', template: 'buildr-root-index',
        targetPattern: '<workspace-root>/CLAUDE.local.md',
        diagnostics: renderedRulesDiagnostics('TRAE Work root rules bridge', 'trae_work'),
      },
      skills: { kind: 'vendor-root', implementation: 'filesystem-skills', root: '.trae' },
      surfaces: [{ kind: 'desktop' }],
      activation: { rules: 'session-start', skills: 'immediate', reloadGuidance: 'Start a new TRAE Work conversation after adding or changing imported Rules.' },
      checker: {
        kind: 'projection', implementation: 'projection', resultKey: 'traeWork',
        installationProbe: { kind: 'command', executable: 'defaults', args: ['read', '/Applications/TRAE SOLO.app/Contents/Info', 'CFBundleIdentifier'], timeoutMs: 3000 },
        versionProbe: { kind: 'command', executable: 'defaults', args: ['read', '/Applications/TRAE SOLO.app/Contents/Info', 'CFBundleShortVersionString'], timeoutMs: 3000 },
        prerequisites: [
          { code: 'runtime.trae_work_rules_import_unverified', message: 'TRAE Work Rules import and reference traversal cannot be proven from projection state.', guidance: 'Enable the desktop Rules import toggle for CLAUDE.local.md, start a new conversation, and run the documented reference-bridge smoke.' },
        ],
      },
    },
    recommendedCommands: recommendedCommands('trae-work'),
    evidence: { verificationLevel: 'documented', rules: 'official-documentation-and-local-intake', skills: 'official-documentation-and-local-intake', smokeStatus: 'pending' },
  }),
  createRuntimeAdapterDescriptor({
    id: 'workbuddy',
    displayName: 'WorkBuddy',
    traits: {
      rules: {
        kind: 'reference-bridge', implementation: 'reference-bridge', placement: 'root-index', template: 'buildr-root-index',
        targetPattern: '<workspace-root>/CODEBUDDY.md', maxChars: 8000,
        diagnostics: renderedRulesDiagnostics('WorkBuddy CODEBUDDY.md rules bridge', 'workbuddy'),
      },
      skills: { kind: 'vendor-root', implementation: 'filesystem-skills', root: '.codebuddy' },
      surfaces: [{ kind: 'desktop' }, { kind: 'cli', variant: 'desktop-bundled' }],
      activation: { rules: 'session-start', skills: 'session-start', reloadGuidance: 'Start a new WorkBuddy task after adding or changing Rules or Skills.' },
      checker: {
        kind: 'projection', implementation: 'projection', resultKey: 'workbuddy',
        installationProbe: { kind: 'command', executable: 'defaults', args: ['read', '/Applications/WorkBuddy.app/Contents/Info', 'CFBundleIdentifier'], timeoutMs: 3000 },
        versionProbe: { kind: 'command', executable: 'defaults', args: ['read', '/Applications/WorkBuddy.app/Contents/Info', 'CFBundleShortVersionString'], timeoutMs: 3000 },
      },
    },
    recommendedCommands: recommendedCommands('workbuddy'),
    evidence: {
      verificationLevel: 'verified',
      rules: 'installed-source-code-5.2.5',
      skills: 'installed-product-docs-and-source',
      smokeStatus: 'passed',
      smoke: {
        observedAt: '2026-07-13',
        productVersion: '5.2.5',
        runtimeVersion: '2.106.4',
        surface: 'desktop-bundled-cli',
        rules: { root: 'pass', project: 'pass', active: 'pass', siblingIsolated: 'pass' },
        skill: { status: 'pass', result: 'SMOKE_SKILL_DISCOVERED_19AF' },
        activation: { rules: 'session-start', skills: 'session-start' },
        evidence: 'Headless task from the WorkBuddy desktop bundle plus an audited tool transcript; no sibling Rule file was read.',
      },
    },
  }),
];

export function validateAdapterDescriptor(descriptor, options = {}) {
  const errors = [];
  if (!descriptor || typeof descriptor !== 'object') return ['adapter descriptor must be an object'];
  errors.push(...validateAdapterTraits(descriptor, options));
  if (!AGENT_ID_PATTERN.test(descriptor.id || '')) errors.push(`adapter id is invalid: ${descriptor.id || '<missing>'}`);
  if (!descriptor.displayName) errors.push(`adapter ${descriptor.id || '<missing>'} displayName is required`);
  if (!Array.isArray(descriptor.runtimeTargets) || descriptor.runtimeTargets.length === 0) errors.push(`adapter ${descriptor.id} runtimeTargets are required`);
  if (new Set(descriptor.runtimeTargets || []).size !== (descriptor.runtimeTargets || []).length) errors.push(`adapter ${descriptor.id} runtimeTargets must be unique`);
  for (const capability of REQUIRED_RENDER_CAPABILITIES) {
    if (descriptor.renderCapabilities?.[capability]?.supported !== true) errors.push(`adapter ${descriptor.id} is missing required capability ${capability}`);
  }
  for (const capability of Object.keys(descriptor.renderCapabilities || {})) {
    if (!REQUIRED_RENDER_CAPABILITIES.includes(capability)) errors.push(`adapter ${descriptor.id} declares unknown capability ${capability}`);
  }
  if (typeof descriptor.planRuntime !== 'function') errors.push(`adapter ${descriptor.id} planRuntime is required`);
  if (!descriptor.implementation || !['string', 'object'].includes(typeof descriptor.implementation)) errors.push(`adapter ${descriptor.id} implementation entry is required`);
  if (!descriptor.recommendedCommands || typeof descriptor.recommendedCommands !== 'object') errors.push(`adapter ${descriptor.id} recommendedCommands are required`);
  const evidence = descriptor.evidence || {};
  if (Object.keys(evidence).length > 0) {
    if (!ADAPTER_VERIFICATION_LEVELS.includes(evidence.verificationLevel)) errors.push(`adapter ${descriptor.id} evidence verificationLevel is invalid: ${evidence.verificationLevel || '<missing>'}`);
    if (!['pending', 'passed'].includes(evidence.smokeStatus)) errors.push(`adapter ${descriptor.id} evidence smokeStatus is invalid: ${evidence.smokeStatus || '<missing>'}`);
    if (evidence.verificationLevel === 'verified' && evidence.smokeStatus !== 'passed') errors.push(`adapter ${descriptor.id} verified evidence requires a passed smoke`);
    if (evidence.smokeStatus === 'passed' && evidence.verificationLevel !== 'verified') errors.push(`adapter ${descriptor.id} passed smoke requires verified evidence`);
  }
  return errors;
}

export function createRuntimeAdapterRegistry(descriptors, options = {}) {
  const registry = {};
  const errors = [];
  for (const descriptor of descriptors) {
    errors.push(...validateAdapterDescriptor(descriptor, options));
    if (registry[descriptor?.id]) errors.push(`duplicate adapter id: ${descriptor.id}`);
    if (descriptor?.id) registry[descriptor.id] = descriptor;
  }
  if (errors.length > 0) throw new Error(`Invalid runtime adapter registry:\n- ${errors.join('\n- ')}`);
  const result = freeze({ ...registry });
  if (options.testOnly === true) return result;
  return result;
}

export const RUNTIME_ADAPTERS = createRuntimeAdapterRegistry(DESCRIPTORS);
export const SUPPORTED_AGENT_IDS = Object.freeze(Object.keys(RUNTIME_ADAPTERS));

export function isSupportedAgent(agent) {
  return Object.hasOwn(RUNTIME_ADAPTERS, agent);
}

export function getRuntimeAdapter(agent) {
  const adapter = RUNTIME_ADAPTERS[agent];
  if (!adapter) throw new Error(`Unsupported Agent runtime: ${agent}`);
  return adapter;
}

export function selectAdapterImplementation(adapter, kind, implementations) {
  const implementation = adapter.implementation?.[kind];
  const selected = implementations[implementation];
  if (!selected) throw new Error(`Runtime adapter ${adapter.id} has no registered ${kind} implementation: ${implementation || '<missing>'}`);
  return selected;
}

export function runtimeDiscoveryPayload() {
  return {
    supportedAgents: [...SUPPORTED_AGENT_IDS],
    requiredRenderCapabilities: [...REQUIRED_RENDER_CAPABILITIES],
    adapterTraitCatalog: ADAPTER_TRAIT_CATALOG,
    agents: RUNTIME_ADAPTERS,
    unsupportedAgentGuidance: UNSUPPORTED_AGENT_GUIDANCE,
  };
}

export function createRuntimeContext(value) {
  const context = {
    adapterId: value.adapterId,
    targetRoot: path.resolve(value.targetRoot),
    scope: value.scope,
    rules: value.rules || { writes: [], nativeAssets: [], removals: [], actions: [] },
    skills: value.skills || { writes: [], removals: [] },
    findings: value.findings || [],
    repairs: value.repairs || [],
    warnings: value.warnings || [],
  };
  return freeze(context);
}

export function createRuntimePlan(value) {
  return freeze({
    schemaVersion: 'buildr.runtime-plan/v1',
    adapterId: value.adapterId,
    targetRoot: path.resolve(value.targetRoot),
    scope: value.scope,
    writes: value.writes || [],
    nativeAssets: value.nativeAssets || [],
    removals: value.removals || [],
    capabilityEvidence: value.capabilityEvidence || [],
    findings: value.findings || [],
    repairs: value.repairs || [],
    warnings: value.warnings || [],
    ruleActions: value.ruleActions || [],
  });
}

function safeTarget(targetRoot, targetFile) {
  const root = path.resolve(targetRoot);
  const target = path.resolve(targetFile);
  return target !== root && target.startsWith(`${root}${path.sep}`);
}

function firstSymbolicLinkSegment(targetRoot, targetFile) {
  const root = path.resolve(targetRoot);
  const target = path.resolve(targetFile);
  const relative = path.relative(root, target);
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) return null;
  let current = root;
  for (const segment of ['.', ...relative.split(path.sep)]) {
    if (segment !== '.') current = path.join(current, segment);
    try {
      if (fs.lstatSync(current).isSymbolicLink()) return current;
    } catch (error) {
      if (error?.code === 'ENOENT') break;
      throw error;
    }
  }
  return null;
}

export function assertRuntimeTargetPath(targetRoot, targetFile, label = 'Runtime target') {
  if (!safeTarget(targetRoot, targetFile)) {
    throw new Error(`${label} is outside target root: ${targetFile}`);
  }
  const symbolicLink = firstSymbolicLinkSegment(targetRoot, targetFile);
  if (symbolicLink) {
    throw new Error(`${label} crosses a symbolic link: ${symbolicLink}`);
  }
  return path.resolve(targetFile);
}

export function validateRuntimePlan(plan, adapter = getRuntimeAdapter(plan?.adapterId)) {
  const errors = [];
  if (plan?.schemaVersion !== 'buildr.runtime-plan/v1') errors.push('runtime plan schemaVersion is invalid');
  if (plan?.adapterId !== adapter.id) errors.push(`runtime plan adapterId does not match descriptor: ${plan?.adapterId}`);
  const writes = new Map();
  for (const item of plan?.writes || []) {
    try { assertRuntimeTargetPath(plan.targetRoot, item.targetFile, 'runtime write target'); }
    catch (error) { errors.push(error.message); }
    if (typeof item.content !== 'string') errors.push(`runtime write content must be text: ${item.targetFile}`);
    const existing = writes.get(path.resolve(item.targetFile));
    if (existing && existing.content !== item.content) errors.push(`runtime writes contain conflicting target: ${item.targetFile}`);
    else writes.set(path.resolve(item.targetFile), item);
  }
  const removals = new Set();
  for (const item of plan?.removals || []) {
    const targetFile = typeof item === 'string' ? item : item.targetFile;
    try { assertRuntimeTargetPath(plan.targetRoot, targetFile, 'runtime removal target'); }
    catch (error) { errors.push(error.message); }
    if (writes.has(path.resolve(targetFile))) errors.push(`runtime target cannot be written and removed: ${targetFile}`);
    if (removals.has(path.resolve(targetFile))) errors.push(`runtime removals contain duplicate target: ${targetFile}`);
    removals.add(path.resolve(targetFile));
  }
  const evidence = new Map((plan?.capabilityEvidence || []).map((item) => [item.capability, item]));
  for (const capability of REQUIRED_RENDER_CAPABILITIES) {
    if (evidence.get(capability)?.supported !== true) errors.push(`runtime plan is missing capability evidence: ${capability}`);
  }
  for (const capability of evidence.keys()) {
    if (!REQUIRED_RENDER_CAPABILITIES.includes(capability)) errors.push(`runtime plan has unknown capability evidence: ${capability}`);
  }
  if (errors.length > 0) throw new Error(`Invalid runtime plan for ${adapter.id}:\n- ${errors.join('\n- ')}`);
  return plan;
}

function runtimePath(targetRoot, targetFile) {
  return path.relative(targetRoot, targetFile).split(path.sep).join('/');
}

function diagnosticFinding(item, observedStatus, plan) {
  const diagnostic = item.diagnostic || {};
  const status = observedStatus === 'ok' && diagnostic.currentStatus
    ? diagnostic.currentStatus
    : observedStatus === 'ok' && diagnostic.actionRequiredWhenCurrent ? 'stale' : observedStatus;
  const code = diagnostic.codes?.[status] || diagnostic.code;
  const message = diagnostic.messages?.[status]
    || (status === 'ok' ? `${diagnostic.label || item.source || 'runtime target'} is up to date.` : `${diagnostic.label || item.source || 'runtime target'} is ${status}.`);
  const repair = status === 'ok' ? undefined : diagnostic.repairs?.[status] || diagnostic.repair;
  return {
    status,
    path: runtimePath(plan.targetRoot, item.targetFile),
    adapter: plan.adapterId,
    source: item.source,
    message,
    ...(code ? { code } : {}),
    ...(repair ? { repair } : {}),
    userActionRequired: status !== 'ok' && status !== 'info' && status !== 'warning',
  };
}

export function reconcileRuntimePlan(plan, options = {}) {
  validateRuntimePlan(plan);
  const compareOnly = options.compareOnly === true;
  const conflicts = [];
  const changed = [];
  const removed = [];
  for (const item of plan.writes) {
    if (!fs.existsSync(item.targetFile)) continue;
    const current = fs.readFileSync(item.targetFile, 'utf8');
    const matches = current === item.content || item.matchesCurrent?.(current) === true;
    if (!matches && current !== item.sourceContent && item.isManaged && !item.isManaged(current)) conflicts.push(item);
  }
  const findings = [...plan.findings];
  for (const item of conflicts) findings.push(diagnosticFinding(item, 'conflict', plan));
  const plannedConflicts = findings.filter((finding) => finding.status === 'conflict');
  if (!compareOnly && plannedConflicts.length > 0) {
    throw new Error(`Runtime reconcile found conflict(s); no files were changed:\n- ${plannedConflicts.map((finding) => finding.message || finding.path).sort().join('\n- ')}`);
  }
  for (const item of plan.writes) {
    if (conflicts.includes(item)) continue;
    const current = fs.existsSync(item.targetFile) ? fs.readFileSync(item.targetFile, 'utf8') : null;
    const status = current === null ? 'missing' : current === item.content || item.matchesCurrent?.(current) === true ? 'ok' : 'stale';
    findings.push(diagnosticFinding(item, status, plan));
    if (!compareOnly && status !== 'ok') {
      fs.mkdirSync(path.dirname(item.targetFile), { recursive: true });
      fs.writeFileSync(item.targetFile, item.content, 'utf8');
      changed.push(item.targetFile);
    }
  }
  for (const nativeAsset of plan.nativeAssets) {
    const item = typeof nativeAsset === 'string' ? { targetFile: nativeAsset, source: nativeAsset } : nativeAsset;
    const status = fs.existsSync(item.targetFile) ? 'ok' : 'missing';
    findings.push(diagnosticFinding(item, status, plan));
  }
  for (const removal of plan.removals) {
    const item = typeof removal === 'string' ? { targetFile: removal } : removal;
    if (!fs.existsSync(item.targetFile)) continue;
    if (item.isManaged && !item.isManaged(item.type === 'directory' ? null : fs.readFileSync(item.targetFile, 'utf8'))) continue;
    findings.push(diagnosticFinding(item, 'orphan', plan));
    if (!compareOnly) {
      fs.rmSync(item.targetFile, { recursive: item.type === 'directory', force: true });
      removed.push(item.targetFile);
    }
  }
  return { targetRoot: plan.targetRoot, adapterId: plan.adapterId, scope: plan.scope, changed, removed, findings, repairs: plan.repairs, warnings: plan.warnings, ruleActions: plan.ruleActions };
}
