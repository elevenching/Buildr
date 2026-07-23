function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function errorPage(root, title, message) {
  root.innerHTML = `<section class="page-header"><p class="eyebrow">工作空间（Workspace）</p><h1>${title}</h1></section><div class="alert error" role="alert"></div>`;
  root.querySelector('.alert').textContent = message;
}

export async function renderWorkspaceOverview({ root, api, onWorkspace }) {
  root.innerHTML = `
    <section class="page-header page-header-row">
      <div><p class="eyebrow">工作空间概览</p><h1 id="overview-title">正在读取…</h1><p id="overview-description" class="page-copy">从本地真实源资产生成当前摘要。</p></div>
      <a class="button secondary" href="/settings" data-route>编辑工作空间</a>
    </section>
    <div id="overview-migration" class="alert hidden" role="status"></div>
    <section class="metric-grid" aria-label="工作空间资源摘要">
      <article class="metric-card"><span>项目（Project）</span><strong id="project-count">—</strong><small>登记在当前工作空间</small></article>
      <article class="metric-card"><span>服务（Service）</span><strong id="service-count">—</strong><small id="service-count-note">按项目汇总</small></article>
      <article class="metric-card identity-card"><span>工作空间 ID（Workspace ID）</span><strong id="overview-id">—</strong><small id="overview-schema">—</small></article>
    </section>
    <section class="content-grid">
      <article class="panel">
        <div class="panel-heading"><div><p class="eyebrow">管理</p><h2>从这里开始</h2></div></div>
        <div class="action-list">
          <a href="/projects" data-route><span class="action-symbol">◇</span><span><strong>管理项目</strong><small>查看项目目录、详情与来源信息。</small></span><span>→</span></a>
          <a href="/services" data-route><span class="action-symbol">◫</span><span><strong>管理服务</strong><small>按所属项目查看和管理服务。</small></span><span>→</span></a>
          <a href="/settings" data-route><span class="action-symbol">⚙</span><span><strong>工作空间设置</strong><small>修改名称与说明，查看 ID、路径、Schema 和 Revision。</small></span><span>→</span></a>
        </div>
      </article>
      <aside class="panel facts-panel">
        <p class="eyebrow">当前上下文</p><h2>本地服务范围</h2>
        <dl class="fact-list">
          <div><dt>本地目录</dt><dd id="overview-root">—</dd></div>
          <div><dt>Revision</dt><dd id="overview-revision">—</dd></div>
        </dl>
        <p class="context-help">当前页面只读取这个工作空间；可随时返回工作空间列表切换。</p>
      </aside>
    </section>`;
  try {
    const [workspaceData, projectsData] = await Promise.all([api('/api/v1/workspace'), api('/api/v1/projects')]);
    onWorkspace(workspaceData);
    setText('overview-title', workspaceData.workspace.name);
    setText('overview-description', workspaceData.workspace.description || '尚未填写工作空间说明。');
    setText('project-count', String(projectsData.projects.length));
    setText('overview-id', workspaceData.workspace.id || '迁移后生成');
    setText('overview-schema', workspaceData.schemaVersion);
    setText('overview-root', workspaceData.rootPath);
    setText('overview-revision', workspaceData.revision);

    const serviceResults = await Promise.allSettled(projectsData.projects.map((project) => api(`/api/v1/projects/${encodeURIComponent(project.code)}/services`)));
    const available = serviceResults.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    const serviceCount = available.reduce((total, result) => total + result.services.length, 0);
    const complete = available.length === projectsData.projects.length;
    setText('service-count', complete ? String(serviceCount) : `${serviceCount}+`);
    setText('service-count-note', complete ? '按项目汇总' : '部分项目暂时不可用');

    const migrationActions = [
      ...(workspaceData.migrationRequired ? workspaceData.nextActions : []),
      ...(projectsData.migrationRequired ? projectsData.nextActions : []),
      ...available.flatMap((result) => result.migrationRequired ? result.nextActions : []),
    ];
    const alert = document.getElementById('overview-migration');
    alert.classList.toggle('hidden', migrationActions.length === 0);
    alert.textContent = [...new Set(migrationActions)].join(' ');
  } catch (error) {
    errorPage(root, '无法读取工作空间', error.message);
  }
}

export async function renderWorkspaceSettings({ root, api, onWorkspace }) {
  root.innerHTML = `
    <section class="page-header"><p class="eyebrow">工作空间（Workspace）</p><h1>工作空间设置</h1><p class="page-copy">只修改稳定元数据；身份、目录和 Schema 始终保持只读。</p></section>
    <div id="settings-migration" class="alert hidden" role="status"></div>
    <section class="content-grid settings-grid">
      <article class="panel">
        <div class="panel-heading"><div><p class="eyebrow">基本信息</p><h2>名称与说明</h2></div><span id="workspace-save-state" class="state">正在读取</span></div>
        <form id="workspace-form">
          <label>名称<input id="workspace-name" name="name" autocomplete="off" required></label>
          <label>说明<textarea id="workspace-description-input" name="description" rows="7" required></textarea></label>
          <div class="actions"><button id="workspace-save-button" class="button primary" type="submit">保存修改</button></div>
        </form>
      </article>
      <aside class="panel facts-panel">
        <p class="eyebrow">技术事实</p><h2>只读事实</h2>
        <dl class="fact-list">
          <div><dt>工作空间 ID（Workspace ID）</dt><dd id="workspace-id">—</dd></div>
          <div><dt>本地目录</dt><dd id="workspace-root">—</dd></div>
          <div><dt>Schema</dt><dd id="workspace-schema">—</dd></div>
          <div><dt>Revision</dt><dd id="workspace-revision">—</dd></div>
        </dl>
      </aside>
    </section>`;

  let currentWorkspace;
  function render(data) {
    currentWorkspace = data;
    onWorkspace(data);
    setText('workspace-id', data.workspace.id || '迁移后生成');
    setText('workspace-root', data.rootPath);
    setText('workspace-schema', data.schemaVersion);
    setText('workspace-revision', data.revision);
    document.getElementById('workspace-name').value = data.workspace.name;
    document.getElementById('workspace-description-input').value = data.workspace.description;
    const readOnly = data.migrationRequired;
    for (const id of ['workspace-name', 'workspace-description-input', 'workspace-save-button']) document.getElementById(id).disabled = readOnly;
    setText('workspace-save-state', readOnly ? '迁移前只读' : '已读取真实文件');
    const alert = document.getElementById('settings-migration');
    alert.classList.toggle('hidden', !readOnly);
    alert.textContent = readOnly ? data.nextActions.join(' ') : '';
  }

  try {
    render(await api('/api/v1/workspace'));
  } catch (error) {
    setText('workspace-save-state', error.message);
    document.getElementById('workspace-save-button').disabled = true;
    return;
  }

  document.getElementById('workspace-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const state = document.getElementById('workspace-save-state');
    const button = document.getElementById('workspace-save-button');
    button.disabled = true;
    state.textContent = '正在保存…';
    try {
      const updated = await api('/api/v1/workspace', {
        method: 'PUT',
        body: JSON.stringify({
          revision: currentWorkspace.revision,
          name: document.getElementById('workspace-name').value,
          description: document.getElementById('workspace-description-input').value,
        }),
      });
      render(updated);
      state.textContent = '保存成功';
    } catch (error) {
      state.textContent = error.code === 'workspace_revision_conflict' ? '文件已变化，请刷新后重新判断' : error.message;
      button.disabled = false;
    }
  });
}
