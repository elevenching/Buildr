import path from 'node:path';

import { createService } from '../../domain/service/service.mjs';

export function serviceError(code, message, status = 400, details = undefined) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  if (details !== undefined) error.details = details;
  return error;
}

function assertObject(input, code, message) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw serviceError(code, message);
}

export function compareServiceGit(service, observed, sameGitIdentity) {
  if (service.source.type !== 'git') return { status: 'not-applicable', findings: [] };
  if (!observed?.available) return { status: 'unavailable', findings: [{ status: 'warning', code: 'service.git_observation_unavailable', message: '无法读取 Service Git 实际状态。' }] };
  const findings = [];
  if (!observed.repository) findings.push({ status: 'error', code: 'service.git_repository_missing', message: 'Service path 不是可读取的 Git repository。' });
  if (observed.repository && !observed.remoteUrl) findings.push({ status: 'error', code: 'service.git_remote_missing', message: `声明的 Git remote ${service.source.git.remote} 不存在。` });
  if (observed.remoteUrl && !sameGitIdentity(observed.remoteUrl, service.source.git.url)) findings.push({ status: 'error', code: 'service.git_remote_conflict', message: 'Service Git remote URL 与 Domain 声明不一致。', details: { declared: service.source.git.url, observed: observed.remoteUrl } });
  if (observed.currentBranch && observed.currentBranch !== service.source.git.integrationBranch) findings.push({ status: 'warning', code: 'service.git_branch_drift', message: `当前分支 ${observed.currentBranch} 不同于 integration branch ${service.source.git.integrationBranch}。` });
  if (observed.dirty === true) findings.push({ status: 'warning', code: 'service.git_dirty', message: 'Service Git worktree 有未提交变化。' });
  if ((observed.ahead || 0) > 0 || (observed.behind || 0) > 0) findings.push({ status: 'info', code: 'service.git_upstream_drift', message: `当前分支相对 upstream ahead ${observed.ahead ?? '?'} / behind ${observed.behind ?? '?'}。` });
  return { status: findings.some((finding) => finding.status === 'error') ? 'error' : findings.length ? 'drift' : 'aligned', findings };
}

export function registerServiceApplication(runtime) {
  function parentRecord(targetRoot, projectCode) {
    const projects = runtime.readProjectRegistryRecord(targetRoot);
    if (projects.registry.migrationRequired) throw serviceError('service_project_migration_required', 'Project registry 需要先迁移，才能使用 Service Domain。', 409);
    const project = projects.projects[projectCode];
    if (!project) throw serviceError('service_project_not_found', `Project 不存在：${projectCode}。`, 404);
    return { projects, project, workspaceId: projects.workspace.workspace.id };
  }

  function readServiceRegistryRecord(targetRoot, projectCode) {
    try {
      const parent = parentRecord(targetRoot, projectCode);
      const persistence = runtime.readServiceRegistryPersistence(targetRoot, parent.project, parent.workspaceId);
      return { ...persistence, ...parent, services: persistence.registry.entities };
    } catch (error) {
      if (error.code) throw error;
      throw serviceError('service_registry_invalid', error.message, 409, { projectCode, path: `projects/${projectCode}/services/manifest.yml` });
    }
  }

  function publicRegistry(record) {
    return {
      project: record.project,
      schemaVersion: record.registry.schemaVersion,
      revision: record.revision,
      migrationRequired: record.registry.migrationRequired,
      services: Object.values(record.services),
      nextActions: record.registry.migrationRequired ? ['请让 Agent 运行 canonical buildr sync <agent>，完成 Service registry v2 安全迁移后再修改。'] : [],
    };
  }

  function listServices(targetRoot, projectCode) {
    return publicRegistry(readServiceRegistryRecord(targetRoot, projectCode));
  }

  function serviceDetail(targetRoot, projectCode, code) {
    const record = readServiceRegistryRecord(targetRoot, projectCode);
    const service = record.services[code];
    if (!service) throw serviceError('service_not_found', `Service 不存在：${projectCode}/${code}。`, 404);
    let observed = null;
    let comparison = { status: 'not-applicable', findings: [] };
    if (service.source.type === 'git') {
      observed = runtime.observeProjectGit(path.join(record.root, service.source.path), service.source.git.remote);
      comparison = compareServiceGit(service, observed, runtime.sameGitIdentity);
    }
    return { project: record.project, schemaVersion: record.registry.schemaVersion, revision: record.revision, migrationRequired: record.registry.migrationRequired, service, observed, comparison, nextActions: publicRegistry(record).nextActions };
  }

  function migrateServiceRegistry(targetRoot, projectCode) {
    const before = readServiceRegistryRecord(targetRoot, projectCode);
    if (!before.registry.migrationRequired) return { ...publicRegistry(before), changed: [] };
    const migrated = Object.values(before.services).map((legacy) => {
      let source = legacy.source;
      if (source.type === 'git') {
        const observed = runtime.observeProjectGit(path.join(before.root, source.path), source.git.remote);
        source = { ...source, git: { ...source.git, url: source.git.url || observed.remoteUrl, integrationBranch: source.git.integrationBranch || observed.currentBranch } };
      }
      return createService({ ...legacy, id: runtime.crypto.randomUUID(), workspaceId: before.workspaceId, projectId: before.project.id, projectCode, source });
    });
    return runtime.withWorkspaceMutation(before.root, `service.registry.migrate:${projectCode}`, [before.manifestPath], () => {
      const current = readServiceRegistryRecord(before.root, projectCode);
      if (current.revision !== before.revision) throw serviceError('service_migration_changed', 'Service registry 在迁移预检后发生变化，请重新执行。', 409);
      runtime.writeServiceRegistry(current.manifestPath, current.project.id, migrated);
      const result = readServiceRegistryRecord(before.root, projectCode);
      if (result.registry.migrationRequired) throw new Error('Service registry migration did not produce canonical v2 data.');
      return { ...publicRegistry(result), changed: [`projects/${projectCode}/services/manifest.yml`] };
    });
  }

  function serviceMigrationPlan(targetRoot, projectCode) {
    const record = readServiceRegistryRecord(targetRoot, projectCode);
    return { required: record.registry.migrationRequired, affectedPaths: [record.manifestPath], signature: JSON.stringify({ revision: record.revision, schemaVersion: record.registry.schemaVersion, projectId: record.project.id }) };
  }

  function updateServiceMetadata(targetRoot, projectCode, code, input) {
    assertObject(input, 'service_update_invalid', 'Service 修改请求必须是对象。');
    const allowed = new Set(['revision', 'name', 'description', 'type']);
    for (const field of Object.keys(input)) if (!allowed.has(field)) throw serviceError('service_update_field_forbidden', `Service 字段不可修改：${field}。`);
    if (typeof input.revision !== 'string' || !input.revision) throw serviceError('service_revision_required', 'Service 修改请求必须包含当前 registry revision。');
    if (input.name === undefined && input.description === undefined && input.type === undefined) throw serviceError('service_update_empty', '至少修改 name、description 或 type。');
    const manifestPath = runtime.serviceDomainManifestPath(targetRoot, projectCode);
    return runtime.withWorkspaceMutation(targetRoot, `service.metadata.update:${projectCode}/${code}`, [manifestPath], () => {
      const current = readServiceRegistryRecord(targetRoot, projectCode);
      if (current.registry.migrationRequired) throw serviceError('service_migration_required', 'Service registry 需要先迁移，当前页面只读。', 409);
      if (current.revision !== input.revision) throw serviceError('service_revision_conflict', 'Service registry 已被其他操作修改，请刷新后重新判断。', 409, { currentRevision: current.revision });
      const existing = current.services[code];
      if (!existing) throw serviceError('service_not_found', `Service 不存在：${projectCode}/${code}。`, 404);
      const updated = createService({ ...existing, projectCode, name: input.name ?? existing.name, description: input.description ?? existing.description, type: input.type ?? existing.type });
      runtime.writeServiceRegistry(current.manifestPath, current.project.id, { ...current.services, [code]: updated });
      return serviceDetail(targetRoot, projectCode, code);
    });
  }

  function generateServiceCreatePrompt(input) {
    assertObject(input, 'service_prompt_invalid', 'Service prompt 请求必须是对象。');
    const allowed = new Set(['projectCode', 'code', 'name', 'description', 'type', 'sourceType', 'localPath', 'gitUrl', 'remote', 'integrationBranch']);
    for (const field of Object.keys(input)) if (!allowed.has(field)) throw serviceError('service_prompt_field_forbidden', `Service prompt 不支持字段：${field}。`);
    const projectCode = String(input.projectCode || '').trim();
    const code = String(input.code || '').trim();
    const name = String(input.name || '').trim();
    const description = String(input.description || '').trim();
    const type = String(input.type || '').trim();
    if (!projectCode || !code || !name || !description || !type) throw serviceError('service_prompt_fields_required', '请填写 Project、Service code、名称、说明和类型。');
    const sourceType = input.sourceType === 'git' ? 'git' : 'local';
    const ref = sourceType === 'git' ? String(input.gitUrl || '').trim() || '<尚未提供 Git URL>' : String(input.localPath || '').trim() || '<尚未提供本地路径>';
    const options = [`--name ${JSON.stringify(name)}`, `--description ${JSON.stringify(description)}`, `--type ${JSON.stringify(type)}`];
    if (sourceType === 'git') options.push(`--remote ${JSON.stringify(String(input.remote || '').trim() || 'origin')}`, `--integration-branch ${JSON.stringify(String(input.integrationBranch || '').trim() || '<请先解析远端 HEAD 或询问>')}`);
    return {
      prompt: ['请在当前 Buildr Workspace 中创建一个 Service。', '', `所属 Project：${projectCode}`, `Code：${code}`, `名称：${name}`, `说明：${description}`, `类型：${type}`, `来源：${sourceType === 'git' ? 'Git repository' : '本地路径'}`, `来源引用：${ref}`, `物化路径：projects/${projectCode}/services/${code}`, '', '执行要求：', '1. 读取并遵循 Buildr Skill，核对 Workspace 与 Project identity。', '2. 在写入前核对来源、目标目录和 nested Git ownership，不保留 workspace 外部本地路径。', sourceType === 'git' ? '3. 核对 Git URL、remote、integration branch 与既有 repo/metadata identity，不盲目 checkout 或 stash。' : '3. 校验本地来源可访问且目标不存在，不创建外部目录链接。', `4. 使用 canonical 命令 buildr service create ${projectCode}/${code} ${JSON.stringify(ref)} ${options.join(' ')} 完成创建。`, '5. 完成后运行适用 doctor，说明 Service Domain、实际路径、Git 状态和剩余问题。'].join('\n'),
      copiedMeansCreated: false,
    };
  }

  Object.assign(runtime, { readServiceRegistryRecord, listServices, serviceDetail, serviceMigrationPlan, migrateServiceRegistry, updateServiceMetadata, generateServiceCreatePrompt });
  return runtime;
}
