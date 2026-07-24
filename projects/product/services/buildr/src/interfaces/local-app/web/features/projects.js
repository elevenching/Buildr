function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function operationLink(label, href) {
  const link = document.createElement('a');
  link.className = 'table-action';
  link.href = href;
  link.dataset.route = '';
  link.textContent = label;
  return link;
}

export async function renderProjects({ root, api, onWorkspace, openAgentAction }) {
  root.innerHTML = `
    <section class="resource-toolbar">
      <div><p class="eyebrow">项目</p><h1>项目目录</h1><p class="page-copy">查看当前工作空间的项目，并从独立详情页编辑稳定元数据。</p></div>
      <div class="toolbar-actions"><span id="projects-state" class="count-label">正在读取</span><button id="create-project-button" class="button primary" type="button">让 Agent 创建项目</button></div>
    </section>
    <div id="projects-migration-alert" class="alert hidden" role="status"></div>
    <section class="resource-list-section">
      <div class="section-heading"><div><h2>全部项目</h2><p class="section-copy">选择详情可查看来源、观察状态、关联服务与变更。</p></div></div>
      <div id="project-table-wrap" class="management-table-wrap hidden">
        <table class="management-table">
          <thead><tr><th scope="col">名称</th><th scope="col">代码</th><th scope="col">来源</th><th scope="col">服务数</th><th scope="col" class="operation-column">操作</th></tr></thead>
          <tbody id="project-table-body"></tbody>
        </table>
      </div>
      <div id="project-empty" class="empty-state hidden">当前 Workspace 还没有 Project。先告诉 Agent 你要长期管理的业务、产品、系统或已有资产。</div>
    </section>`;

  document.getElementById('create-project-button').addEventListener('click', () => openAgentAction('project'));
  try {
    const [workspace, data] = await Promise.all([api('/api/v1/workspace'), api('/api/v1/projects')]);
    onWorkspace(workspace);
    text('projects-state', `${data.projects.length} 个项目`);
    document.getElementById('project-empty').classList.toggle('hidden', data.projects.length > 0);
    document.getElementById('project-table-wrap').classList.toggle('hidden', data.projects.length === 0);
    const alert = document.getElementById('projects-migration-alert');
    alert.classList.toggle('hidden', !data.migrationRequired);
    alert.textContent = data.migrationRequired ? data.nextActions.join(' ') : '';

    const serviceCounts = await Promise.all(data.projects.map(async (project) => {
      try {
        const services = await api(`/api/v1/projects/${encodeURIComponent(project.code)}/services`);
        return [project.code, String(services.services.length)];
      } catch {
        return [project.code, '读取失败'];
      }
    }));
    const countsByProject = new Map(serviceCounts);
    const body = document.getElementById('project-table-body');
    for (const project of data.projects) {
      const row = document.createElement('tr');
      const name = document.createElement('td');
      const title = document.createElement('strong'); title.textContent = project.name;
      const description = document.createElement('small'); description.textContent = project.description;
      name.append(title, description);
      const code = document.createElement('td'); code.className = 'code-cell'; code.textContent = project.code;
      const source = document.createElement('td');
      const sourceType = document.createElement('span'); sourceType.textContent = project.source.type;
      const sourcePath = document.createElement('small'); sourcePath.textContent = project.source.path;
      source.append(sourceType, sourcePath);
      const count = document.createElement('td'); count.textContent = countsByProject.get(project.code) || '0';
      const operations = document.createElement('td'); operations.className = 'table-operations';
      operations.append(
        operationLink('详情', `/projects/${encodeURIComponent(project.code)}`),
        operationLink('编辑', `/projects/${encodeURIComponent(project.code)}/edit`),
        operationLink('服务', `/services?project=${encodeURIComponent(project.code)}`),
        operationLink('变更', `/changes?project=${encodeURIComponent(project.code)}`),
      );
      row.append(name, code, source, count, operations); body.append(row);
    }
  } catch (error) {
    text('projects-state', '读取失败'); text('project-empty', error.message);
    document.getElementById('project-empty').classList.remove('hidden');
    document.getElementById('project-table-wrap').classList.add('hidden');
  }
}
