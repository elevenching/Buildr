import { createWorkspace, isWorkspaceId } from '../../domain/workspace/workspace.mjs';
import { WORKSPACE_DESCRIPTION_TODO } from '../../infrastructure/filesystem/workspace-manifest-repository.mjs';

function workspaceError(code, message, status = 400, details = undefined) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  if (details !== undefined) error.details = details;
  return error;
}

export function resolveWorkspaceIdentity(workspaceId, skillsWorkspaceId, generateId = () => null) {
  if (workspaceId !== null && workspaceId !== undefined && !isWorkspaceId(workspaceId)) {
    throw workspaceError('workspace_identity_invalid', '.buildr/workspace.yml.id 必须是 UUID。', 409, { path: '.buildr/workspace.yml' });
  }
  if (skillsWorkspaceId !== null && skillsWorkspaceId !== undefined && !isWorkspaceId(skillsWorkspaceId)) {
    throw workspaceError('workspace_identity_invalid', 'skills/manifest.yml.workspaceId 必须是 UUID。', 409, { path: 'skills/manifest.yml' });
  }
  if (workspaceId && skillsWorkspaceId && workspaceId !== skillsWorkspaceId) {
    throw workspaceError(
      'workspace_identity_conflict',
      `Workspace identity 冲突：.buildr/workspace.yml.id=${workspaceId}，skills/manifest.yml.workspaceId=${skillsWorkspaceId}。`,
      409,
      { workspaceId, skillsWorkspaceId },
    );
  }
  return workspaceId || skillsWorkspaceId || generateId();
}

export function registerWorkspaceApplication(runtime) {
  const createWorkspaceId = () => runtime.crypto.randomUUID();

  function readWorkspaceRecord(targetRoot) {
    let persistence;
    try {
      persistence = runtime.readWorkspacePersistence(targetRoot);
    } catch (error) {
      if (error.code) throw error;
      throw workspaceError('workspace_metadata_invalid', error.message, 409, { path: '.buildr/workspace.yml' });
    }
    const persistedWorkspaceId = persistence.metadata.canonical ? persistence.metadata.workspace.id : null;
    const workspaceId = resolveWorkspaceIdentity(persistedWorkspaceId, persistence.skills.workspaceId);
    const migrationRequired = persistence.metadata.migrationRequired
      || !persistence.skills.workspaceId
      || persistence.skills.workspaceId !== persistedWorkspaceId;
    return {
      ...persistence,
      migrationRequired,
      workspace: {
        id: persistedWorkspaceId || persistence.skills.workspaceId || null,
        name: persistence.metadata.workspace.name,
        description: persistence.metadata.workspace.description,
      },
      resolvedWorkspaceId: workspaceId,
    };
  }

  function publicWorkspace(record) {
    return {
      workspace: record.workspace,
      rootPath: record.root,
      schemaVersion: record.metadata.schemaVersion,
      revision: record.revision,
      migrationRequired: record.migrationRequired,
      compatibility: record.metadata.compatibility,
      nextActions: record.migrationRequired
        ? ['请让 Agent 运行 canonical buildr sync <agent>，完成 Workspace metadata 安全迁移后再修改。']
        : [],
    };
  }

  function getWorkspace(targetRoot) {
    return publicWorkspace(readWorkspaceRecord(targetRoot));
  }

  function workspaceMigrationPlan(targetRoot) {
    const record = readWorkspaceRecord(targetRoot);
    return {
      required: record.migrationRequired,
      affectedPaths: [record.metadataPath, record.skillsPath],
      signature: JSON.stringify({
        metadataRevision: record.revision,
        workspaceId: record.metadata.canonical ? record.metadata.workspace.id : null,
        skillsWorkspaceId: record.skills.workspaceId,
      }),
    };
  }

  function migrateWorkspaceMetadata(targetRoot) {
    const before = readWorkspaceRecord(targetRoot);
    const workspaceId = before.resolvedWorkspaceId || createWorkspaceId();
    return runtime.withWorkspaceMutation(before.root, 'workspace.metadata.migrate', [before.metadataPath, before.skillsPath], () => {
      const current = readWorkspaceRecord(before.root);
      if (current.resolvedWorkspaceId && current.resolvedWorkspaceId !== workspaceId) {
        throw workspaceError('workspace_migration_changed', 'Workspace identity 在迁移预检后发生变化，请重新执行。', 409);
      }
      const workspace = createWorkspace({
        id: workspaceId,
        name: current.workspace.name,
        description: current.workspace.description || WORKSPACE_DESCRIPTION_TODO,
      });
      const metadataContent = runtime.renderWorkspaceManifest({ workspace, compatibility: current.metadata.compatibility });
      const skillsContent = runtime.renderSkillsManifestYaml({
        ...current.skills,
        workspaceId,
        skills: current.skills.skills || [],
      });
      const changed = [];
      if (current.metadataContent !== metadataContent) {
        runtime.writeWorkspaceManifest(current.metadataPath, metadataContent);
        changed.push('.buildr/workspace.yml');
      }
      if (current.skillsContent !== skillsContent) {
        runtime.atomicWriteFile(current.skillsPath, skillsContent);
        changed.push('skills/manifest.yml');
      }
      const result = readWorkspaceRecord(before.root);
      if (result.migrationRequired) {
        throw new Error('Workspace metadata migration did not produce a canonical identity.');
      }
      return { ...publicWorkspace(result), changed };
    });
  }

  function updateWorkspaceMetadata(targetRoot, input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw workspaceError('workspace_update_invalid', 'Workspace 修改请求必须是对象。');
    }
    const allowed = new Set(['revision', 'name', 'description']);
    for (const field of Object.keys(input)) {
      if (!allowed.has(field)) {
        throw workspaceError('workspace_update_field_forbidden', `Workspace 字段不可修改：${field}。`);
      }
    }
    if (typeof input.revision !== 'string' || !input.revision) {
      throw workspaceError('workspace_revision_required', 'Workspace 修改请求必须包含当前 revision。');
    }
    if (input.name === undefined && input.description === undefined) {
      throw workspaceError('workspace_update_empty', '至少修改 name 或 description。');
    }
    const metadataPath = runtime.workspaceMetadataPath(targetRoot);
    return runtime.withWorkspaceMutation(targetRoot, 'workspace.metadata.update', [metadataPath], () => {
      const current = readWorkspaceRecord(targetRoot);
      if (current.migrationRequired) {
        throw workspaceError('workspace_migration_required', 'Workspace metadata 需要先迁移，当前页面只读。', 409);
      }
      if (current.revision !== input.revision) {
        throw workspaceError('workspace_revision_conflict', 'Workspace 文件已被其他操作修改，请刷新后重新判断。', 409, {
          currentRevision: current.revision,
        });
      }
      const workspace = createWorkspace({
        id: current.workspace.id,
        name: input.name === undefined ? current.workspace.name : input.name,
        description: input.description === undefined ? current.workspace.description : input.description,
      });
      runtime.writeWorkspaceManifest(current.metadataPath, runtime.renderWorkspaceManifest({
        workspace,
        compatibility: current.metadata.compatibility,
      }));
      return publicWorkspace(readWorkspaceRecord(targetRoot));
    });
  }

  function generateWorkspaceCreatePrompt(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      throw workspaceError('workspace_prompt_invalid', 'Workspace prompt 请求必须是对象。');
    }
    const allowed = new Set(['name', 'description', 'targetPath']);
    for (const field of Object.keys(input)) {
      if (!allowed.has(field)) {
        throw workspaceError('workspace_prompt_field_forbidden', `Workspace prompt 不支持字段：${field}。`);
      }
    }
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const description = typeof input.description === 'string' ? input.description.trim() : '';
    const targetPath = typeof input.targetPath === 'string' ? input.targetPath.trim() : '';
    if (!name) throw workspaceError('workspace_prompt_name_required', '请填写 Workspace 名称。');
    if (!description) throw workspaceError('workspace_prompt_description_required', '请填写 Workspace 说明。');
    const targetInstruction = targetPath
      ? `目标位置：${targetPath}\n请先核对该目录、Git 边界和写入授权。`
      : '目标位置尚未指定。请先向我确认目标目录，不要自行猜测路径。';
    return {
      prompt: [
        '请为我创建一个新的 Buildr Workspace。',
        '',
        `名称：${name}`,
        `说明：${description}`,
        targetInstruction,
        '',
        '执行要求：',
        '1. 先读取并遵循当前可用的 Buildr Skill。',
        '2. 检查目标目录是否已有内容、是否由 Git 管理，以及我是否已授权必要写入。',
        '3. 如 profile、Agent runtime 或其他必要信息不明确，先向我确认，不要猜测。',
        '4. 使用 canonical Buildr CLI 完成 init；需要 runtime 时再执行对应 sync。',
        '5. 完成后运行适用的 doctor，并说明真实创建结果、变更文件和仍需处理的问题。',
      ].join('\n'),
      copiedMeansCreated: false,
    };
  }

  function diagnoseWorkspaceMetadata(result, targetRoot) {
    try {
      const workspace = getWorkspace(targetRoot);
      result.workspace.metadata = workspace;
      if (workspace.migrationRequired) {
        runtime.addDoctorFinding(result, 'warning', 'workspace.metadata_migration_required', 'Workspace metadata 需要迁移为 canonical schema。', {
          path: '.buildr/workspace.yml',
          suggestion: '运行 canonical buildr sync <agent> 完成事务迁移。',
          userActionRequired: true,
        });
      }
      if (workspace.workspace.description === WORKSPACE_DESCRIPTION_TODO) {
        runtime.addDoctorFinding(result, 'warning', 'workspace.description_todo', 'Workspace 说明仍是待补全内容。', {
          path: '.buildr/workspace.yml',
          suggestion: '通过 buildr app 或 Agent 补充 Workspace 的管理范围和用途。',
          userActionRequired: true,
        });
      }
    } catch (error) {
      runtime.addDoctorFinding(result, 'error', error.code || 'workspace_metadata_invalid', error.message, {
        path: error.details?.path || '.buildr/workspace.yml',
        details: error.details,
        suggestion: error.code === 'workspace_identity_conflict'
          ? '核对两处 identity 的来源，确认正确 UUID 后再由 Agent 修复；Buildr 不会自动选择。'
          : '修复 Workspace metadata 后重新运行 doctor。',
        userActionRequired: true,
      });
    }
  }

  Object.assign(runtime, {
    createWorkspaceId,
    readWorkspaceRecord,
    getWorkspace,
    workspaceMigrationPlan,
    migrateWorkspaceMetadata,
    updateWorkspaceMetadata,
    generateWorkspaceCreatePrompt,
    diagnoseWorkspaceMetadata,
  });
  return runtime;
}
