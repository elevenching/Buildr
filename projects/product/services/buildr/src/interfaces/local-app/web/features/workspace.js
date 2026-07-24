function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function errorPage(root, title, message) {
  root.innerHTML = `<section class="page-header"><p class="eyebrow">工作空间</p><h1>${title}</h1></section><div class="alert error" role="alert"></div>`;
  root.querySelector('.alert').textContent = message;
}

function phaseCopy(data) {
  if (data.phase === 'project-empty') return ['先建立第一个项目', '项目是一个业务、产品、系统或长期工作单元。先告诉 Agent 你要长期管理什么。'];
  if (data.phase === 'project-selection') return ['选择本次工作的项目', '这个工作空间有多个项目。请先选择本次目标所属的工作范围。'];
  if (data.phase === 'service-empty') return ['服务是可选的', '服务用来登记代码仓、应用、模块或可执行资产。若这项工作暂时不需要它，可以直接开始。'];
  if (data.phase === 'degraded') return ['有一项真实状态需要处理', '仍会展示可读取的信息；请让 Agent 先完成明确的迁移或修复。'];
  return ['可以开始第一项工作', '当前范围已经明确。把目标交给 Agent，它会读取适用资产并按项目规则推进。'];
}

export async function renderWorkspaceOverview({ root, api, onWorkspace, openAgentAction, navigate }) {
  root.innerHTML = `<section class="detail-page-header"><div><p class="eyebrow">开始使用 Buildr</p><h1 id="overview-title">正在读取…</h1><p id="overview-description" class="page-copy">Buildr 正在从真实工作空间、项目和服务资产生成下一步。</p></div><a class="button secondary" href="/settings" data-route>工作空间设置</a></section><section class="onboarding-panel"><p class="eyebrow">工作空间 → 项目 → 服务</p><h2 id="start-heading">正在判断下一步…</h2><p id="start-copy" class="page-copy"></p><div id="start-scope" class="scope-summary"></div><div id="start-actions" class="actions"></div><div id="start-diagnostics" class="alert hidden" role="status"></div></section><section class="content-grid secondary-summary"><article class="panel"><p class="eyebrow">当前事实</p><h2>工作范围摘要</h2><dl class="fact-list"><div><dt>已登记项目</dt><dd id="project-count">—</dd></div><div><dt>当前项目的服务</dt><dd id="service-count">—</dd></div></dl></article><aside class="panel facts-panel"><p class="eyebrow">技术信息</p><h2>按需查看</h2><dl class="fact-list"><div><dt>本地目录</dt><dd id="overview-root">—</dd></div><div><dt>数据格式版本</dt><dd id="overview-schema">—</dd></div><div><dt>修订版本</dt><dd id="overview-revision">—</dd></div></dl></aside></section>`;
  let data;
  async function load(projectCode = '') {
    data = await api(`/api/v1/getting-started${projectCode ? `?project=${encodeURIComponent(projectCode)}` : ''}`);
    onWorkspace(data.workspace);
    setText('overview-title', data.workspace.workspace.name);
    setText('overview-description', data.workspace.workspace.description || '这是你和 Agent 共同工作的顶层目录。');
    const [heading, copy] = phaseCopy(data); setText('start-heading', heading); setText('start-copy', copy);
    setText('project-count', String(data.projects.length));
    setText('service-count', data.completeness === 'partial' ? '部分不可用' : String(data.services.length));
    setText('overview-root', data.workspace.rootPath); setText('overview-schema', data.workspace.schemaVersion); setText('overview-revision', data.workspace.revision);
    const scope = document.getElementById('start-scope'); scope.replaceChildren();
    const workspace = document.createElement('span'); workspace.textContent = `工作空间：${data.workspace.workspace.name}`; scope.append(workspace);
    if (data.selectedProject) { const project = document.createElement('span'); project.textContent = `项目：${data.selectedProject.name}`; scope.append(project); }
    if (data.services.length) { const service = document.createElement('span'); service.textContent = `服务：${data.services.length} 个可选资产`; scope.append(service); }
    const actions = document.getElementById('start-actions'); actions.replaceChildren();
    if (data.phase === 'project-selection') {
      const select = document.createElement('select'); select.setAttribute('aria-label', '选择项目');
      select.append(new Option('选择本次工作的项目', ''));
      for (const project of data.projects) select.append(new Option(`${project.name}（${project.code}）`, project.code));
      select.addEventListener('change', () => { if (select.value) load(select.value); }); actions.append(select);
    } else if (data.phase === 'project-empty') {
      const button = document.createElement('button'); button.className = 'button primary'; button.type = 'button'; button.textContent = '让 Agent 创建第一个项目'; button.addEventListener('click', () => openAgentAction('project')); actions.append(button);
    } else if (data.phase === 'degraded') {
      const button = document.createElement('button'); button.className = 'button primary'; button.type = 'button'; button.textContent = '生成修复指令'; button.addEventListener('click', () => openAgentAction('workspace')); actions.append(button);
    } else {
      const start = document.createElement('button'); start.className = 'button primary'; start.type = 'button'; start.textContent = '用 Agent 开始'; start.addEventListener('click', () => openAgentAction('start', { projectCode: data.selectedProject.code })); actions.append(start);
      if (data.phase === 'service-empty') {
        const add = document.createElement('button'); add.className = 'button secondary'; add.type = 'button'; add.textContent = '让 Agent 接入服务'; add.addEventListener('click', () => openAgentAction('service', { projectCode: data.selectedProject.code })); actions.append(add);
      }
    }
    const diagnostics = document.getElementById('start-diagnostics'); diagnostics.classList.toggle('hidden', !data.diagnostics?.length); diagnostics.textContent = (data.diagnostics || []).map((item) => typeof item === 'string' ? item : item.message).join(' ');
  }
  try { await load(); } catch (error) { errorPage(root, '无法读取工作空间', error.message); }
}

export async function renderWorkspaceSettings({ root, api, onWorkspace }) {
  root.innerHTML = `<section class="page-header"><p class="eyebrow">工作空间</p><h1>工作空间设置</h1><p class="page-copy">只修改稳定元数据；身份、目录和数据格式版本始终保持只读。</p></section><div id="settings-migration" class="alert hidden" role="status"></div><section class="content-grid settings-grid"><article class="panel"><div class="panel-heading"><div><p class="eyebrow">基本信息</p><h2>名称与说明</h2></div><span id="workspace-save-state" class="state">正在读取</span></div><form id="workspace-form"><label>名称<input id="workspace-name" name="name" autocomplete="off" required></label><label>说明<textarea id="workspace-description-input" name="description" rows="7" required></textarea></label><div class="actions"><button id="workspace-save-button" class="button primary" type="submit">保存修改</button></div></form></article><aside class="panel facts-panel"><p class="eyebrow">技术事实</p><h2>只读事实</h2><dl class="fact-list"><div><dt>工作空间 ID</dt><dd id="workspace-id">—</dd></div><div><dt>本地目录</dt><dd id="workspace-root">—</dd></div><div><dt>数据格式版本</dt><dd id="workspace-schema">—</dd></div><div><dt>修订版本</dt><dd id="workspace-revision">—</dd></div></dl></aside></section>`;
  let currentWorkspace;
  function render(data) {
    currentWorkspace = data; onWorkspace(data); setText('workspace-id', data.workspace.id || '迁移后生成'); setText('workspace-root', data.rootPath); setText('workspace-schema', data.schemaVersion); setText('workspace-revision', data.revision);
    document.getElementById('workspace-name').value = data.workspace.name; document.getElementById('workspace-description-input').value = data.workspace.description;
    const readOnly = data.migrationRequired; for (const id of ['workspace-name', 'workspace-description-input', 'workspace-save-button']) document.getElementById(id).disabled = readOnly;
    setText('workspace-save-state', readOnly ? '迁移前只读' : '已读取真实文件'); const alert = document.getElementById('settings-migration'); alert.classList.toggle('hidden', !readOnly); alert.textContent = readOnly ? data.nextActions.join(' ') : '';
  }
  try { render(await api('/api/v1/workspace')); } catch (error) { setText('workspace-save-state', error.message); document.getElementById('workspace-save-button').disabled = true; return; }
  document.getElementById('workspace-form').addEventListener('submit', async (event) => { event.preventDefault(); const state = document.getElementById('workspace-save-state'); const button = document.getElementById('workspace-save-button'); button.disabled = true; state.textContent = '正在保存…'; try { render(await api('/api/v1/workspace', { method: 'PUT', body: JSON.stringify({ revision: currentWorkspace.revision, name: document.getElementById('workspace-name').value, description: document.getElementById('workspace-description-input').value }) })); state.textContent = '保存成功'; } catch (error) { state.textContent = error.code === 'workspace_revision_conflict' ? '文件已变化，请刷新后重新判断' : error.message; button.disabled = false; } });
}
