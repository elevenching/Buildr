function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function detailLink(projectCode, service) {
  const link = document.createElement('a');
  link.className = 'table-action';
  link.dataset.route = '';
  link.href = `/services/${encodeURIComponent(projectCode)}/${encodeURIComponent(service.code)}`;
  link.textContent = '详情';
  return link;
}

function editLink(projectCode, service) {
  const link = document.createElement('a');
  link.className = 'table-action';
  link.dataset.route = '';
  link.href = `/services/${encodeURIComponent(projectCode)}/${encodeURIComponent(service.code)}/edit`;
  link.textContent = '编辑';
  return link;
}

function projectLink(projectCode) {
  const link = document.createElement('a');
  link.className = 'table-action';
  link.dataset.route = '';
  link.href = `/projects/${encodeURIComponent(projectCode)}`;
  link.textContent = '项目';
  return link;
}

function serviceTypeLabel(type) {
  return ({ backend: '后端', frontend: '前端', application: '应用', library: '库', tool: '工具' })[type] || type;
}

export async function renderServices({ root, api, onWorkspace, openAgentAction }) {
  root.innerHTML = `
    <section class="resource-toolbar">
      <div><p class="eyebrow">服务</p><h1>服务目录</h1><p class="page-copy">按项目查看已登记服务；详情与编辑使用独立页面。</p></div>
      <div class="toolbar-actions"><span id="services-count" class="count-label">正在读取</span><button id="create-service-button" class="button primary" type="button" disabled>让 Agent 创建服务</button></div>
    </section>
    <div id="services-migration-alert" class="alert hidden" role="status"></div>
    <section class="list-controls"><label>所属项目<select id="service-project-select" disabled><option>正在读取项目…</option></select></label></section>
    <section class="resource-list-section">
      <div class="section-heading"><div><h2 id="services-title">请选择项目</h2><p id="services-copy" class="section-copy">选择项目后显示服务。</p></div></div>
      <div id="service-empty" class="empty-state">选择项目后显示服务。</div>
      <div id="service-table-wrap" class="management-table-wrap hidden"><table class="management-table"><thead><tr><th scope="col">名称</th><th scope="col">代码</th><th scope="col">类型</th><th scope="col">来源</th><th scope="col" class="operation-column">操作</th></tr></thead><tbody id="service-table-body"></tbody></table></div>
    </section>`;

  let currentProject = null;
  async function loadServices(projectCode) {
    currentProject = projectCode;
    document.getElementById('create-service-button').disabled = false;
    try {
      const data = await api(`/api/v1/projects/${encodeURIComponent(projectCode)}/services`);
      const body = document.getElementById('service-table-body'); body.replaceChildren();
      text('services-title', `${data.project.name}的服务`); text('services-copy', '目录负责资源定位与关联跳转；稳定元数据使用独立编辑页修改。'); text('services-count', `${data.services.length} 个服务`);
      const empty = document.getElementById('service-empty'); empty.classList.toggle('hidden', data.services.length > 0); empty.textContent = `项目“${data.project.name}”暂未登记服务。服务只在需要管理代码仓、应用、模块或可执行资产时添加；你也可以直接回到“开始”页推进项目范围工作。`;
      document.getElementById('service-table-wrap').classList.toggle('hidden', data.services.length === 0);
      const alert = document.getElementById('services-migration-alert'); alert.classList.toggle('hidden', !data.migrationRequired); alert.textContent = data.migrationRequired ? data.nextActions.join(' ') : '';
      for (const service of data.services) {
        const row = document.createElement('tr');
        const name = document.createElement('td'); const title = document.createElement('strong'); title.textContent = service.name; const description = document.createElement('small'); description.textContent = service.description; name.append(title, description);
        const code = document.createElement('td'); code.className = 'code-cell'; code.textContent = service.code;
        const type = document.createElement('td'); type.textContent = serviceTypeLabel(service.type);
        const source = document.createElement('td'); source.textContent = service.source.type === 'git' ? 'Git' : '本地路径';
        const operations = document.createElement('td'); operations.className = 'table-operations'; operations.append(detailLink(projectCode, service), editLink(projectCode, service), projectLink(projectCode));
        row.append(name, code, type, source, operations); body.append(row);
      }
    } catch (error) {
      text('services-count', '读取失败'); text('services-title', '无法读取服务'); text('services-copy', error.message);
      document.getElementById('service-empty').classList.remove('hidden'); document.getElementById('service-table-wrap').classList.add('hidden');
    }
  }
  document.getElementById('create-service-button').addEventListener('click', () => openAgentAction('service', { projectCode: currentProject || '' }));
  const select = document.getElementById('service-project-select');
  select.addEventListener('change', () => {
    const url = new URL(window.location.href); url.searchParams.set('project', select.value); history.replaceState({}, '', `${url.pathname}${url.search}`); loadServices(select.value);
  });
  try {
    const [workspace, data] = await Promise.all([api('/api/v1/workspace'), api('/api/v1/projects')]);
    onWorkspace(workspace); select.replaceChildren();
    for (const project of data.projects) { const option = document.createElement('option'); option.value = project.code; option.textContent = `${project.name}（${project.code}）`; select.append(option); }
    select.disabled = data.projects.length === 0;
    const requested = new URLSearchParams(window.location.search).get('project');
    const selected = data.projects.find((project) => project.code === requested) || data.projects[0];
    if (selected) { select.value = selected.code; await loadServices(selected.code); }
    else { text('services-title', '尚无所属项目'); text('services-count', '0 个项目'); text('services-copy', '请先让 Agent 创建项目，再登记服务。'); document.getElementById('service-empty').textContent = '请先让 Agent 创建项目，再登记服务。'; }
  } catch (error) { text('services-title', '读取失败'); text('services-copy', error.message); }
}
