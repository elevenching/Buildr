const ACTION_LABELS = {
  workspace: '工作空间',
  project: '项目',
  service: '服务',
};

export function setupAgentActions({ api }) {
  const drawer = document.getElementById('agent-action-drawer');
  const backdrop = document.getElementById('agent-action-backdrop');
  const content = document.getElementById('agent-action-content');

  function setOpen(open) {
    drawer.classList.toggle('hidden', !open);
    backdrop.classList.toggle('hidden', !open);
    drawer.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('drawer-open', open);
  }

  function renderChooser() {
    content.innerHTML = `
      <p class="drawer-copy">选择要交给 Agent 处理的对象。Buildr 只生成受约束的完整指令，不会直接创建或切换当前工作空间。</p>
      <div class="action-choice-grid">
        <button class="action-choice" type="button" data-action="workspace"><span class="action-symbol">⌂</span><span><strong>创建工作空间</strong><small>核对目标位置、runtime 与初始化边界</small></span><span>→</span></button>
        <button class="action-choice" type="button" data-action="project"><span class="action-symbol">◇</span><span><strong>创建项目</strong><small>登记业务或长期工作单元</small></span><span>→</span></button>
        <button class="action-choice" type="button" data-action="service"><span class="action-symbol">◫</span><span><strong>创建服务</strong><small>接入代码仓、应用或可执行资产</small></span><span>→</span></button>
      </div>`;
    for (const button of content.querySelectorAll('[data-action]')) button.addEventListener('click', () => open(button.dataset.action));
  }

  function formHeader(noun) {
    return `<div class="form-header"><button class="text-button" type="button" data-back>← 返回</button><span>创建${noun}</span></div><p class="drawer-copy">填写声明后生成 Agent 指令。复制指令不代表${noun}已经创建。</p><div id="agent-action-error" class="alert error hidden" role="alert"></div>`;
  }

  function renderWorkspaceForm() {
    content.innerHTML = `${formHeader('工作空间')}
      <form id="agent-action-form">
        <label>名称<input id="action-name" autocomplete="off" required></label>
        <label>目标位置（可选）<input id="action-target" autocomplete="off" placeholder="不确定时留空，由 Agent 询问"></label>
        <label>说明<textarea id="action-description" rows="5" required></textarea></label>
        <div class="actions"><button class="button primary" type="submit">生成工作空间指令</button></div>
      </form>`;
    bindForm('workspace', async () => api('/api/v1/prompts/workspace-create', { method: 'POST', body: JSON.stringify({ name: value('action-name'), description: value('action-description'), targetPath: value('action-target') }) }));
  }

  function renderProjectForm() {
    content.innerHTML = `${formHeader('项目')}
      <form id="agent-action-form" class="prompt-grid">
        <label>Code<input id="action-code" autocomplete="off" required></label>
        <label>名称<input id="action-name" autocomplete="off" required></label>
        <label>来源<select id="action-source"><option value="workspace">当前工作空间</option><option value="git">Git</option></select></label>
        <label>Git URL<input id="action-git-url" autocomplete="off" disabled></label>
        <label>Remote<input id="action-remote" value="origin" autocomplete="off" disabled></label>
        <label>集成分支（Integration branch）<input id="action-branch" autocomplete="off" disabled></label>
        <label class="full">说明<textarea id="action-description" rows="5" required></textarea></label>
        <div class="actions full"><button class="button primary" type="submit">生成项目指令</button></div>
      </form>`;
    document.getElementById('action-source').addEventListener('change', () => {
      const git = value('action-source') === 'git';
      for (const id of ['action-git-url', 'action-remote', 'action-branch']) document.getElementById(id).disabled = !git;
    });
    bindForm('project', async () => api('/api/v1/prompts/project-create', { method: 'POST', body: JSON.stringify({ code: value('action-code'), name: value('action-name'), description: value('action-description'), sourceType: value('action-source'), gitUrl: value('action-git-url'), remote: value('action-remote'), integrationBranch: value('action-branch') }) }));
  }

  function renderServiceForm(context) {
    content.innerHTML = `${formHeader('服务')}
      <form id="agent-action-form" class="prompt-grid">
        <label>所属项目<input id="action-project" autocomplete="off" required></label>
        <label>Code<input id="action-code" autocomplete="off" required></label>
        <label>名称<input id="action-name" autocomplete="off" required></label>
        <label>类型<input id="action-type" value="service" autocomplete="off" required></label>
        <label>来源<select id="action-source"><option value="local">本地路径</option><option value="git">Git</option></select></label>
        <label>本地路径<input id="action-local-path" autocomplete="off"></label>
        <label>Git URL<input id="action-git-url" autocomplete="off" disabled></label>
        <label>Remote<input id="action-remote" value="origin" autocomplete="off" disabled></label>
        <label>集成分支（Integration branch）<input id="action-branch" autocomplete="off" disabled></label>
        <label class="full">说明<textarea id="action-description" rows="5" required></textarea></label>
        <div class="actions full"><button class="button primary" type="submit">生成服务指令</button></div>
      </form>`;
    document.getElementById('action-project').value = context.projectCode || '';
    document.getElementById('action-source').addEventListener('change', () => {
      const git = value('action-source') === 'git';
      document.getElementById('action-local-path').disabled = git;
      for (const id of ['action-git-url', 'action-remote', 'action-branch']) document.getElementById(id).disabled = !git;
    });
    bindForm('service', async () => api('/api/v1/prompts/service-create', { method: 'POST', body: JSON.stringify({ projectCode: value('action-project'), code: value('action-code'), name: value('action-name'), description: value('action-description'), type: value('action-type'), sourceType: value('action-source'), localPath: value('action-local-path'), gitUrl: value('action-git-url'), remote: value('action-remote'), integrationBranch: value('action-branch') }) }));
  }

  function value(id) {
    return document.getElementById(id)?.value || '';
  }

  function bindForm(action, generate) {
    content.querySelector('[data-back]').addEventListener('click', renderChooser);
    document.getElementById('agent-action-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const errorBox = document.getElementById('agent-action-error');
      errorBox.classList.add('hidden');
      try {
        const result = await generate();
        const noun = ACTION_LABELS[action];
        document.getElementById('agent-action-result')?.remove();
        content.insertAdjacentHTML('beforeend', `<div id="agent-action-result" class="prompt-result"><label>可复制指令<textarea id="action-prompt-output" rows="13" readonly></textarea></label><div class="copy-row"><button id="copy-action-prompt" class="button secondary" type="button">复制指令</button><span id="action-copy-state">${noun}尚未创建。</span></div></div>`);
        document.getElementById('action-prompt-output').value = result.prompt;
        document.getElementById('copy-action-prompt').addEventListener('click', () => copyPrompt(noun));
      } catch (error) {
        errorBox.textContent = error.message;
        errorBox.classList.remove('hidden');
      }
    });
  }

  async function copyPrompt(noun) {
    const output = document.getElementById('action-prompt-output');
    try {
      await navigator.clipboard.writeText(output.value);
      document.getElementById('action-copy-state').textContent = `指令已复制。${noun}尚未创建。`;
    } catch {
      output.select();
      document.getElementById('action-copy-state').textContent = `已选中指令，请手动复制。${noun}尚未创建。`;
    }
  }

  function open(action, context = {}) {
    if (action === 'workspace') renderWorkspaceForm();
    else if (action === 'project') renderProjectForm();
    else if (action === 'service') renderServiceForm(context);
    else renderChooser();
    setOpen(true);
    content.querySelector('input, button')?.focus();
  }

  document.getElementById('open-agent-action').addEventListener('click', () => open());
  document.getElementById('close-agent-action').addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });

  return { open };
}
