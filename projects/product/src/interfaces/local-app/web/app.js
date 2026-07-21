const sessionToken = document.querySelector('meta[name="buildr-session"]').content;
let currentWorkspace = null;

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
