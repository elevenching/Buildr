import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import YAML from 'yaml';

import { createRuntime } from '../../src/application/compose-runtime.mjs';
import { createLocalWorkspaceServer } from '../../src/interfaces/local-app/http/server.mjs';

const PRODUCT_ROOT = path.resolve(import.meta.dirname, '../..');
const BUILDR = path.join(PRODUCT_ROOT, 'bin', 'buildr.mjs');

function temporaryRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-workspace-product-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function runBuildr(args, options = {}) {
  return spawnSync(process.execPath, [BUILDR, ...args], { cwd: PRODUCT_ROOT, encoding: 'utf8', ...options });
}

function initWorkspace(t, options = {}) {
  const root = path.join(temporaryRoot(t), 'workspace');
  const result = runBuildr(['init', '--target', root, '--name', options.name || 'Demo', '--description', options.description || 'Demo workspace', '--profile', 'team']);
  assert.equal(result.status, 0, result.stderr);
  return root;
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function writeLegacyWorkspace(root, workspaceId) {
  fs.mkdirSync(path.join(root, '.buildr'), { recursive: true });
  fs.mkdirSync(path.join(root, 'skills'), { recursive: true });
  fs.mkdirSync(path.join(root, 'projects'), { recursive: true });
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Fixture\n');
  fs.writeFileSync(path.join(root, '.buildr', 'workspace.yml'), 'schemaVersion: 1\nkind: organization\nname: Legacy\nprofile: team\n');
  fs.writeFileSync(path.join(root, 'skills', 'manifest.yml'), YAML.stringify({ schemaVersion: 'buildr.skills/v3', workspaceId, skills: [] }));
}

test('init 生成 canonical Workspace，并让两个 Manifest 复用同一 UUID', (t) => {
  const root = initWorkspace(t);
  const workspace = YAML.parse(fs.readFileSync(path.join(root, '.buildr', 'workspace.yml'), 'utf8'));
  const skills = YAML.parse(fs.readFileSync(path.join(root, 'skills', 'manifest.yml'), 'utf8'));
  assert.equal(workspace.schemaVersion, 'buildr.workspace/v1');
  assert.match(workspace.id, /^[0-9a-f-]{36}$/);
  assert.equal(workspace.id, skills.workspaceId);
  assert.equal(workspace.description, 'Demo workspace');
});

test('未提供 description 时 init 写入 TODO，doctor 返回可见诊断', (t) => {
  const root = path.join(temporaryRoot(t), 'workspace');
  let result = runBuildr(['init', '--target', root, '--name', 'needs-description']);
  assert.equal(result.status, 0, result.stderr);
  result = runBuildr(['doctor', '--target', root, '--json']);
  const report = JSON.parse(result.stdout);
  assert.ok(report.findings.some((finding) => finding.code === 'workspace.description_todo'));
});

test('Workspace 应用层只修改白名单字段并防止 revision 覆盖', (t) => {
  const root = initWorkspace(t);
  const runtime = createRuntime();
  const before = runtime.getWorkspace(root);
  const updated = runtime.updateWorkspaceMetadata(root, { revision: before.revision, name: 'Renamed', description: 'Updated description' });
  assert.equal(updated.workspace.name, 'Renamed');
  assert.notEqual(updated.revision, before.revision);
  assert.throws(() => runtime.updateWorkspaceMetadata(root, { revision: before.revision, name: 'Stale' }), (error) => error.code === 'workspace_revision_conflict');
  assert.throws(() => runtime.updateWorkspaceMetadata(root, { revision: updated.revision, id: crypto.randomUUID() }), (error) => error.code === 'workspace_update_field_forbidden');
  assert.equal(runtime.getWorkspace(root).workspace.name, 'Renamed');
});

test('legacy migration 复用 Skills UUID，失败时回滚，identity 冲突零写入', (t) => {
  const runtime = createRuntime();
  const workspaceId = crypto.randomUUID();
  const root = path.join(temporaryRoot(t), 'legacy');
  writeLegacyWorkspace(root, workspaceId);
  const metadataFile = path.join(root, '.buildr', 'workspace.yml');
  const skillsFile = path.join(root, 'skills', 'manifest.yml');
  const originalMetadata = fs.readFileSync(metadataFile, 'utf8');
  const originalSkills = fs.readFileSync(skillsFile, 'utf8');

  process.env.BUILDR_FAULT_AFTER_MUTATION_WRITE = '1';
  try {
    assert.throws(() => runtime.migrateWorkspaceMetadata(root), /Injected Buildr mutation failure/);
  } finally {
    delete process.env.BUILDR_FAULT_AFTER_MUTATION_WRITE;
  }
  assert.equal(fs.readFileSync(metadataFile, 'utf8'), originalMetadata);
  assert.equal(fs.readFileSync(skillsFile, 'utf8'), originalSkills);

  const migrated = runtime.migrateWorkspaceMetadata(root);
  assert.deepEqual(migrated.changed, ['.buildr/workspace.yml']);
  assert.equal(migrated.workspace.id, workspaceId);
  assert.equal(migrated.migrationRequired, false);
  assert.match(migrated.workspace.description, /^TODO:/);

  const conflictRoot = path.join(temporaryRoot(t), 'conflict');
  writeLegacyWorkspace(conflictRoot, crypto.randomUUID());
  const canonical = runtime.renderWorkspaceManifest({ workspace: { id: crypto.randomUUID(), name: 'Conflict', description: 'Conflict workspace' } });
  fs.writeFileSync(path.join(conflictRoot, '.buildr', 'workspace.yml'), canonical);
  const conflictMetadataHash = sha256(path.join(conflictRoot, '.buildr', 'workspace.yml'));
  const conflictSkillsHash = sha256(path.join(conflictRoot, 'skills', 'manifest.yml'));
  assert.throws(() => runtime.migrateWorkspaceMetadata(conflictRoot), (error) => error.code === 'workspace_identity_conflict');
  assert.equal(sha256(path.join(conflictRoot, '.buildr', 'workspace.yml')), conflictMetadataHash);
  assert.equal(sha256(path.join(conflictRoot, 'skills', 'manifest.yml')), conflictSkillsHash);
});

test('sync 显式迁移 legacy Workspace，并在 identity 冲突时保持零写入', (t) => {
  const root = initWorkspace(t, { name: 'legacy-sync' });
  const skills = YAML.parse(fs.readFileSync(path.join(root, 'skills', 'manifest.yml'), 'utf8'));
  const workspaceId = skills.workspaceId;
  fs.writeFileSync(path.join(root, '.buildr', 'workspace.yml'), 'schemaVersion: 1\nkind: organization\nname: Legacy\nprofile: team\n');
  let result = runBuildr(['sync', 'codex', '--target', root]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const migrated = YAML.parse(fs.readFileSync(path.join(root, '.buildr', 'workspace.yml'), 'utf8'));
  assert.equal(migrated.schemaVersion, 'buildr.workspace/v1');
  assert.equal(migrated.id, workspaceId);

  const conflictRoot = initWorkspace(t, { name: 'legacy-conflict' });
  const conflictSkillsFile = path.join(conflictRoot, 'skills', 'manifest.yml');
  const conflictSkills = YAML.parse(fs.readFileSync(conflictSkillsFile, 'utf8'));
  conflictSkills.workspaceId = crypto.randomUUID();
  fs.writeFileSync(conflictSkillsFile, YAML.stringify(conflictSkills));
  const before = sha256(path.join(conflictRoot, '.buildr', 'workspace.yml'));
  result = runBuildr(['sync', 'codex', '--target', conflictRoot]);
  assert.notEqual(result.status, 0);
  assert.equal(sha256(path.join(conflictRoot, '.buildr', 'workspace.yml')), before);
});

test('本地应用只监听 loopback，并保护写 API、revision 与 prompt-only 创建', async (t) => {
  const root = initWorkspace(t);
  const runtime = createRuntime();
  const metadataFile = path.join(root, '.buildr', 'workspace.yml');
  const beforeHash = sha256(metadataFile);
  const instance = createLocalWorkspaceServer(runtime, { targetRoot: root });
  t.after(() => instance.server.close());
  const { url, sessionToken } = await instance.ready;
  assert.match(url, /^http:\/\/127\.0\.0\.1:\d+$/);

  const html = await fetch(url).then((response) => response.text());
  assert.match(html, /Buildr 工作空间/);
  assert.match(html, /id="resource-nav-toggle"/);
  assert.match(html, /工作空间设置/);
  assert.doesNotMatch(html, /https?:\/\//);
  let response;
  for (const route of ['/settings/workspace', '/projects', '/services']) {
    response = await fetch(`${url}${route}`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /Buildr 工作空间/);
  }
  for (const asset of ['/app.js', '/api-client.js', '/router.js', '/features/workspace.js', '/features/projects.js', '/features/services.js', '/features/agent-actions.js']) {
    response = await fetch(`${url}${asset}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/javascript/);
  }
  const projectFeature = fs.readFileSync(path.join(PRODUCT_ROOT, 'src', 'interfaces', 'local-app', 'web', 'features', 'projects.js'), 'utf8');
  const serviceFeature = fs.readFileSync(path.join(PRODUCT_ROOT, 'src', 'interfaces', 'local-app', 'web', 'features', 'services.js'), 'utf8');
  assert.match(projectFeature, /id="create-project-button"/);
  assert.match(serviceFeature, /id="create-service-button"/);
  assert.match(serviceFeature, /id="service-project-select"/);
  assert.match(serviceFeature, /class="resource-detail hidden"/);
  assert.doesNotMatch(`${projectFeature}\n${serviceFeature}`, /project-prompt-form|service-prompt-form|legacy\/resources/);
  response = await fetch(`${url}/unknown-page`);
  assert.equal(response.status, 404);
  response = await fetch(`${url}/api/v1/unknown`);
  assert.equal(response.status, 404);
  const current = await fetch(`${url}/api/v1/workspace`).then((response) => response.json());
  assert.equal(current.workspace.name, 'Demo');
  assert.equal(sha256(metadataFile), beforeHash, '只读启动和读取不得修改 Workspace');

  response = await fetch(`${url}/api/v1/workspace`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', 'x-buildr-session': sessionToken },
    body: JSON.stringify({ revision: current.revision, name: 'Blocked' }),
  });
  assert.equal(response.status, 403);

  response = await fetch(`${url}/api/v1/workspace`, {
    method: 'PUT',
    headers: { origin: url, 'content-type': 'application/json', 'x-buildr-session': 'invalid' },
    body: JSON.stringify({ revision: current.revision, name: 'Blocked' }),
  });
  assert.equal(response.status, 403);

  response = await fetch(`${url}/api/v1/workspace`, {
    method: 'PUT',
    headers: { origin: url, 'content-type': 'text/plain', 'x-buildr-session': sessionToken },
    body: JSON.stringify({ revision: current.revision, name: 'Blocked' }),
  });
  assert.equal(response.status, 415);

  response = await fetch(`${url}/api/v1/prompts/workspace-create`, {
    method: 'POST',
    headers: { origin: url, 'content-type': 'application/json', 'x-buildr-session': sessionToken },
    body: JSON.stringify({ name: 'Large', description: 'x'.repeat(40 * 1024) }),
  });
  assert.equal(response.status, 413);

  response = await fetch(`${url}/api/v1/workspace?path=/tmp/other`);
  assert.equal(response.status, 400);

  response = await fetch(`${url}/api/v1/workspace`, {
    method: 'PUT',
    headers: { origin: url, 'content-type': 'application/json', 'x-buildr-session': sessionToken },
    body: JSON.stringify({ revision: current.revision, name: 'From UI', description: 'Saved by local app' }),
  });
  assert.equal(response.status, 200);
  const updated = await response.json();
  assert.equal(updated.workspace.name, 'From UI');

  response = await fetch(`${url}/api/v1/workspace`, {
    method: 'PUT',
    headers: { origin: url, 'content-type': 'application/json', 'x-buildr-session': sessionToken },
    body: JSON.stringify({ revision: current.revision, name: 'Stale UI' }),
  });
  assert.equal(response.status, 409);
  assert.equal((await response.json()).error.code, 'workspace_revision_conflict');

  response = await fetch(`${url}/api/v1/prompts/workspace-create`, {
    method: 'POST',
    headers: { origin: url, 'content-type': 'application/json', 'x-buildr-session': sessionToken },
    body: JSON.stringify({ name: 'Next', description: 'Next workspace', targetPath: '' }),
  });
  assert.equal(response.status, 200);
  const prompt = await response.json();
  assert.match(prompt.prompt, /先读取并遵循当前可用的 Buildr Skill/);
  assert.match(prompt.prompt, /目标位置尚未指定/);
  assert.equal(prompt.copiedMeansCreated, false);
});

test('public CLI 暴露 app 与 init description help', () => {
  const appHelp = runBuildr(['app', '--help']);
  assert.equal(appHelp.status, 0, appHelp.stderr);
  assert.match(appHelp.stdout, /只监听 127\.0\.0\.1/);
  const initHelp = runBuildr(['init', '--help']);
  assert.equal(initHelp.status, 0, initHelp.stderr);
  assert.match(initHelp.stdout, /--description <text>/);
});
