import { api } from '/api-client.js';
import { setupAgentActions } from '/features/agent-actions.js';
import { renderProjectDetail } from '/features/project-detail.js';
import { renderProjects } from '/features/projects.js';
import { renderServices } from '/features/services.js';
import { renderWorkspaceOverview, renderWorkspaceSettings } from '/features/workspace.js';
import { createRouter } from '/router.js';

const view = document.getElementById('app-view');
const routeDefinitions = {
  '/': { id: 'overview', label: '概览', render: renderWorkspaceOverview },
  '/settings/workspace': { id: 'settings', label: '工作空间设置', render: renderWorkspaceSettings },
  '/projects': { id: 'projects', label: '项目', render: renderProjects },
  '/projects/:projectCode': {
    id: 'projects',
    label: '项目详情',
    match(pathname) {
      const match = pathname.match(/^\/projects\/([A-Za-z0-9][A-Za-z0-9._-]*)$/);
      return match ? { projectCode: decodeURIComponent(match[1]) } : null;
    },
    render: renderProjectDetail,
  },
  '/services': { id: 'services', label: '服务', render: renderServices },
};

function updateWorkspaceContext(data) {
  document.getElementById('shell-workspace-name').textContent = data.workspace.name;
  document.getElementById('shell-workspace-path').textContent = data.rootPath;
  document.title = `${data.workspace.name} · Buildr`;
}

function updateRouteState(route) {
  document.getElementById('page-breadcrumb').textContent = route.label;
  for (const item of document.querySelectorAll('[data-nav]')) {
    const active = item.dataset.nav === route.id;
    item.classList.toggle('active', active);
    if (active) item.setAttribute('aria-current', 'page');
    else item.removeAttribute('aria-current');
  }
  const resourceGroup = document.querySelector('[data-nav-group="resources"]');
  resourceGroup.classList.toggle('active', route.id === 'projects' || route.id === 'services');
  if ((route.id === 'projects' || route.id === 'services') && window.matchMedia('(max-width: 700px)').matches) setResourceNavigation(false);
}

function setResourceNavigation(expanded) {
  const toggle = document.getElementById('resource-nav-toggle');
  const children = document.getElementById('resource-nav-children');
  toggle.setAttribute('aria-expanded', String(expanded));
  children.classList.toggle('collapsed', !expanded);
  toggle.querySelector('.nav-chevron').textContent = expanded ? '⌄' : '›';
}

const router = createRouter({
  routes: routeDefinitions,
  async onRoute(route) {
    updateRouteState(route);
    view.innerHTML = '<div class="page-loading"><span class="loader"></span><p>正在读取真实信息…</p></div>';
    await route.render({ root: view, api, onWorkspace: updateWorkspaceContext, navigate: router.navigate, openAgentAction: agentActions.open, params: route.params });
    view.focus({ preventScroll: true });
  },
});

const agentActions = setupAgentActions({ api });
document.getElementById('resource-nav-toggle').addEventListener('click', () => {
  const expanded = document.getElementById('resource-nav-toggle').getAttribute('aria-expanded') === 'true';
  setResourceNavigation(!expanded);
});
setResourceNavigation(window.matchMedia('(min-width: 701px)').matches);
router.start();
