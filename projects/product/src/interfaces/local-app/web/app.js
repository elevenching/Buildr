const sessionToken = document.querySelector('meta[name="buildr-session"]').content;
let currentWorkspace = null;
let currentProjects = null;
let currentProject = null;

const byId = (id) => document.getElementById(id);

async function api(resource, options = {}) {
  const response = await fetch(resource, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json', 'x-buildr-session': sessionToken } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.message || 'Buildr 请求失败。');
    error.code = body.error?.code;
    error.details = body.error?.details;
    throw error;
  }
  return body;
}

function renderWorkspace(data) {
  currentWorkspace = data;
  const workspace = data.workspace;
  byId('workspace-title').textContent = workspace.name;
  byId('workspace-description').textContent = workspace.description || '尚未填写 Workspace 说明。';
  byId('workspace-name').value = workspace.name;
  byId('workspace-description-input').value = workspace.description;
  byId('workspace-id').textContent = workspace.id || '迁移后生成';
  byId('workspace-root').textContent = data.rootPath;
  byId('workspace-schema').textContent = String(data.schemaVersion);
  byId('workspace-revision').textContent = data.revision;
  const readOnly = data.migrationRequired;
  byId('workspace-name').disabled = readOnly;
  byId('workspace-description-input').disabled = readOnly;
  byId('save-button').disabled = readOnly;
  const alert = byId('migration-alert');
  alert.classList.toggle('hidden', !readOnly);
  alert.textContent = readOnly ? data.nextActions.join(' ') : '';
  byId('save-state').textContent = readOnly ? '迁移前只读' : '已读取真实文件';
}

async function loadWorkspace() {
  try {
    renderWorkspace(await api('/api/v1/workspace'));
  } catch (error) {
    byId('workspace-title').textContent = '无法读取 Workspace';
    byId('workspace-description').textContent = error.message;
    byId('save-button').disabled = true;
  }
}

function renderProjectList(data) {
  currentProjects = data;
  const list = byId('project-list');
  list.replaceChildren();
  byId('project-empty').classList.toggle('hidden', data.projects.length > 0);
  byId('projects-state').textContent = `${data.projects.length} 个 Project`;
  const migrationAlert = byId('projects-migration-alert');
  migrationAlert.classList.toggle('hidden', !data.migrationRequired);
  migrationAlert.textContent = data.migrationRequired ? data.nextActions.join(' ') : '';
  for (const project of data.projects) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.code = project.code;
    const title = document.createElement('strong');
    title.textContent = project.name;
    const metadata = document.createElement('span');
    metadata.textContent = `${project.code} · ${project.source.type}`;
    button.append(title, metadata);
    button.addEventListener('click', () => loadProject(project.code));
    list.append(button);
  }
}

function renderProjectDetail(data) {
  currentProject = data;
  const project = data.project;
  byId('project-detail').classList.remove('hidden');
  byId('project-title').textContent = project.name;
  byId('project-name').value = project.name;
  byId('project-description').value = project.description;
  byId('project-id').textContent = project.id || '迁移后生成';
  byId('project-workspace-id').textContent = project.workspaceId || '迁移后写入';
  byId('project-code').textContent = project.code;
  byId('project-source').textContent = project.source.type === 'git' ? `${project.source.type} · ${project.source.git.url}` : project.source.type;
  byId('project-path').textContent = project.source.path;
  byId('project-integration-branch').textContent = project.source.git?.integrationBranch || '不适用';
  byId('project-current-branch').textContent = data.observed?.currentBranch || (project.source.type === 'git' ? '无法读取' : '不适用');
  byId('project-git-state').textContent = data.observed
    ? `HEAD ${data.observed.head?.slice(0, 10) || '—'} · ${data.observed.dirty ? '有未提交变化' : 'clean'} · ahead ${data.observed.ahead ?? '—'} / behind ${data.observed.behind ?? '—'}`
    : '不适用';
  const readOnly = data.migrationRequired;
  byId('project-name').disabled = readOnly;
  byId('project-description').disabled = readOnly;
  byId('project-save-button').disabled = readOnly;
  byId('project-save-state').textContent = readOnly ? '迁移前只读' : '已读取真实 registry';
  document.querySelectorAll('#project-list button').forEach((button) => button.classList.toggle('active', button.dataset.code === project.code));
  const findings = byId('project-findings');
  findings.replaceChildren();
  for (const finding of data.comparison?.findings || []) {
    const item = document.createElement('div');
    item.className = `finding ${finding.status || ''}`;
    item.textContent = finding.message;
    findings.append(item);
  }
}

async function loadProjects(preferredCode = null) {
  try {
    const data = await api('/api/v1/projects');
    renderProjectList(data);
    const selected = data.projects.find((project) => project.code === preferredCode) || data.projects[0];
    if (selected) await loadProject(selected.code);
  } catch (error) {
    byId('projects-state').textContent = '读取失败';
    byId('project-empty').textContent = error.message;
  }
}

async function loadProject(code) {
  try {
    renderProjectDetail(await api(`/api/v1/projects/${encodeURIComponent(code)}`));
  } catch (error) {
    byId('projects-state').textContent = error.message;
  }
}

byId('workspace-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentWorkspace) return;
  const state = byId('save-state');
  const button = byId('save-button');
  button.disabled = true;
  state.textContent = '正在保存…';
  try {
    const updated = await api('/api/v1/workspace', {
      method: 'PUT',
      body: JSON.stringify({
        revision: currentWorkspace.revision,
        name: byId('workspace-name').value,
        description: byId('workspace-description-input').value,
      }),
    });
    renderWorkspace(updated);
    state.textContent = '保存成功';
  } catch (error) {
    state.textContent = error.code === 'workspace_revision_conflict' ? '文件已变化，请刷新' : error.message;
    button.disabled = false;
  }
});

byId('project-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!currentProject) return;
  const state = byId('project-save-state');
  const button = byId('project-save-button');
  button.disabled = true;
  state.textContent = '正在保存…';
  try {
    const updated = await api(`/api/v1/projects/${encodeURIComponent(currentProject.project.code)}`, {
      method: 'PUT',
      body: JSON.stringify({
        revision: currentProject.revision,
        name: byId('project-name').value,
        description: byId('project-description').value,
      }),
    });
    renderProjectDetail(updated);
    await loadProjects(updated.project.code);
    state.textContent = '保存成功';
  } catch (error) {
    state.textContent = error.code === 'project_revision_conflict' ? 'registry 已变化，请刷新' : error.message;
    button.disabled = false;
  }
});

byId('project-prompt-source').addEventListener('change', () => {
  const git = byId('project-prompt-source').value === 'git';
  for (const id of ['project-prompt-url', 'project-prompt-remote', 'project-prompt-branch']) byId(id).disabled = !git;
});

byId('project-prompt-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await api('/api/v1/prompts/project-create', {
    method: 'POST',
    body: JSON.stringify({
      code: byId('project-prompt-code').value,
      name: byId('project-prompt-name').value,
      description: byId('project-prompt-description').value,
      sourceType: byId('project-prompt-source').value,
      gitUrl: byId('project-prompt-url').value,
      remote: byId('project-prompt-remote').value,
      integrationBranch: byId('project-prompt-branch').value,
    }),
  });
  byId('project-prompt-output').value = result.prompt;
  byId('project-prompt-result').classList.remove('hidden');
  byId('project-copy-state').textContent = '复制不等于 Project 已创建；请交给 Agent 继续。';
});

byId('project-copy-button').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('project-prompt-output').value);
    byId('project-copy-state').textContent = '指令已复制。Project 尚未创建。';
  } catch {
    byId('project-prompt-output').select();
    byId('project-copy-state').textContent = '浏览器未允许自动复制，已选中指令，请手动复制。';
  }
});

byId('prompt-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const result = await api('/api/v1/prompts/workspace-create', {
    method: 'POST',
    body: JSON.stringify({
      name: byId('prompt-name').value,
      description: byId('prompt-description').value,
      targetPath: byId('prompt-target').value,
    }),
  });
  byId('prompt-output').value = result.prompt;
  byId('prompt-result').classList.remove('hidden');
  byId('copy-state').textContent = '复制后仍需交给 Agent 执行，并不代表 Workspace 已创建。';
});

byId('copy-button').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('prompt-output').value);
    byId('copy-state').textContent = '指令已复制。请粘贴到 Agent 对话框继续；Workspace 尚未创建。';
  } catch {
    byId('prompt-output').select();
    byId('copy-state').textContent = '浏览器未允许自动复制，已选中指令，请手动复制。';
  }
});

loadWorkspace();
loadProjects();
