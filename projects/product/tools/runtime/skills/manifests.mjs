import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { ensureFile } from './primitives.mjs';

export const SKILLS_SCHEMA_V1 = 'buildr.skills/v1';
export const SKILLS_SCHEMA_V2 = 'buildr.skills/v2';
export const CAPABILITY_CONTRACT_SCHEMA = 'buildr.capability-contract/v1';
export const CAPABILITY_REASONS = Object.freeze([
  'missing_provider',
  'ambiguous_provider',
  'version_mismatch',
  'runtime_unavailable',
  'invalid_binding',
  'provider_not_ready',
  'dependency_cycle',
]);
export const CONTRACT_SECTIONS = Object.freeze([
  'Purpose',
  'Consumer Obligations',
  'Minimum Guarantees',
  'Effects and Authorization',
  'Result Evidence',
  'Decision Points',
  'Allowed Variations',
]);

const CAPABILITY_ID = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/;

export function capabilityKey(capability, version) {
  return `${capability}@${version}`;
}

export function validateCapabilityIdentity(capability, version, label) {
  if (typeof capability !== 'string' || !CAPABILITY_ID.test(capability)) {
    throw new Error(`${label}.capability must be a lowercase namespaced id`);
  }
  if (!Number.isInteger(version) || version <= 0) {
    throw new Error(`${label}.version must be a positive integer`);
  }
}

function parseYaml(content, label) {
  try {
    const parsed = YAML.parse(content);
    if (!isPlainObject(parsed)) throw new Error('document must be a mapping');
    return parsed;
  } catch (error) {
    throw new Error(`Invalid YAML in ${label}: ${error.message}`);
  }
}

export function parseCapabilityContract(contractPath, assertion = null) {
  ensureFile(contractPath, `Capability contract not found: ${contractPath}`);
  const content = fs.readFileSync(contractPath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Capability contract must start with closed YAML frontmatter: ${contractPath}`);
  const metadata = parseYaml(match[1], contractPath);
  if (metadata.schemaVersion !== CAPABILITY_CONTRACT_SCHEMA) {
    throw new Error(`Unsupported capability contract schemaVersion in ${contractPath}: ${metadata.schemaVersion || '<missing>'}`);
  }
  validateCapabilityIdentity(metadata.id, metadata.version, `Capability contract ${contractPath}`);
  if (assertion && (metadata.id !== assertion.id || metadata.version !== assertion.version)) {
    throw new Error(`Capability contract identity mismatch in ${contractPath}: manifest=${capabilityKey(assertion.id, assertion.version)} frontmatter=${capabilityKey(metadata.id, metadata.version)}`);
  }
  const body = content.slice(match[0].length);
  for (const section of CONTRACT_SECTIONS) {
    if (!new RegExp(`^##\\s+${section}\\s*$`, 'm').test(body)) {
      throw new Error(`Capability contract is missing required section "${section}": ${contractPath}`);
    }
  }
  return {
    schemaVersion: metadata.schemaVersion,
    id: metadata.id,
    version: metadata.version,
    content,
    digest: crypto.createHash('sha256').update(Buffer.from(content, 'utf8')).digest('hex'),
  };
}

function validateDeclarations(items, label, modeRequired = false) {
  if (items === undefined) return;
  if (!Array.isArray(items)) throw new Error(`${label} must be an array`);
  const seen = new Set();
  items.forEach((item, index) => {
    if (!isPlainObject(item)) throw new Error(`${label}[${index}] must be an object`);
    validateCapabilityIdentity(item.capability, item.version, `${label}[${index}]`);
    if (modeRequired && !['required', 'optional'].includes(item.mode)) {
      throw new Error(`${label}[${index}].mode must be required or optional`);
    }
    const key = capabilityKey(item.capability, item.version);
    if (seen.has(key)) throw new Error(`Duplicate capability declaration in ${label}: ${key}`);
    seen.add(key);
  });
}

export function validateSkillsManifestDocument(document, manifestPath, options = {}) {
  const schemaVersion = document.schemaVersion ?? null;
  if (schemaVersion !== null && schemaVersion !== SKILLS_SCHEMA_V1 && schemaVersion !== SKILLS_SCHEMA_V2) {
    throw new Error(`Unsupported Skills manifest schemaVersion in ${manifestPath}: ${schemaVersion}`);
  }
  for (const field of ['skills', 'contracts', 'bindings']) {
    if (document[field] !== undefined && !Array.isArray(document[field])) throw new Error(`${field} must be an array in ${manifestPath}`);
  }
  if (schemaVersion !== SKILLS_SCHEMA_V2 && ((document.contracts?.length ?? 0) || (document.bindings?.length ?? 0))) {
    throw new Error(`Capability contracts and bindings require ${SKILLS_SCHEMA_V2} in ${manifestPath}`);
  }
  const skillIds = new Set();
  for (const [index, skill] of (document.skills || []).entries()) {
    if (!isPlainObject(skill) || typeof skill.id !== 'string' || !skill.id) throw new Error(`skills[${index}].id is required in ${manifestPath}`);
    if (skillIds.has(skill.id)) throw new Error(`Duplicate skill id in ${manifestPath}: ${skill.id}`);
    skillIds.add(skill.id);
    const hasPath = skill.path !== undefined;
    const hasSource = skill.source !== undefined;
    const hasResolved = skill.resolved !== undefined;
    const hasSourceLabel = hasPath && typeof skill.source === 'string' && isSourceLabel(skill.source);
    if (!hasPath && !hasSource && !hasResolved) throw new Error(`skills[${index}] must include path, source, or resolved in ${manifestPath}`);
    if (hasPath && ((hasSource && !hasSourceLabel) || hasResolved)) throw new Error(`skills[${index}] must not combine path with source or resolved in ${manifestPath}`);
    if (skill.enabled !== undefined && typeof skill.enabled !== 'boolean') throw new Error(`skills[${index}].enabled must be boolean in ${manifestPath}`);
    if (skill.required !== undefined && typeof skill.required !== 'boolean') throw new Error(`skills[${index}].required must be boolean in ${manifestPath}`);
    if (skill.runtimes !== undefined && (!Array.isArray(skill.runtimes) || !skill.runtimes.every((item) => typeof item === 'string'))) throw new Error(`skills[${index}].runtimes must be an array of strings in ${manifestPath}`);
    validateDeclarations(skill.provides, `skills[${index}].provides`);
    validateDeclarations(skill.requires, `skills[${index}].requires`, true);
  }
  const contracts = new Set();
  for (const [index, contract] of (document.contracts || []).entries()) {
    if (!isPlainObject(contract)) throw new Error(`contracts[${index}] must be an object in ${manifestPath}`);
    validateCapabilityIdentity(contract.id, contract.version, `contracts[${index}]`);
    if (typeof contract.path !== 'string' || !contract.path || typeof contract.description !== 'string' || !contract.description) {
      throw new Error(`contracts[${index}] must include path and description in ${manifestPath}`);
    }
    const key = capabilityKey(contract.id, contract.version);
    if (contracts.has(key)) throw new Error(`Duplicate capability contract in ${manifestPath}: ${key}`);
    contracts.add(key);
    if (options.validateContracts !== false) {
      const contractPath = path.resolve(path.dirname(manifestPath), contract.path);
      const relative = path.relative(path.dirname(manifestPath), contractPath);
      if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Capability contract path must stay inside skills root: ${contract.path}`);
      parseCapabilityContract(contractPath, contract);
    }
  }
  const bindings = new Set();
  for (const [index, binding] of (document.bindings || []).entries()) {
    if (!isPlainObject(binding)) throw new Error(`bindings[${index}] must be an object in ${manifestPath}`);
    validateCapabilityIdentity(binding.capability, binding.version, `bindings[${index}]`);
    if (typeof binding.provider !== 'string' || !binding.provider) throw new Error(`bindings[${index}].provider is required in ${manifestPath}`);
    const key = capabilityKey(binding.capability, binding.version);
    if (bindings.has(key)) throw new Error(`Duplicate capability binding in ${manifestPath}: ${key}`);
    bindings.add(key);
  }
  return document;
}

export function migrateSkillsManifestDocument(document) {
  return {
    ...document,
    schemaVersion: SKILLS_SCHEMA_V2,
    skills: Array.isArray(document.skills) ? document.skills : [],
  };
}

export function parseSkillsManifestDocument(manifestPath, options = {}) {
  ensureFile(manifestPath, `Manifest not found: ${manifestPath}`);
  const original = parseYaml(fs.readFileSync(manifestPath, 'utf8'), manifestPath);
  validateSkillsManifestDocument(original, manifestPath, options);
  return options.migrate === false ? original : migrateSkillsManifestDocument(original);
}

export function parseSkillsManifest(manifestPath, options = {}) {
  return parseSkillsManifestDocument(manifestPath, options).skills;
}

export function parseBooleanScalar(value) {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  throw new Error(`Expected boolean scalar, got: ${value}`);
}

export function isSourceLabel(value) {
  return ['buildr', 'openspec', 'workspace', 'project', 'service'].includes(value);
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
