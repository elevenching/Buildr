function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function errorPage(root, message) {
  root.innerHTML = `<section class="page-header"><p class="eyebrow">项目</p><h1>项目不存在</h1><p class="page-copy"></p></section><a class="button secondary" href="/projects" data-route>返回项目目录</a>`;
  root.querySelector('.page-copy').textContent = message;
}

export async function renderProjectDetail({ root, api, onWorkspace, onBreadcrumb, params }) {
  const code = params?.projectCode;
  root.innerHTML = `
    <section class="detail-page-header"><a class="back-link" href="/projects" data-route>← 返回项目目录</a><div class="detail-title-row"><div><p class="eyebrow">项目</p><h1 id="project-detail-name">正在读取…</h1><p class="page-copy">只读详情</p></div><a id="project-edit-link" class="button primary" data-route>编辑项目</a></div></section>
    <section class="detail-facts-section" aria-label="项目详情"><dl class="read-facts detail-facts"><div><dt>项目代码</dt><dd id="project-detail-code">—</dd></div><div><dt>项目说明</dt><dd id="project-detail-description">—</dd></div><div><dt>来源类型</dt><dd id="project-source-type">—</dd></div><div><dt>来源路径</dt><dd id="project-source-path">—</dd></div><div><dt>服务登记</dt><dd id="project-service-summary">—</dd></div></dl><details class="technical-details"><summary>技术信息</summary><dl class="read-facts technical-facts"><div><dt>项目 ID</dt><dd id="project-id">—</dd></div><div><dt>工作空间 ID</dt><dd id="project-workspace-id">—</dd></div><div><dt>Revision</dt><dd id="project-revision">—</dd></div><div><dt>集成分支</dt><dd id="project-integration-branch">—</dd></div><div><dt>当前分支</dt><dd id="project-current-branch">—</dd></div><div><dt>Git 状态</dt><dd id="project-git-state">—</dd></div></dl><div id="project-findings" class="findings"></div></details></section>`;
  try {
    const [workspace, projectData, servicesData] = await Promise.all([api('/api/v1/workspace'), api(`/api/v1/projects/${encodeURIComponent(code)}`), api(`/api/v1/projects/${encodeURIComponent(code)}/services`)]);
    onWorkspace(workspace);
    const project = projectData.project;
    onBreadcrumb(['项目', project.name]);
    text('project-detail-name', project.name); text('project-detail-description', project.description || '尚未填写项目说明。'); text('project-detail-code', project.code); text('project-source-type', project.source.type === 'git' ? 'Git' : '本地路径'); text('project-source-path', project.source.path);
    text('project-service-summary', `${servicesData.services.length} 个已登记服务`);
    text('project-id', project.id || '迁移后生成'); text('project-workspace-id', project.workspaceId || '迁移后写入'); text('project-revision', projectData.revision); text('project-integration-branch', project.source.git?.integrationBranch || '不适用'); text('project-current-branch', projectData.observed?.currentBranch || (project.source.type === 'git' ? '暂时无法读取' : '不适用')); text('project-git-state', projectData.observed ? `${projectData.observed.dirty ? '有未提交变化' : '干净'} · ahead ${projectData.observed.ahead ?? '—'} / behind ${projectData.observed.behind ?? '—'}` : '不适用');
    const findings = document.getElementById('project-findings'); for (const finding of projectData.comparison?.findings || []) { const item = document.createElement('div'); item.className = `finding ${finding.status || ''}`; item.textContent = finding.message; findings.append(item); }
    document.getElementById('project-edit-link').href = `/projects/${encodeURIComponent(code)}/edit`;
  } catch (error) { errorPage(root, error.message); }
}
