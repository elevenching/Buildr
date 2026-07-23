function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function option(select, value, label) {
  const item = document.createElement('option'); item.value = value; item.textContent = label; select.append(item);
}

function progressText(progress) {
  if (!progress.exists) return '未声明 tasks';
  if (progress.total === 0) return '0 个任务';
  return `${progress.completed} / ${progress.total}`;
}

export async function renderChanges({ root, api, onWorkspace, openAgentAction }) {
  root.innerHTML = `
    <section class="resource-toolbar">
      <div><p class="eyebrow">变更（Change）</p><h1>变更目录</h1><p class="page-copy">查看真实 OpenSpec Change；创建、继续和审查都只生成 Agent 指令。</p></div>
      <div class="toolbar-actions"><span id="changes-state" class="count-label">正在读取</span><button id="create-change-button" class="button primary" type="button">让 Agent 创建变更</button></div>
    </section>
    <section class="list-controls change-filters">
      <label>所属项目<select id="change-project-filter"><option value="">全部项目</option></select></label>
      <label>生命周期<select id="change-lifecycle-filter"><option value="active">进行中</option><option value="archived">已归档</option><option value="">全部</option></select></label>
    </section>
    <section class="resource-list-section changes-panel">
      <div class="section-heading"><div><h2>OpenSpec Change</h2><p class="section-copy">按项目和生命周期筛选。</p></div></div>
      <div id="change-table-wrap" class="management-table-wrap hidden"><table class="management-table change-table"><thead><tr><th>名称</th><th>所属项目</th><th>生命周期</th><th>任务进度</th><th>更新时间</th><th class="operation-column">操作</th></tr></thead><tbody id="change-table-body"></tbody></table></div>
      <div id="change-empty" class="empty-state hidden">当前筛选条件下没有 Change。</div>
    </section>`;

  let data = { projects: [], changes: [] };
  const projectFilter = document.getElementById('change-project-filter');
  const lifecycleFilter = document.getElementById('change-lifecycle-filter');

  function renderRows() {
    const changes = data.changes.filter((change) => (!projectFilter.value || change.project.code === projectFilter.value) && (!lifecycleFilter.value || change.lifecycle === lifecycleFilter.value));
    const body = document.getElementById('change-table-body'); body.replaceChildren();
    text('changes-state', `${changes.length} 个变更`);
    document.getElementById('change-table-wrap').classList.toggle('hidden', changes.length === 0);
    document.getElementById('change-empty').classList.toggle('hidden', changes.length > 0);
    for (const change of changes) {
      const row = document.createElement('tr');
      const name = document.createElement('td'); const title = document.createElement('strong'); title.textContent = change.name; const code = document.createElement('small'); code.textContent = change.code; name.append(title, code);
      const project = document.createElement('td'); project.textContent = change.project.name;
      const lifecycle = document.createElement('td'); const badge = document.createElement('span'); badge.className = `lifecycle-badge ${change.lifecycle}`; badge.textContent = change.lifecycle === 'active' ? '进行中' : '已归档'; lifecycle.append(badge);
      const progress = document.createElement('td'); progress.textContent = progressText(change.progress);
      const updated = document.createElement('td'); updated.textContent = new Date(change.updatedAt).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });
      const operations = document.createElement('td'); operations.className = 'table-operations';
      const detail = document.createElement('a'); detail.className = 'table-action'; detail.dataset.route = ''; detail.href = `/changes/${encodeURIComponent(change.project.code)}/${encodeURIComponent(change.ref)}`; detail.textContent = '详情'; operations.append(detail);
      if (change.lifecycle === 'active') {
        const proceed = document.createElement('button'); proceed.type = 'button'; proceed.className = 'table-action'; proceed.textContent = '继续'; proceed.addEventListener('click', () => openAgentAction('change', { projectCode: change.project.code, ref: change.ref, action: 'continue' })); operations.append(proceed);
      }
      const review = document.createElement('button'); review.type = 'button'; review.className = 'table-action'; review.textContent = '审查'; review.addEventListener('click', () => openAgentAction('change', { projectCode: change.project.code, ref: change.ref, action: 'review' })); operations.append(review);
      row.append(name, project, lifecycle, progress, updated, operations); body.append(row);
    }
  }

  document.getElementById('create-change-button').addEventListener('click', () => openAgentAction('change', { projectCode: projectFilter.value || data.projects[0]?.code || '' }));
  projectFilter.addEventListener('change', renderRows); lifecycleFilter.addEventListener('change', renderRows);
  try {
    const [workspace, changes] = await Promise.all([api('/api/v1/workspace'), api('/api/v1/changes')]); onWorkspace(workspace); data = changes;
    for (const project of data.projects) option(projectFilter, project.code, `${project.name}（${project.code}）`);
    const requestedProject = new URLSearchParams(window.location.search).get('project'); if (data.projects.some(({ code }) => code === requestedProject)) projectFilter.value = requestedProject;
    renderRows();
  } catch (error) { text('changes-state', '读取失败'); text('change-empty', error.message); document.getElementById('change-empty').classList.remove('hidden'); }
}
