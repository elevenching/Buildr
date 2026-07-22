function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function errorPage(root, message) {
  root.innerHTML = `<section class="page-header"><p class="eyebrow">项目（Project）</p><h1>项目不存在</h1><p class="page-copy"></p></section><a class="button secondary" href="/projects" data-route>返回项目目录</a>`;
  root.querySelector('.page-copy').textContent = message;
}

function renderFindings(findings) {
  const container = document.getElementById('project-findings');
  container.replaceChildren();
  for (const finding of findings || []) {
    const item = document.createElement('div');
    item.className = `finding ${finding.status || ''}`;
    item.textContent = finding.message;
    container.append(item);
  }
}

function renderServices(data) {
  text('project-service-count', String(data.services.length));
  const list = document.getElementById('project-service-list');
  const empty = document.getElementById('project-service-empty');
  empty.classList.toggle('hidden', data.services.length > 0);
  empty.textContent = `项目“${data.project.name}”尚未登记服务。`;
  for (const service of data.services) {
    const link = document.createElement('a');
    link.href = `/services?project=${encodeURIComponent(data.project.code)}`;
    link.dataset.route = '';
    const title = document.createElement('strong'); title.textContent = service.name;
    const metadata = document.createElement('span'); metadata.textContent = `${service.code} · ${service.type} · ${service.source.type}`;
    link.append(title, metadata); list.append(link);
  }
}

export async function renderProjectDetail({ root, api, onWorkspace, openAgentAction, params }) {
  const code = params?.projectCode;
  root.innerHTML = `
    <section class="page-header project-detail-header">
      <a class="back-link" href="/projects" data-route>← 返回项目目录</a>
      <div class="page-header-row"><div><p class="eyebrow">项目（Project）</p><h1 id="project-detail-name">正在读取…</h1><p id="project-detail-description" class="page-copy">读取真实项目信息。</p></div><button id="create-project-service" class="button primary" type="button">创建服务</button></div>
    </section>
    <div id="project-migration-alert" class="alert hidden" role="status"></div>
    <section class="metric-grid project-metrics">
      <article class="metric-card identity-card"><span>代码标识（Code）</span><strong id="project-detail-code">—</strong><small>项目稳定的人类与 CLI 标识</small></article>
      <article class="metric-card"><span>所属服务</span><strong id="project-service-count">—</strong><small>来自当前项目 registry</small></article>
      <article class="metric-card"><span>来源类型</span><strong id="project-source-type">—</strong><small id="project-source-path">—</small></article>
    </section>
    <section class="content-grid project-overview-grid">
      <article class="panel">
        <div class="panel-heading"><div><p class="eyebrow">项目概览</p><h2>名称与说明</h2></div><span id="project-save-state" class="state">正在读取</span></div>
        <form id="project-form"><label>名称<input id="project-name" autocomplete="off" required></label><label>说明<textarea id="project-description" rows="5" required></textarea></label><div class="actions"><button id="project-save-button" class="button primary" type="submit">保存项目</button></div></form>
      </article>
      <aside class="panel facts-panel"><p class="eyebrow">技术事实</p><h2>身份与观察</h2><dl class="fact-list"><div><dt>项目 ID（Project ID）</dt><dd id="project-id">—</dd></div><div><dt>工作空间 ID（Workspace ID）</dt><dd id="project-workspace-id">—</dd></div><div><dt>集成分支</dt><dd id="project-integration-branch">不适用</dd></div><div><dt>当前分支</dt><dd id="project-current-branch">不适用</dd></div><div><dt>Git 状态</dt><dd id="project-git-state">不适用</dd></div></dl><div id="project-findings" class="findings"></div></aside>
    </section>
    <section class="panel project-services-panel">
      <div class="panel-heading"><div><p class="eyebrow">所属服务</p><h2>服务</h2></div><a class="button secondary" id="manage-project-services" href="/services" data-route>管理服务</a></div>
      <div id="project-service-list" class="project-service-list"></div><div id="project-service-empty" class="empty-state">正在读取服务…</div>
    </section>
    <section class="panel project-assets-panel"><div class="panel-heading"><div><p class="eyebrow">项目资产</p><h2>后续管理能力</h2></div><span class="state muted-state">后续阶段</span></div><div class="asset-preview-grid"><article><strong>OpenSpec</strong><p>项目需求与决策契约。</p><small>后续阶段</small></article><article><strong>规则</strong><p>项目范围的约束与边界。</p><small>后续阶段</small></article><article><strong>验证</strong><p>项目测试能力与门禁。</p><small>后续阶段</small></article><article><strong>命令</strong><p>项目声明的命令要求。</p><small>后续阶段</small></article></div></section>`;

  let currentProject;
  document.getElementById('create-project-service').addEventListener('click', () => openAgentAction('service', { projectCode: code }));
  try {
    const [workspace, projectData, servicesData] = await Promise.all([api('/api/v1/workspace'), api(`/api/v1/projects/${encodeURIComponent(code)}`), api(`/api/v1/projects/${encodeURIComponent(code)}/services`)]);
    currentProject = projectData; onWorkspace(workspace);
    const project = projectData.project;
    text('project-detail-name', project.name); text('project-detail-description', project.description); text('project-detail-code', project.code); text('project-source-type', project.source.type); text('project-source-path', project.source.path);
    document.getElementById('project-name').value = project.name; document.getElementById('project-description').value = project.description;
    text('project-id', project.id || '迁移后生成'); text('project-workspace-id', project.workspaceId || '迁移后写入'); text('project-integration-branch', project.source.git?.integrationBranch || '不适用');
    text('project-current-branch', projectData.observed?.currentBranch || (project.source.type === 'git' ? '无法读取' : '不适用'));
    text('project-git-state', projectData.observed ? `HEAD ${projectData.observed.head?.slice(0, 10) || '—'} · ${projectData.observed.dirty ? '有未提交变化' : 'clean'} · ahead ${projectData.observed.ahead ?? '—'} / behind ${projectData.observed.behind ?? '—'}` : '不适用');
    const readOnly = projectData.migrationRequired; for (const id of ['project-name', 'project-description', 'project-save-button']) document.getElementById(id).disabled = readOnly;
    text('project-save-state', readOnly ? '迁移前只读' : '已读取真实 registry');
    const alert = document.getElementById('project-migration-alert'); alert.classList.toggle('hidden', !readOnly); alert.textContent = readOnly ? projectData.nextActions.join(' ') : '';
    const servicesHref = `/services?project=${encodeURIComponent(code)}`; document.getElementById('manage-project-services').href = servicesHref;
    renderFindings(projectData.comparison?.findings); renderServices(servicesData);
  } catch (error) { errorPage(root, error.message); return; }

  document.getElementById('project-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = document.getElementById('project-save-button'); button.disabled = true; text('project-save-state', '正在保存…');
    try {
      const updated = await api(`/api/v1/projects/${encodeURIComponent(code)}`, { method: 'PUT', body: JSON.stringify({ revision: currentProject.revision, name: document.getElementById('project-name').value, description: document.getElementById('project-description').value }) });
      currentProject = updated; text('project-detail-name', updated.project.name); text('project-detail-description', updated.project.description); text('project-save-state', '保存成功'); button.disabled = false;
    } catch (error) { text('project-save-state', error.code === 'project_revision_conflict' ? 'registry 已变化，请刷新' : error.message); button.disabled = false; }
  });
}
