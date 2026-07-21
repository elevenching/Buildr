import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const ROOT_FIELDS = new Set(['schemaVersion', 'mode', 'capabilities']);
const CAPABILITY_FIELDS = new Set([
  'id', 'title', 'command', 'maturity', 'stages', 'enforcement', 'applicability',
  'coverage', 'environment', 'effects', 'authorization', 'dependsOn', 'supersedes', 'sources',
]);
const COMMAND_FIELDS = new Set(['argv', 'cwd']);
const APPLICABILITY_FIELDS = new Set(['paths', 'risks']);
const COVERAGE_FIELDS = new Set(['kind', 'owns']);
const ENVIRONMENT_FIELDS = new Set(['requires', 'services']);
const EFFECT_FIELDS = new Set(['level', 'writes', 'externalSystems']);
const MODES = new Set(['augment', 'authoritative']);
const MATURITIES = new Set(['discovered', 'trial', 'stable']);
const STAGES = new Set(['minimal', 'affected', 'candidate']);
const ENFORCEMENTS = new Set(['advisory', 'required']);
const AUTHORIZATIONS = new Set(['implicit', 'explicit']);
const EFFECT_LEVELS = new Set(['none', 'local-temporary', 'local-service', 'shared', 'persistent', 'unknown']);
const ID_PATTERN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function unknownFields(value, allowed, label, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${label}.${key} is not supported.`);
  }
}

function stringArray(value, label, errors, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0) || value.some((item) => typeof item !== 'string' || !item.trim())) {
    errors.push(`${label} must be ${nonEmpty ? 'a non-empty ' : 'an '}array of non-empty strings.`);
    return [];
  }
  return value;
}

function relativePatternIsSafe(value) {
  if (typeof value !== 'string' || !value.trim() || path.posix.isAbsolute(value.replaceAll('\\', '/'))) return false;
  const segments = value.replaceAll('\\', '/').split('/');
  return !segments.includes('..') && !segments.includes('');
}

export function parseProjectVerification(content, label = 'verification.yml') {
  let document;
  try {
    document = YAML.parseDocument(content, { uniqueKeys: true, prettyErrors: true });
  } catch (error) {
    throw new Error(`${label} is invalid YAML: ${error.message}`);
  }
  if (document.errors.length > 0) {
    throw new Error(`${label} is invalid YAML: ${document.errors.map((error) => error.message).join('; ')}`);
  }
  const value = document.toJS({ mapAsMap: false });
  if (!isObject(value)) throw new Error(`${label} must be a YAML mapping.`);
  return value;
}

export function validateProjectVerification(value) {
  const errors = [];
  if (!isObject(value)) return ['verification.yml must be a YAML mapping.'];
  unknownFields(value, ROOT_FIELDS, 'verification', errors);
  if (value.schemaVersion !== 'buildr.project-verification/v1') errors.push('verification.schemaVersion must be buildr.project-verification/v1.');
  if (!MODES.has(value.mode)) errors.push('verification.mode must be augment or authoritative.');
  if (!Array.isArray(value.capabilities)) {
    errors.push('verification.capabilities must be an array.');
    return errors;
  }

  const ids = new Set();
  const dependencies = new Map();
  value.capabilities.forEach((capability, index) => {
    const label = `verification.capabilities[${index}]`;
    if (!isObject(capability)) {
      errors.push(`${label} must be a mapping.`);
      return;
    }
    unknownFields(capability, CAPABILITY_FIELDS, label, errors);
    if (typeof capability.id !== 'string' || !ID_PATTERN.test(capability.id)) errors.push(`${label}.id must be a stable lowercase capability id.`);
    else if (ids.has(capability.id)) errors.push(`${label}.id duplicates ${capability.id}.`);
    else ids.add(capability.id);
    if (typeof capability.title !== 'string' || !capability.title.trim()) errors.push(`${label}.title is required.`);
    if (!MATURITIES.has(capability.maturity)) errors.push(`${label}.maturity must be discovered, trial or stable.`);

    const stages = stringArray(capability.stages, `${label}.stages`, errors, { nonEmpty: true });
    if (new Set(stages).size !== stages.length) errors.push(`${label}.stages must not contain duplicates.`);
    for (const stage of stages) if (!STAGES.has(stage)) errors.push(`${label}.stages contains unsupported stage ${stage}.`);

    if (!isObject(capability.enforcement)) errors.push(`${label}.enforcement must be a mapping.`);
    else {
      for (const [stage, enforcement] of Object.entries(capability.enforcement)) {
        if (!STAGES.has(stage) || !stages.includes(stage)) errors.push(`${label}.enforcement.${stage} must reference a declared stage.`);
        if (!ENFORCEMENTS.has(enforcement)) errors.push(`${label}.enforcement.${stage} must be advisory or required.`);
        if (enforcement === 'required' && capability.maturity !== 'stable') errors.push(`${label}.enforcement.${stage} cannot be required unless maturity is stable.`);
      }
      for (const stage of stages) if (!(stage in capability.enforcement)) errors.push(`${label}.enforcement.${stage} is required for every declared stage.`);
    }

    if (!isObject(capability.command)) errors.push(`${label}.command must be a mapping.`);
    else {
      unknownFields(capability.command, COMMAND_FIELDS, `${label}.command`, errors);
      stringArray(capability.command.argv, `${label}.command.argv`, errors, { nonEmpty: true });
      if (!relativePatternIsSafe(capability.command.cwd)) errors.push(`${label}.command.cwd must be a safe relative path.`);
    }

    if (!isObject(capability.applicability)) errors.push(`${label}.applicability must be a mapping.`);
    else {
      unknownFields(capability.applicability, APPLICABILITY_FIELDS, `${label}.applicability`, errors);
      for (const item of stringArray(capability.applicability.paths, `${label}.applicability.paths`, errors, { nonEmpty: true })) {
        if (!relativePatternIsSafe(item)) errors.push(`${label}.applicability.paths contains unsafe path ${item}.`);
      }
      if (capability.applicability.risks !== undefined) stringArray(capability.applicability.risks, `${label}.applicability.risks`, errors);
    }

    if (!isObject(capability.coverage)) errors.push(`${label}.coverage must be a mapping.`);
    else {
      unknownFields(capability.coverage, COVERAGE_FIELDS, `${label}.coverage`, errors);
      if (typeof capability.coverage.kind !== 'string' || !capability.coverage.kind.trim()) errors.push(`${label}.coverage.kind is required.`);
      stringArray(capability.coverage.owns, `${label}.coverage.owns`, errors, { nonEmpty: true });
    }

    if (!isObject(capability.environment)) errors.push(`${label}.environment must be a mapping.`);
    else {
      unknownFields(capability.environment, ENVIRONMENT_FIELDS, `${label}.environment`, errors);
      stringArray(capability.environment.requires, `${label}.environment.requires`, errors);
      stringArray(capability.environment.services, `${label}.environment.services`, errors);
    }

    if (!isObject(capability.effects)) errors.push(`${label}.effects must be a mapping.`);
    else {
      unknownFields(capability.effects, EFFECT_FIELDS, `${label}.effects`, errors);
      if (!EFFECT_LEVELS.has(capability.effects.level)) errors.push(`${label}.effects.level is unsupported.`);
      for (const item of stringArray(capability.effects.writes, `${label}.effects.writes`, errors)) {
        if (!relativePatternIsSafe(item)) errors.push(`${label}.effects.writes contains unsafe path ${item}.`);
      }
      if (typeof capability.effects.externalSystems !== 'boolean') errors.push(`${label}.effects.externalSystems must be boolean.`);
    }
    if (!AUTHORIZATIONS.has(capability.authorization)) errors.push(`${label}.authorization must be implicit or explicit.`);
    if (capability.authorization === 'implicit' && (capability.effects?.externalSystems === true || !['none', 'local-temporary'].includes(capability.effects?.level))) {
      errors.push(`${label}.authorization cannot be implicit for external, service, shared, persistent or unknown effects.`);
    }

    const dependsOn = capability.dependsOn === undefined ? [] : stringArray(capability.dependsOn, `${label}.dependsOn`, errors);
    const supersedes = capability.supersedes === undefined ? [] : stringArray(capability.supersedes, `${label}.supersedes`, errors);
    if (capability.sources !== undefined) stringArray(capability.sources, `${label}.sources`, errors, { nonEmpty: true });
    dependencies.set(capability.id, dependsOn);
    if (new Set(dependsOn).size !== dependsOn.length) errors.push(`${label}.dependsOn must not contain duplicates.`);
    if (new Set(supersedes).size !== supersedes.length) errors.push(`${label}.supersedes must not contain duplicates.`);
  });

  value.capabilities.forEach((capability, index) => {
    if (!isObject(capability) || typeof capability.id !== 'string') return;
    for (const field of ['dependsOn', 'supersedes']) {
      for (const referenced of capability[field] || []) {
        if (!ids.has(referenced)) errors.push(`verification.capabilities[${index}].${field} references unknown capability ${referenced}.`);
        if (referenced === capability.id) errors.push(`verification.capabilities[${index}].${field} cannot reference itself.`);
      }
    }
  });

  const visiting = new Set();
  const visited = new Set();
  function visit(id, trail) {
    if (visiting.has(id)) {
      errors.push(`verification.dependsOn contains a cycle: ${[...trail, id].join(' -> ')}.`);
      return;
    }
    if (visited.has(id) || !ids.has(id)) return;
    visiting.add(id);
    for (const dependency of dependencies.get(id) || []) visit(dependency, [...trail, id]);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of ids) visit(id, []);

  if (value.mode === 'authoritative') {
    const candidateGates = value.capabilities.filter((capability) => capability?.maturity === 'stable' && capability?.stages?.includes('candidate') && capability?.enforcement?.candidate === 'required');
    if (candidateGates.length === 0) errors.push('verification.mode authoritative requires at least one stable required candidate capability.');
  }
  return [...new Set(errors)];
}

export function createProjectVerificationDiagnostics({ addDoctorFinding }) {
  function diagnoseProjectVerification(result, targetRoot, registry = null) {
    result.projectVerification = [];
    for (const [projectName, project] of Object.entries(registry?.projects || {}).sort(([left], [right]) => left.localeCompare(right))) {
      const projectRoot = path.resolve(targetRoot, project.path || `projects/${projectName}`);
      const declarationPath = path.join(projectRoot, 'verification.yml');
      if (!fs.existsSync(declarationPath) || !fs.statSync(declarationPath).isFile()) continue;
      const relativePath = path.relative(targetRoot, declarationPath).replaceAll(path.sep, '/');
      let declaration;
      try {
        declaration = parseProjectVerification(fs.readFileSync(declarationPath, 'utf8'), relativePath);
      } catch (error) {
        addDoctorFinding(result, 'error', 'project.verification_invalid', error.message, {
          path: relativePath,
          project: projectName,
          suggestion: '修复 Project verification.yml；在声明有效前不要执行其中的测试能力。',
          userActionRequired: true,
        });
        result.projectVerification.push({ project: projectName, path: relativePath, valid: false, mode: null, capabilityCount: 0 });
        continue;
      }
      const errors = validateProjectVerification(declaration);
      result.projectVerification.push({ project: projectName, path: relativePath, valid: errors.length === 0, mode: declaration.mode || null, capabilityCount: Array.isArray(declaration.capabilities) ? declaration.capabilities.length : 0 });
      for (const message of errors) {
        addDoctorFinding(result, 'error', 'project.verification_invalid', message, {
          path: relativePath,
          project: projectName,
          suggestion: '修复 Project verification.yml；在声明有效前不要执行其中的测试能力。',
          userActionRequired: true,
        });
      }
    }
  }
  return { diagnoseProjectVerification };
}
