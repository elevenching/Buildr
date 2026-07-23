function workspaceCard(entry, revision) {
  const article = document.createElement('article');
  article.className = 'panel workspace-card';
  const ready = entry.status === 'ready';
  article.innerHTML = `
    <div class="panel-heading">
      <div><p class="eyebrow">${entry.status.replaceAll('_', ' ')}</p><h2></h2></div>
      <span class="state ${ready ? 'success' : 'warning'}"></span>
    </div>
    <p class="page-copy workspace-description"></p>
    <p class="mono workspace-root"></p>
    <div class="actions">
      <a class="button primary workspace-open" data-route>打开工作空间</a>
      <button class="button secondary workspace-remove" type="button">从 Buildr App 移除</button>
    </div>`;
  article.querySelector('h2').textContent = entry.workspace?.name || '不可用的工作空间';
  article.querySelector('.workspace-description').textContent = entry.workspace?.description || entry.error?.message || '无法读取工作空间信息。';
  article.querySelector('.workspace-root').textContent = entry.rootPath;
  article.querySelector('.state').textContent = ready ? '可用' : entry.status === 'unavailable' ? '路径不可用' : entry.status === 'identity_conflict' ? '身份冲突' : '需要处理';
  const open = article.querySelector('.workspace-open');
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
    <section class="page-header page-header-row">
      <div><p class="eyebrow">BUILDR GLOBAL APP</p><h1>工作空间</h1><p class="page-copy">在一个本机入口中管理已经登记的 Buildr 工作空间。</p></div>
      <button id="add-workspace" class="button primary" type="button">＋ 添加工作空间</button>
    </section>
    <div id="workspace-global-message" class="alert hidden" role="status"></div>
    <section id="workspace-grid" class="content-grid"></section>
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
