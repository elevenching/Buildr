function text(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function errorPage(root, message) {
  root.innerHTML = `<section class="page-header"><p class="eyebrow">服务</p><h1>服务不存在</h1><p class="page-copy"></p></section><a class="button secondary" href="/services" data-route>返回服务目录</a>`;
  root.querySelector('.page-copy').textContent = message;
}

export async function renderServiceDetail({ root, api, onWorkspace, onBreadcrumb, params }) {
  const { projectCode, serviceCode } = params;
  root.innerHTML = `
    <section class="detail-page-header"><a class="back-link" href="/services?project=${encodeURIComponent(projectCode)}" data-route>← 返回服务目录</a><div class="detail-title-row"><div><p class="eyebrow">服务</p><h1 id="service-detail-name">正在读取…</h1><p class="page-copy">只读详情</p></div><a id="service-edit-link" class="button primary" data-route>编辑服务</a></div></section>
    <section class="detail-facts-section" aria-label="服务详情"><dl class="read-facts detail-facts"><div><dt>服务代码</dt><dd id="service-code">—</dd></div><div><dt>服务说明</dt><dd id="service-detail-description">—</dd></div><div><dt>所属项目</dt><dd id="service-detail-project">—</dd></div><div><dt>服务类型</dt><dd id="service-detail-type">—</dd></div><div><dt>来源类型</dt><dd id="service-detail-source">—</dd></div><div><dt>来源路径</dt><dd id="service-path">—</dd></div></dl><details class="technical-details"><summary>技术信息</summary><dl class="read-facts technical-facts"><div><dt>服务 ID</dt><dd id="service-id">—</dd></div><div><dt>项目代码</dt><dd id="service-project-code">—</dd></div><div><dt>Revision</dt><dd id="service-revision">—</dd></div><div><dt>集成分支</dt><dd id="service-integration-branch">—</dd></div><div><dt>当前分支</dt><dd id="service-current-branch">—</dd></div><div><dt>Git 状态</dt><dd id="service-git-state">—</dd></div></dl><div id="service-findings" class="findings"></div></details></section>`;
  try {
    const [workspace, data] = await Promise.all([api('/api/v1/workspace'), api(`/api/v1/projects/${encodeURIComponent(projectCode)}/services/${encodeURIComponent(serviceCode)}`)]);
    onWorkspace(workspace);
    const service = data.service;
    onBreadcrumb(['项目', projectCode, '服务', service.name]);
    text('service-detail-name', service.name); text('service-detail-description', service.description || '尚未填写服务说明。'); text('service-detail-project', projectCode); text('service-detail-type', service.type); text('service-detail-source', service.source.type === 'git' ? 'Git' : '本地路径'); text('service-code', service.code); text('service-path', service.source.path);
    text('service-id', service.id || '迁移后生成'); text('service-project-code', projectCode); text('service-revision', data.revision); text('service-integration-branch', service.source.git?.integrationBranch || '不适用'); text('service-current-branch', data.observed?.currentBranch || (service.source.type === 'git' ? '暂时无法读取' : '不适用')); text('service-git-state', data.observed ? `${data.observed.dirty ? '有未提交变化' : '干净'} · ahead ${data.observed.ahead ?? '—'} / behind ${data.observed.behind ?? '—'}` : '不适用');
    const findings = document.getElementById('service-findings'); for (const finding of data.comparison?.findings || []) { const item = document.createElement('div'); item.className = `finding ${finding.status || ''}`; item.textContent = finding.message; findings.append(item); }
    document.getElementById('service-edit-link').href = `/services/${encodeURIComponent(projectCode)}/${encodeURIComponent(serviceCode)}/edit`;
  } catch (error) { errorPage(root, error.message); }
}
