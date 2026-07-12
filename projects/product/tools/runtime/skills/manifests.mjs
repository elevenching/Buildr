import fs from 'node:fs';
import { ensureFile, unquoteYamlScalar } from './primitives.mjs';

export function parseSkillsManifest(manifestPath) {
  ensureFile(manifestPath, `Manifest not found: ${manifestPath}`);
  const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/);
  const skills = [];
  let inSkills = false;
  let current = null;
  let currentObject = null;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    if (trimmed === 'skills:') {
      inSkills = true;
      continue;
    }
    if (!inSkills) {
      continue;
    }
    const idMatch = trimmed.match(/^-\s+id:\s*(.+)$/);
    if (idMatch) {
      if (current) {
        skills.push(current);
      }
      current = { id: unquoteYamlScalar(idMatch[1]) };
      currentObject = null;
      continue;
    }
    const objectStartMatch = trimmed.match(/^(source|resolved|install):\s*$/);
    if (objectStartMatch && current) {
      currentObject = objectStartMatch[1];
      current[currentObject] = {};
      continue;
    }
    const nestedMatch = rawLine.match(/^\s{6}([A-Za-z][A-Za-z0-9_-]*):\s*(.+)$/);
    if (nestedMatch && current && currentObject) {
      current[currentObject][nestedMatch[1]] = unquoteYamlScalar(nestedMatch[2]);
      continue;
    }
    currentObject = null;
    const pathMatch = trimmed.match(/^path:\s*(.+)$/);
    if (pathMatch && current) {
      current.path = unquoteYamlScalar(pathMatch[1]);
      continue;
    }
    const sourceMatch = trimmed.match(/^source:\s*(.+)$/);
    if (sourceMatch && current) {
      current.source = unquoteYamlScalar(sourceMatch[1]);
      continue;
    }
    const resolvedMatch = trimmed.match(/^resolved:\s*(.+)$/);
    if (resolvedMatch && current) {
      current.resolved = unquoteYamlScalar(resolvedMatch[1]);
      continue;
    }
    const installMatch = trimmed.match(/^install:\s*(.+)$/);
    if (installMatch && current) {
      current.install = unquoteYamlScalar(installMatch[1]);
      continue;
    }
    const runtimePathMatch = trimmed.match(/^runtimePath:\s*(.+)$/);
    if (runtimePathMatch && current) {
      current.runtimePath = unquoteYamlScalar(runtimePathMatch[1]);
      continue;
    }
    const enabledMatch = trimmed.match(/^enabled:\s*(.+)$/);
    if (enabledMatch && current) {
      current.enabled = parseBooleanScalar(unquoteYamlScalar(enabledMatch[1]));
      continue;
    }
    const requiredMatch = trimmed.match(/^required:\s*(.+)$/);
    if (requiredMatch && current) {
      current.required = parseBooleanScalar(unquoteYamlScalar(requiredMatch[1]));
      continue;
    }
    const stateMatch = trimmed.match(/^state:\s*(.+)$/);
    if (stateMatch && current) {
      current.state = unquoteYamlScalar(stateMatch[1]);
      continue;
    }
    const runtimesMatch = trimmed.match(/^runtimes:\s*(.+)$/);
    if (runtimesMatch && current) {
      current.runtimes = parseInlineStringArray(unquoteYamlScalar(runtimesMatch[1]));
      continue;
    }
    if (/^[A-Za-z_][A-Za-z0-9_-]*:/.test(trimmed) && !trimmed.startsWith('-')) {
      continue;
    }
    throw new Error(`Unsupported manifest syntax in ${manifestPath}: ${rawLine}`);
  }

  if (current) {
    skills.push(current);
  }
  for (const skill of skills) {
    const hasPath = skill.path !== undefined;
    const hasSource = skill.source !== undefined;
    const hasResolved = skill.resolved !== undefined;
    const hasSourceLabel = hasPath && typeof skill.source === 'string' && isSourceLabel(skill.source);
    if (!skill.id || (hasPath && ((hasSource && !hasSourceLabel) || hasResolved)) || (!hasPath && !hasSource && !hasResolved)) {
      throw new Error(`Skill entry must include id and path, source, or resolved in ${manifestPath}`);
    }
    if (hasSourceLabel) {
      // source is an ownership label for manifest-managed local Skills.
    } else if (hasSource && typeof skill.source !== 'string') {
      validateSkillSourceObject(skill.source, `Skill source is invalid in ${manifestPath}`);
    }
    if (hasResolved) {
      if (!isPlainObject(skill.resolved)) {
        throw new Error(`Skill resolved must be an object in ${manifestPath}`);
      }
      validateResolvedObject(skill.resolved, manifestPath);
    }
    if (skill.install !== undefined) {
      if (!isPlainObject(skill.install)) {
        throw new Error(`Skill install must be an object in ${manifestPath}`);
      }
      if (skill.install.mode !== undefined && !['agent', 'buildr'].includes(skill.install.mode)) {
        throw new Error(`Skill install.mode must be agent or buildr in ${manifestPath}`);
      }
    }
  }
  return skills;
}

export function parseBooleanScalar(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Expected boolean scalar, got: ${value}`);
}

function parseInlineStringArray(value) {
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) return parsed;
  } catch {
    // Fall through.
  }
  throw new Error(`Expected JSON string array, got: ${value}`);
}


export function isSourceLabel(value) {
  return ['buildr', 'openspec', 'workspace', 'project', 'service'].includes(value);
}

export function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateSkillSourceObject(source, message) {
  if (!source.kind || typeof source.kind !== 'string' || !source.url || typeof source.url !== 'string') {
    throw new Error(message);
  }
}

function validateResolvedObject(resolved, manifestPath) {
  validateSkillSourceObject(resolved, `Skill resolved must include kind and url in ${manifestPath}`);
  if (resolved.kind !== 'skill-url') {
    throw new Error(`Unsupported resolved Skill kind in ${manifestPath}: ${resolved.kind}`);
  }
}
