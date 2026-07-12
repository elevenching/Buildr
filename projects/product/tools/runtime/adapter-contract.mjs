import fs from 'node:fs';
import path from 'node:path';

export const REQUIRED_RENDER_CAPABILITIES = Object.freeze([
  'rules-entry',
  'product-buildr-skill',
  'workspace-project-skills',
  'skill-install-plans',
  'runtime-check',
]);

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

function planFromProjection(context, projection) {
  const rules = projection === 'native'
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

const DESCRIPTORS = [
  {
    id: 'claude-code',
    displayName: 'Claude Code',
    projection: 'reference-bridge',
    skillsRoot: '.claude',
    implementation: { skills: 'claude-code', rules: 'reference-bridge', checker: 'claude-code' },
    runtimeTargets: ['CLAUDE.md', '.claude/skills/', '.claude/buildr/skill-install-plans/'],
    renderCapabilities: {
      'rules-entry': { supported: true, mode: 'rendered', scopeSyntax: 'workspace-relative-path', sourceDiscovery: { pattern: '**/AGENTS.md', mode: 'recursive-scope', includesAncestors: true }, projection: { mode: 'rendered', targetPattern: '<source-dir>/CLAUDE.md' }, writesFiles: true, targets: ['<source-dir>/CLAUDE.md'] },
      'product-buildr-skill': { supported: true, mode: 'install', writesFiles: true, targets: ['.claude/skills/buildr/SKILL.md'] },
      'workspace-project-skills': { supported: true, mode: 'rendered', writesFiles: true, targets: ['.claude/skills/<skill>/SKILL.md'] },
      'skill-install-plans': { supported: true, mode: 'plan', writesFiles: true, targets: ['.claude/buildr/skill-install-plans/<skill>.md'] },
      'runtime-check': { supported: true, mode: 'diagnostic', writesFiles: false },
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
    planRuntime(context) { return planFromProjection(context, 'reference-bridge'); },
  },
  {
    id: 'codex',
    displayName: 'Codex',
    projection: 'native-agents',
    skillsRoot: '.agents',
    implementation: { skills: 'codex', rules: 'native-agents', checker: 'codex' },
    runtimeTargets: ['AGENTS.md', '.agents/skills/', '.agents/buildr/skill-install-plans/'],
    renderCapabilities: {
      'rules-entry': { supported: true, mode: 'native', scopeSyntax: 'workspace-relative-path', sourceDiscovery: { pattern: '**/AGENTS.md', mode: 'recursive-scope', includesAncestors: true }, projection: { mode: 'native' }, writesFiles: false, sourceAssets: ['**/AGENTS.md'] },
      'product-buildr-skill': { supported: true, mode: 'install', writesFiles: true, targets: ['.agents/skills/buildr/SKILL.md'] },
      'workspace-project-skills': { supported: true, mode: 'rendered', writesFiles: true, targets: ['.agents/skills/<skill>/SKILL.md'] },
      'skill-install-plans': { supported: true, mode: 'plan', writesFiles: true, targets: ['.agents/buildr/skill-install-plans/<skill>.md'] },
      'runtime-check': { supported: true, mode: 'diagnostic', writesFiles: false },
    },
    recommendedCommands: {
      doctor: 'buildr doctor --agent codex --target <dir> --json',
      syncWorkspaceEntry: 'buildr sync codex --target <dir>',
      renderScope: 'buildr render codex --scope <workspace-relative-path> --target <dir>',
      renderSkillsScope: 'buildr skills render codex --scope <scope> --target <dir>',
      runtimeCheckScope: 'buildr runtime check codex --scope <workspace-relative-path> --target <dir>',
      installProductSkill: 'buildr skill install codex --target <dir>',
    },
    planRuntime(context) { return planFromProjection(context, 'native'); },
  },
];

export function validateAdapterDescriptor(descriptor) {
  const errors = [];
  if (!descriptor || typeof descriptor !== 'object') return ['adapter descriptor must be an object'];
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
  return errors;
}

export function createRuntimeAdapterRegistry(descriptors, options = {}) {
  const registry = {};
  const errors = [];
  for (const descriptor of descriptors) {
    errors.push(...validateAdapterDescriptor(descriptor));
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

export function runtimeDiscoveryPayload() {
  return {
    supportedAgents: [...SUPPORTED_AGENT_IDS],
    requiredRenderCapabilities: [...REQUIRED_RENDER_CAPABILITIES],
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
