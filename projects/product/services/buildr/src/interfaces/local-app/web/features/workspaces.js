function workspaceCard(entry, revision) {
  const article = document.createElement('article');
  article.className = 'workspace-card';
  const ready = entry.status === 'ready';
  article.innerHTML = `
    <a class="workspace-card-main" data-route>
      <div class="workspace-card-heading"><span class="state ${ready ? 'success' : 'warning'}"></span><span class="workspace-health"></span></div>
      <h2></h2><p class="workspace-description"></p><p class="mono workspace-root"></p>
      <span class="workspace-open-label">进入工作空间 <span aria-hidden="true">→</span></span>
    </a>
    <button class="workspace-remove" type="button">移除</button>`;
  article.querySelector('h2').textContent = entry.workspace?.name || '不可用的工作空间';
  article.querySelector('.workspace-description').textContent = entry.workspace?.description || entry.error?.message || '无法读取工作空间信息。';
  article.querySelector('.workspace-root').textContent = entry.rootPath;
  const health = ready ? '可用' : entry.status === 'unavailable' ? '路径不可用' : entry.status === 'identity_conflict' ? '身份冲突' : '需要处理';
  article.querySelector('.state').textContent = health; article.querySelector('.workspace-health').textContent = entry.updatedAt ? `最近登记 ${new Date(entry.updatedAt).toLocaleDateString('zh-CN')}` : '本机登记';
  const open = article.querySelector('.workspace-card-main');
  if (ready) open.href = `/workspaces/${entry.workspace.id}/`;
  else { open.removeAttribute('href'); open.setAttribute('aria-disabled', 'true'); }
  article.querySelector('.workspace-remove').addEventListener('click', async () => {
    if (!window.confirm(`只从 Buildr App 移除“${entry.workspace?.name || entry.rootPath}”，不会删除目录。继续吗？`)) return;
    await window.__buildrRemoveWorkspace(entry, revision);
  });
  return article;
}

export async function renderWorkspaces({ root, api, navigate, openAgentAction }) {
  root.innerHTML = `
    <section class="resource-toolbar">
      <div><p class="eyebrow">本机目录</p><h1>工作空间</h1><p class="page-copy">在一个本机入口中管理已登记的 Buildr 工作空间。</p></div>
      <div class="toolbar-actions"><button id="add-workspace" class="button primary" type="button">添加已有工作空间</button></div>
    </section>
    <div id="workspace-global-message" class="alert hidden" role="status"></div>
    <section id="workspace-grid" class="workspace-grid" aria-label="已登记工作空间"></section>
    <section id="workspace-empty" class="empty-state hidden"><h2>欢迎使用 Buildr</h2><p>选择已有 Buildr 工作空间，或生成交给 Agent 的新建指令。Buildr 不会自动扫描磁盘。</p><div class="actions"><button id="empty-add-workspace" class="button primary" type="button">选择已有工作空间</button><button id="empty-create-workspace" class="button secondary" type="button">交给 Agent 新建</button><button id="empty-later" class="text-button" type="button">稍后处理</button></div></section>`;

  async function load() {
    const registry = await api('/api/v1/workspaces');
    const grid = document.getElementById('workspace-grid');
    grid.replaceChildren();
    document.getElementById('workspace-empty').classList.toggle('hidden', registry.workspaces.length !== 0);
    for (const entry of registry.workspaces) grid.append(workspaceCard(entry, registry.revision));
    window.__buildrRemoveWorkspace = async (entry, revision) => {
      await api('/api/v1/workspaces', { method: 'DELETE', body: JSON.stringify({ revision, rootPath: entry.rootPath }) });
      await load();
    };
    return registry;
  }

  let registry;
  try { registry = await load(); } catch (error) {
    const alert = document.getElementById('workspace-global-message');
    alert.classList.remove('hidden');
    alert.textContent = error.message;
    return;
  }
  document.getElementById('add-workspace').addEventListener('click', async () => {
    const button = document.getElementById('add-workspace');
    button.disabled = true;
    try {
      const result = await api('/api/v1/workspaces/pick', { method: 'POST', body: JSON.stringify({ revision: registry.revision }) });
      if (!result.canceled) {
        registry = result;
        await load();
        if (result.lastOpenedWorkspaceId) navigate(`/workspaces/${result.lastOpenedWorkspaceId}/`);
      }
    } catch (error) {
      const alert = document.getElementById('workspace-global-message');
      alert.classList.remove('hidden');
      alert.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });
  document.getElementById('empty-add-workspace').addEventListener('click', () => document.getElementById('add-workspace').click());
  document.getElementById('empty-create-workspace').addEventListener('click', () => openAgentAction('workspace'));
  document.getElementById('empty-later').addEventListener('click', () => {
    const alert = document.getElementById('workspace-global-message');
    alert.classList.remove('hidden');
    alert.textContent = '没有登记任何工作空间。你可以直接退出 Buildr，稍后再次打开。';
  });
}
