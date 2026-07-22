function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
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

export async function renderProjects({ root, api, onWorkspace, openAgentAction }) {
  root.innerHTML = `
    <section class="page-header page-header-row">
      <div><p class="eyebrow">项目（Project）</p><h1>项目</h1><p class="page-copy">管理当前工作空间登记的业务、产品线、系统或长期工作单元。</p></div>
      <button id="create-project-button" class="button primary" type="button">创建项目</button>
    </section>
    <div id="projects-migration-alert" class="alert hidden" role="status"></div>
    <section class="panel">
      <div class="panel-heading"><div><p class="eyebrow">项目目录</p><h2>全部项目</h2></div><span id="projects-state" class="state">正在读取</span></div>
      <div class="resource-layout">
        <div><div id="project-list" class="resource-list" aria-label="项目列表"></div><div id="project-empty" class="empty-state hidden">当前工作空间尚未登记项目。</div></div>
        <section id="project-detail" class="resource-detail hidden" aria-live="polite">
          <div class="detail-heading"><div><p class="eyebrow">项目详情</p><h3 id="project-title">—</h3></div><span id="project-save-state" class="state">只读事实</span></div>
          <form id="project-form"><label>名称<input id="project-name" autocomplete="off" required></label><label>说明<textarea id="project-description" rows="4" required></textarea></label><div class="actions"><button id="project-save-button" class="button primary" type="submit">保存项目</button></div></form>
          <dl class="resource-facts"><div><dt>项目 ID（Project ID）</dt><dd id="project-id">—</dd></div><div><dt>工作空间 ID（Workspace ID）</dt><dd id="project-workspace-id">—</dd></div><div><dt>代码标识（Code）</dt><dd id="project-code">—</dd></div><div><dt>来源（Source）</dt><dd id="project-source">—</dd></div><div><dt>路径（Path）</dt><dd id="project-path">—</dd></div><div><dt>集成分支（Integration branch）</dt><dd id="project-integration-branch">不适用</dd></div><div><dt>当前分支（Current branch）</dt><dd id="project-current-branch">不适用</dd></div><div><dt>Git 状态</dt><dd id="project-git-state">不适用</dd></div></dl>
          <div id="project-findings" class="findings"></div>
        </section>
      </div>
    </section>`;

  let currentProject = null;
  function renderDetail(data) {
    currentProject = data;
    const project = data.project;
    document.getElementById('project-detail').classList.remove('hidden');
    text('project-title', project.name);
    document.getElementById('project-name').value = project.name;
    document.getElementById('project-description').value = project.description;
    text('project-id', project.id || '迁移后生成'); text('project-workspace-id', project.workspaceId || '迁移后写入'); text('project-code', project.code);
    text('project-source', project.source.type === 'git' ? `${project.source.type} · ${project.source.git.url}` : project.source.type);
    text('project-path', project.source.path); text('project-integration-branch', project.source.git?.integrationBranch || '不适用');
    text('project-current-branch', data.observed?.currentBranch || (project.source.type === 'git' ? '无法读取' : '不适用'));
    text('project-git-state', data.observed ? `HEAD ${data.observed.head?.slice(0, 10) || '—'} · ${data.observed.dirty ? '有未提交变化' : 'clean'} · ahead ${data.observed.ahead ?? '—'} / behind ${data.observed.behind ?? '—'}` : '不适用');
    for (const id of ['project-name', 'project-description', 'project-save-button']) document.getElementById(id).disabled = data.migrationRequired;
    text('project-save-state', data.migrationRequired ? '迁移前只读' : '已读取真实 registry');
    for (const button of document.querySelectorAll('#project-list button')) button.classList.toggle('active', button.dataset.code === project.code);
    renderFindings(data.comparison?.findings);
  }

  async function loadProject(code) {
    try { renderDetail(await api(`/api/v1/projects/${encodeURIComponent(code)}`)); }
    catch (error) { text('projects-state', error.message); }
  }

  document.getElementById('create-project-button').addEventListener('click', () => openAgentAction('project'));
  try {
    const [workspace, data] = await Promise.all([api('/api/v1/workspace'), api('/api/v1/projects')]);
    onWorkspace(workspace);
    const list = document.getElementById('project-list');
    text('projects-state', `${data.projects.length} 个项目`);
    document.getElementById('project-empty').classList.toggle('hidden', data.projects.length > 0);
    const alert = document.getElementById('projects-migration-alert');
    alert.classList.toggle('hidden', !data.migrationRequired); alert.textContent = data.migrationRequired ? data.nextActions.join(' ') : '';
    for (const project of data.projects) {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.code = project.code;
      const title = document.createElement('strong'); title.textContent = project.name;
      const metadata = document.createElement('span'); metadata.textContent = `${project.code} · ${project.source.type}`;
      button.append(title, metadata); button.addEventListener('click', () => loadProject(project.code)); list.append(button);
    }
    if (data.projects[0]) await loadProject(data.projects[0].code);
  } catch (error) { text('projects-state', '读取失败'); text('project-empty', error.message); document.getElementById('project-empty').classList.remove('hidden'); }

  document.getElementById('project-form').addEventListener('submit', async (event) => {
    event.preventDefault(); if (!currentProject) return;
    const button = document.getElementById('project-save-button'); button.disabled = true; text('project-save-state', '正在保存…');
    try {
      const updated = await api(`/api/v1/projects/${encodeURIComponent(currentProject.project.code)}`, { method: 'PUT', body: JSON.stringify({ revision: currentProject.revision, name: document.getElementById('project-name').value, description: document.getElementById('project-description').value }) });
      renderDetail(updated); text('project-save-state', '保存成功');
    } catch (error) { text('project-save-state', error.code === 'project_revision_conflict' ? 'registry 已变化，请刷新' : error.message); button.disabled = false; }
  });
}
