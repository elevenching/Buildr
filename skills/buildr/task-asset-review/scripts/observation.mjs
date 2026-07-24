#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const SCHEMA = 'buildr.task-asset-observation/v1';
const VALID_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
const VALID_STATUS = new Set(['observing', 'awaiting-human', 'accepted']);
const CANDIDATE_TYPES = new Set(['rule', 'skill', 'capability-contract', 'product-followup']);

function fail(message, code = 'asset_observation_invalid') {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function argsOf(argv) {
  const result = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith('--')) result._.push(value);
    else {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) result[key] = true;
      else { result[key] = next; index += 1; }
    }
  }
  return result;
}

function requireText(args, key) {
  const value = args[key];
  if (typeof value !== 'string' || !value.trim()) fail(`--${key} is required`);
  return value.trim();
}

function validId(value, label) {
  if (!VALID_ID.test(value)) fail(`${label} must match ${VALID_ID}`);
  return value;
}

function parseJson(value, label, fallback = null) {
  if (value === undefined) return fallback;
  try { return JSON.parse(value); } catch (error) { fail(`${label} must be valid JSON: ${error.message}`); }
}

function findWorkspaceRoot(input) {
  let cursor = path.resolve(input);
  if (!fs.existsSync(cursor)) fail(`Workspace path does not exist: ${cursor}`, 'workspace_not_found');
  if (!fs.statSync(cursor).isDirectory()) cursor = path.dirname(cursor);
  while (true) {
    if (fs.existsSync(path.join(cursor, '.buildr', 'workspace.yml'))) return cursor;
    const parent = path.dirname(cursor);
    if (parent === cursor) fail(`Buildr Workspace not found from: ${input}`, 'workspace_not_found');
    cursor = parent;
  }
}

function workspaceId(root) {
  const content = fs.readFileSync(path.join(root, '.buildr', 'workspace.yml'), 'utf8');
  const match = content.match(/^id:\s*([0-9a-fA-F-]{36})\s*$/m);
  if (!match) fail('.buildr/workspace.yml.id must be a UUID', 'workspace_identity_invalid');
  return match[1].toLowerCase();
}

function dataRoot() {
  if (process.env.BUILDR_APP_DATA_DIR) return path.resolve(process.env.BUILDR_APP_DATA_DIR);
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'Buildr');
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Buildr');
  return path.join(process.env.XDG_STATE_HOME || path.join(os.homedir(), '.local', 'state'), 'buildr');
}

function context(args) {
  const root = findWorkspaceRoot(requireText(args, 'workspace-root'));
  const id = workspaceId(root);
  const inbox = path.join(dataRoot(), 'asset-review', id, 'inbox');
  return { root, workspaceId: id, inbox };
}

function observationFile(ctx, observationId) {
  return path.join(ctx.inbox, `${validId(observationId, 'observation id')}.md`);
}

function render(record) {
  if (!VALID_STATUS.has(record.status)) fail(`Unsupported status: ${record.status}`);
  const json = (value) => value == null ? 'null' : JSON.stringify(value);
  return `---
schemaVersion: ${JSON.stringify(SCHEMA)}
observationId: ${JSON.stringify(record.observationId)}
workspaceId: ${JSON.stringify(record.workspaceId)}
owner: ${JSON.stringify(record.owner)}
status: ${record.status}
createdAt: ${JSON.stringify(record.createdAt)}
updatedAt: ${JSON.stringify(record.updatedAt)}
source: ${json(record.source)}
decision: ${json(record.decision)}
destination: ${json(record.destination)}
---

# Task Asset Observation

## Observations

${record.observations.length ? record.observations.map((item) => `- ${item}`).join('\n') : '_None._'}

## Agent Review

${record.review || '_Pending._'}

## Human Decision

${record.decision ? `Accepted \`${record.decision.candidateType}\`: ${record.decision.summary}` : '_Pending._'}

## Handoff Evidence

${record.destination ? `\`\`\`json\n${JSON.stringify(record.destination, null, 2)}\n\`\`\`` : '_Pending._'}
`;
}

function field(content, name) {
  const match = content.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'));
  if (!match) fail(`Observation missing ${name}`, 'observation_corrupt');
  const raw = match[1].trim();
  if (raw === 'null') return null;
  if (name === 'status') return raw;
  try { return JSON.parse(raw); } catch (error) { fail(`Observation ${name} is invalid: ${error.message}`, 'observation_corrupt'); }
}

function parse(content) {
  const observationsBlock = content.match(/## Observations\n\n([\s\S]*?)\n\n## Agent Review/);
  const reviewBlock = content.match(/## Agent Review\n\n([\s\S]*?)\n\n## Human Decision/);
  const lines = observationsBlock?.[1]?.split('\n').filter((line) => line.startsWith('- ')).map((line) => line.slice(2)) || [];
  return {
    schemaVersion: field(content, 'schemaVersion'),
    observationId: field(content, 'observationId'),
    workspaceId: field(content, 'workspaceId'),
    owner: field(content, 'owner'),
    status: field(content, 'status'),
    createdAt: field(content, 'createdAt'),
    updatedAt: field(content, 'updatedAt'),
    source: field(content, 'source'),
    decision: field(content, 'decision'),
    destination: field(content, 'destination'),
    observations: lines,
    review: reviewBlock?.[1] === '_Pending._' ? '' : (reviewBlock?.[1] || ''),
  };
}

function readOwned(file, ctx, owner) {
  if (!fs.existsSync(file)) fail(`Observation not found: ${file}`, 'observation_not_found');
  const record = parse(fs.readFileSync(file, 'utf8'));
  if (record.schemaVersion !== SCHEMA || record.workspaceId !== ctx.workspaceId) fail('Observation identity does not match Workspace', 'observation_identity_mismatch');
  if (record.owner !== owner) fail(`Observation owner mismatch: expected ${record.owner}, received ${owner}`, 'observation_owner_mismatch');
  return record;
}

function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  fs.writeFileSync(temporary, content, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
  try { fs.renameSync(temporary, file); } finally { if (fs.existsSync(temporary)) fs.rmSync(temporary); }
}

function mutate(args, action) {
  const ctx = context(args);
  const observationId = validId(requireText(args, 'observation-id'), 'observation id');
  const owner = validId(requireText(args, 'owner'), 'owner');
  const file = observationFile(ctx, observationId);
  const record = readOwned(file, ctx, owner);
  action(record);
  record.updatedAt = new Date().toISOString();
  atomicWrite(file, render(record));
  return { ok: true, action: args._[0], file, observation: record };
}

function execute(args) {
  const action = args._[0];
  if (!action) fail('Action is required');
  if (action === 'start') {
    const ctx = context(args);
    const observationId = validId(requireText(args, 'observation-id'), 'observation id');
    const owner = validId(requireText(args, 'owner'), 'owner');
    const file = observationFile(ctx, observationId);
    if (fs.existsSync(file)) return { ok: true, action, existing: true, file, observation: readOwned(file, ctx, owner) };
    const now = new Date().toISOString();
    const record = { schemaVersion: SCHEMA, observationId, workspaceId: ctx.workspaceId, owner, status: 'observing', createdAt: now, updatedAt: now, source: parseJson(args.source, '--source', {}), decision: null, destination: null, observations: [], review: '' };
    atomicWrite(file, render(record));
    return { ok: true, action, existing: false, file, observation: record };
  }
  if (action === 'list') {
    const ctx = context(args);
    const files = fs.existsSync(ctx.inbox) ? fs.readdirSync(ctx.inbox).filter((name) => name.endsWith('.md')).sort().map((name) => path.join(ctx.inbox, name)) : [];
    return { ok: true, action, workspaceId: ctx.workspaceId, inbox: ctx.inbox, files };
  }
  if (action === 'observe') return mutate(args, (record) => {
    if (record.status !== 'observing') fail('Only observing records accept new observations', 'observation_state_invalid');
    const message = requireText(args, 'message').replace(/\s+/g, ' ');
    const evidence = typeof args.evidence === 'string' && args.evidence.trim() ? ` [evidence: ${args.evidence.trim().replace(/\s+/g, ' ')}]` : '';
    record.observations.push(`${message}${evidence}`);
  });
  if (action === 'finalize') return mutate(args, (record) => {
    if (record.status !== 'observing') fail('Only observing records can be finalized', 'observation_state_invalid');
    record.review = requireText(args, 'review');
    record.status = 'awaiting-human';
  });
  if (action === 'accept') return mutate(args, (record) => {
    if (record.status !== 'awaiting-human') fail('Only awaiting-human records can be accepted', 'observation_state_invalid');
    const candidateType = requireText(args, 'candidate-type');
    if (!CANDIDATE_TYPES.has(candidateType)) fail(`Unsupported candidate type: ${candidateType}`);
    record.decision = { candidateType, summary: requireText(args, 'summary'), decidedAt: new Date().toISOString() };
    record.status = 'accepted';
  });
  if (action === 'handoff') return mutate(args, (record) => {
    if (record.status !== 'accepted') fail('Only accepted records can receive handoff evidence', 'observation_state_invalid');
    record.destination = parseJson(requireText(args, 'destination'), '--destination');
  });
  if (action === 'reject' || action === 'complete') {
    const ctx = context(args);
    const observationId = validId(requireText(args, 'observation-id'), 'observation id');
    const owner = validId(requireText(args, 'owner'), 'owner');
    const file = observationFile(ctx, observationId);
    const record = readOwned(file, ctx, owner);
    if (action === 'complete') {
      if (record.status !== 'accepted' || !record.destination) fail('Accepted observation needs destination evidence before completion', 'observation_handoff_incomplete');
      const outcome = requireText(args, 'outcome');
      if (!['asset-integrated', 'product-absorbed', 'no-change'].includes(outcome)) fail(`Unsupported outcome: ${outcome}`);
    }
    fs.rmSync(file);
    return { ok: true, action, deleted: true, file, observationId };
  }
  fail(`Unsupported action: ${action}`);
}

try {
  process.stdout.write(`${JSON.stringify(execute(argsOf(process.argv.slice(2))), null, 2)}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({ ok: false, error: { code: error.code || 'asset_observation_error', message: error.message } }, null, 2)}\n`);
  process.exitCode = 1;
}
