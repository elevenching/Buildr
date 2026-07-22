function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function renderFindings(findings) {
  const container = document.getElementById('service-findings');
  container.replaceChildren();
  for (const finding of findings || []) {
    const item = document.createElement('div');
    item.className = `finding ${finding.status || ''}`;
    item.textContent = finding.message;
    container.append(item);
  }
}

export async function renderServices({ root, api, onWorkspace, openAgentAction }) {
  root.innerHTML = `
    <section class="page-header page-header-row">
      <div><p class="eyebrow">服务（Service）</p><h1>服务</h1><p class="page-copy">服务属于项目。先选择所属项目，再查看该项目登记的代码仓、应用、模块或可执行资产。</p></div>
      <button id="create-service-button" class="button primary" type="button" disabled>创建服务</button>
    </section>
    <section class="panel service-project-context">
      <label>所属项目<select id="service-project-select" disabled><option>正在读取项目…</option></select></label>
    </section>
    <div id="services-migration-alert" class="alert hidden" role="status"></div>
    <section class="panel services-panel">
      <div class="panel-heading"><div><p class="eyebrow">服务目录</p><h2 id="services-title">请选择项目</h2></div><span id="services-state" class="state">正在读取</span></div>
      <div id="service-empty" class="empty-state">选择项目后显示服务。</div>
      <div id="service-content" class="resource-layout hidden">
        <div id="service-list" class="resource-list" aria-label="服务列表"></div>
        <section id="service-detail" class="resource-detail hidden" aria-live="polite">
          <div class="detail-heading"><div><p class="eyebrow">服务详情</p><h3 id="service-title">—</h3></div><span id="service-save-state" class="state">只读事实</span></div>
          <form id="service-form"><label>名称<input id="service-name" autocomplete="off" required></label><label>类型<input id="service-type" autocomplete="off" required></label><label>说明<textarea id="service-description" rows="4" required></textarea></label><div class="actions"><button id="service-save-button" class="button primary" type="submit">保存服务</button></div></form>
          <dl class="resource-facts"><div><dt>服务 ID（Service ID）</dt><dd id="service-id">—</dd></div><div><dt>工作空间 ID（Workspace ID）</dt><dd id="service-workspace-id">—</dd></div><div><dt>项目 ID（Project ID）</dt><dd id="service-project-id">—</dd></div><div><dt>代码标识（Code）</dt><dd id="service-code">—</dd></div><div><dt>来源（Source）</dt><dd id="service-source">—</dd></div><div><dt>路径（Path）</dt><dd id="service-path">—</dd></div><div><dt>集成分支（Integration branch）</dt><dd id="service-integration-branch">不适用</dd></div><div><dt>当前分支（Current branch）</dt><dd id="service-current-branch">不适用</dd></div><div><dt>Git 状态</dt><dd id="service-git-state">不适用</dd></div></dl>
          <div id="service-findings" class="findings"></div>
        </section>
      </div>
    </section>`;

  let currentProject = null;
  let currentService = null;
  function renderDetail(data) {
    currentService = data;
    const service = data.service;
    document.getElementById('service-detail').classList.remove('hidden');
    text('service-title', service.name); document.getElementById('service-name').value = service.name; document.getElementById('service-description').value = service.description; document.getElementById('service-type').value = service.type;
    text('service-id', service.id || '迁移后生成'); text('service-workspace-id', service.workspaceId || '迁移后写入'); text('service-project-id', service.projectId || '迁移后写入'); text('service-code', service.code);
    text('service-source', service.source.type === 'git' ? `${service.source.type} · ${service.source.git.url}` : service.source.type); text('service-path', service.source.path); text('service-integration-branch', service.source.git?.integrationBranch || '不适用');
    text('service-current-branch', data.observed?.currentBranch || (service.source.type === 'git' ? '无法读取' : '不适用'));
    text('service-git-state', data.observed ? `HEAD ${data.observed.head?.slice(0, 10) || '—'} · ${data.observed.dirty ? '有未提交变化' : 'clean'} · ahead ${data.observed.ahead ?? '—'} / behind ${data.observed.behind ?? '—'}` : '不适用');
    for (const id of ['service-name', 'service-description', 'service-type', 'service-save-button']) document.getElementById(id).disabled = data.migrationRequired;
    text('service-save-state', data.migrationRequired ? '迁移前只读' : '已读取真实 registry');
    for (const button of document.querySelectorAll('#service-list button')) button.classList.toggle('active', button.dataset.code === service.code);
    renderFindings(data.comparison?.findings);
  }

  async function loadService(projectCode, serviceCode) {
    try { renderDetail(await api(`/api/v1/projects/${encodeURIComponent(projectCode)}/services/${encodeURIComponent(serviceCode)}`)); }
    catch (error) { text('services-state', error.message); }
  }

  async function loadServices(projectCode, preferredCode) {
    currentProject = projectCode;
    currentService = null;
    document.getElementById('create-service-button').disabled = false;
    document.getElementById('service-detail').classList.add('hidden');
    try {
      const data = await api(`/api/v1/projects/${encodeURIComponent(projectCode)}/services`);
      const list = document.getElementById('service-list'); list.replaceChildren();
      text('services-title', `${data.project.name}的服务`); text('services-state', `${data.services.length} 个服务`);
      const empty = document.getElementById('service-empty'); empty.classList.toggle('hidden', data.services.length > 0); empty.textContent = `项目“${data.project.name}”尚未登记服务。`;
      document.getElementById('service-content').classList.toggle('hidden', data.services.length === 0);
      const alert = document.getElementById('services-migration-alert'); alert.classList.toggle('hidden', !data.migrationRequired); alert.textContent = data.migrationRequired ? data.nextActions.join(' ') : '';
      for (const service of data.services) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.code = service.code;
        const title = document.createElement('strong'); title.textContent = service.name;
        const metadata = document.createElement('span'); metadata.textContent = `${service.code} · ${service.type} · ${service.source.type}`;
        button.append(title, metadata); button.addEventListener('click', () => loadService(projectCode, service.code)); list.append(button);
      }
      const selected = data.services.find((service) => service.code === preferredCode) || data.services[0];
      if (selected) await loadService(projectCode, selected.code);
    } catch (error) { text('services-state', '读取失败'); text('service-empty', error.message); document.getElementById('service-empty').classList.remove('hidden'); document.getElementById('service-content').classList.add('hidden'); }
  }

  document.getElementById('create-service-button').addEventListener('click', () => openAgentAction('service', { projectCode: currentProject || '' }));
  const select = document.getElementById('service-project-select');
  select.addEventListener('change', () => loadServices(select.value));
  try {
    const [workspace, data] = await Promise.all([api('/api/v1/workspace'), api('/api/v1/projects')]);
    onWorkspace(workspace); select.replaceChildren();
    for (const project of data.projects) { const option = document.createElement('option'); option.value = project.code; option.textContent = `${project.name}（${project.code}）`; select.append(option); }
    select.disabled = data.projects.length === 0;
    if (data.projects[0]) await loadServices(data.projects[0].code);
    else { text('services-title', '尚无所属项目'); text('services-state', '0 个项目'); text('service-empty', '请先创建项目，再登记服务。'); }
  } catch (error) { text('services-state', '读取失败'); text('service-empty', error.message); }

  document.getElementById('service-form').addEventListener('submit', async (event) => {
    event.preventDefault(); if (!currentService) return;
    const button = document.getElementById('service-save-button'); button.disabled = true; text('service-save-state', '正在保存…');
    try {
      const updated = await api(`/api/v1/projects/${encodeURIComponent(currentProject)}/services/${encodeURIComponent(currentService.service.code)}`, { method: 'PUT', body: JSON.stringify({ revision: currentService.revision, name: document.getElementById('service-name').value, description: document.getElementById('service-description').value, type: document.getElementById('service-type').value }) });
      renderDetail(updated); await loadServices(currentProject, updated.service.code); text('service-save-state', '保存成功');
    } catch (error) { text('service-save-state', error.code === 'service_revision_conflict' ? 'registry 已变化，请刷新' : error.message); button.disabled = false; }
  });
}
