import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import { chromium } from 'playwright-core';

import { createRuntime } from '../../src/application/compose-runtime.mjs';
import { createLocalWorkspaceServer } from '../../src/interfaces/local-app/http/server.mjs';

const PRODUCT_ROOT = path.resolve(import.meta.dirname, '../..');
const BUILDR = path.join(PRODUCT_ROOT, 'bin', 'buildr.mjs');
const SELECTOR = process.argv[2] ?? 'all';
const KNOWN_SELECTORS = new Set(['all', 'shell', 'project', 'service', 'change']);

if (!KNOWN_SELECTORS.has(SELECTOR)) throw new Error(`Unknown browser integration selector: ${SELECTOR}`);
const selected = (name) => SELECTOR === 'all' || SELECTOR === name;

function runBuildr(args) {
  const result = spawnSync(process.execPath, [BUILDR, ...args], { cwd: PRODUCT_ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, `${result.stderr}\n${result.stdout}`);
}

function browserCandidates() {
  return [
    process.env.BUILDR_BROWSER_EXECUTABLE,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    process.env['PROGRAMFILES(X86)'] && path.join(process.env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ].filter(Boolean);
}

function resolveBrowserExecutable() {
  const executable = browserCandidates().find((candidate) => {
    try { fs.accessSync(candidate, fs.constants.X_OK); return true; } catch { return false; }
  });
  if (!executable) {
    throw new Error('Browser smoke 需要本机 Chrome/Chromium；可通过 BUILDR_BROWSER_EXECUTABLE 指定可执行文件，测试不会自动下载浏览器。');
  }
  return executable;
}

function writeChange(projectRoot, relative, title) {
  const changeRoot = path.join(projectRoot, 'openspec', 'changes', relative);
  fs.mkdirSync(path.join(changeRoot, 'specs', 'demo-capability'), { recursive: true });
  fs.writeFileSync(path.join(changeRoot, '.openspec.yaml'), 'schema: spec-driven\n');
  fs.writeFileSync(path.join(changeRoot, 'proposal.md'), `# ${title}\n\n验证本机应用。\n`);
  fs.writeFileSync(path.join(changeRoot, 'design.md'), '## Context\n\nBrowser smoke fixture.\n');
  fs.writeFileSync(path.join(changeRoot, 'tasks.md'), '- [x] 准备 fixture\n- [ ] 验证页面\n');
  fs.writeFileSync(path.join(changeRoot, 'specs', 'demo-capability', 'spec.md'), '# Demo Capability Specification\n\n## Purpose\n\nFixture.\n\n## Requirements\n');
}

function createFixture(root) {
  runBuildr(['init', '--target', root, '--name', 'browser-smoke', '--description', '隔离的浏览器 E2E fixture']);
  runBuildr(['project', 'create', 'demo', '--target', root, '--name', '演示项目', '--description', '浏览器测试项目']);
  const source = path.join(path.dirname(root), 'service-source');
  fs.mkdirSync(source);
  fs.writeFileSync(path.join(source, 'README.md'), '# Demo API\n');
  runBuildr(['service', 'create', 'demo/api', source, '--target', root, '--name', '演示服务', '--description', '浏览器测试服务', '--type', 'backend']);
  const projectRoot = path.join(root, 'projects', 'demo');
  writeChange(projectRoot, 'browser-flow', '浏览器流程');
  writeChange(projectRoot, 'archive/2026-07-22-archived-flow', '已归档流程');
}

async function unique(locator, description) {
  const count = await locator.count();
  assert.equal(count, 1, `${description} 应唯一，实际 ${count} 个。`);
  return locator;
}

test(`本机应用浏览器集成：${SELECTOR}`, { timeout: 45_000 }, async (t) => {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-browser-smoke-'));
  const workspaceRoot = path.join(base, 'workspace');
  let browser;
  let server;
  t.after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
    fs.rmSync(base, { recursive: true, force: true });
  });

  createFixture(workspaceRoot);
  process.env.BUILDR_APP_DATA_DIR = path.join(base, 'app-data');
  t.after(() => delete process.env.BUILDR_APP_DATA_DIR);
  const otherRoot = path.join(base, 'other-workspace');
  runBuildr(['init', '--target', otherRoot, '--name', 'other-workspace', '--description', '第二个浏览器工作空间']);
  const runtime = createRuntime();
  let registry = runtime.listRegisteredWorkspaces();
  registry = runtime.registerLocalWorkspace({ rootPath: otherRoot, revision: registry.revision });
  const instance = createLocalWorkspaceServer(runtime, { targetRoot: workspaceRoot });
  server = instance.server;
  const { url, initialWorkspaceId } = await instance.ready;
  const workspaceUrl = `${url}/workspaces/${initialWorkspaceId}`;
  browser = await chromium.launch({ executablePath: resolveBrowserExecutable(), headless: true });
  const page = await browser.newPage({ locale: 'zh-CN' });
  const browserErrors = [];
  page.on('pageerror', (error) => browserErrors.push(`pageerror ${page.url()}: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(`console.error ${page.url()}: ${message.text()}`); });

  if (selected('shell')) await t.test('全局首页展示多个工作空间并进入选定上下文', async () => {
    await page.goto(url);
    await page.locator('#workspace-grid .workspace-card').first().waitFor({ state: 'visible' });
    assert.equal(await page.locator('#workspace-grid .workspace-card').count(), 2);
    const target = page.locator('#workspace-grid .workspace-card').filter({ has: page.locator('h2').filter({ hasText: /^browser-smoke$/ }) });
    await unique(target, 'browser-smoke 工作空间卡片');
    await target.getByRole('link', { name: '打开工作空间' }).click();
    await page.waitForURL(`${workspaceUrl}/`);
    assert.equal(await page.locator('#overview-title').innerText(), 'browser-smoke');
    let current = runtime.listRegisteredWorkspaces();
    for (const entry of [...current.workspaces]) current = runtime.removeRegisteredWorkspace({ rootPath: entry.rootPath, revision: current.revision });
    await page.goto(url);
    await page.locator('#workspace-empty').waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('button', { name: '选择已有工作空间' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: '交给 Agent 新建' }).count(), 1);
    assert.equal(await page.getByRole('button', { name: '稍后处理' }).count(), 1);
    current = runtime.registerLocalWorkspace({ rootPath: workspaceRoot, revision: current.revision });
    runtime.registerLocalWorkspace({ rootPath: otherRoot, revision: current.revision });
  });

  if (selected('project')) await t.test('项目目录通过操作栏进入稳定详情', async () => {
    await page.goto(`${workspaceUrl}/projects`);
    const row = page.locator('#project-table-body tr').filter({ hasText: '演示项目' });
    await unique(row, '项目行');
    const detail = row.getByRole('link', { name: '详情', exact: true });
    await unique(detail, '项目详情操作');
    await detail.click();
    await page.waitForURL(`${workspaceUrl}/projects/demo`);
    assert.equal(await page.locator('#project-detail-name').innerText(), '演示项目');
    assert.equal(await page.locator('#project-detail-code').innerText(), 'demo');
    assert.equal(await page.locator('#project-service-count').innerText(), '1');
  });

  if (selected('service')) await t.test('服务目录按项目过滤并打开真实详情', async () => {
    await page.goto(`${workspaceUrl}/services?project=demo`);
    const projectSelect = page.locator('#service-project-select');
    await unique(projectSelect, '服务所属项目过滤器');
    assert.equal(await projectSelect.inputValue(), 'demo');
    const row = page.locator('#service-table-body tr').filter({ hasText: '演示服务' });
    await unique(row, '服务行');
    const detail = row.getByRole('button', { name: '详情', exact: true });
    await unique(detail, '服务详情操作');
    await detail.click();
    await page.locator('#service-detail').waitFor({ state: 'visible' });
    assert.equal(await page.locator('#service-title').innerText(), '演示服务');
    assert.equal(await page.locator('#service-code').innerText(), 'api');
    assert.equal(await page.locator('#service-type').inputValue(), 'backend');
  });

  if (selected('change')) await t.test('变更目录过滤、详情和 Agent prompt 保持只读', async () => {
    await page.goto(`${workspaceUrl}/changes`);
    const lifecycle = page.locator('#change-lifecycle-filter');
    await unique(lifecycle, 'Change 生命周期过滤器');
    await lifecycle.selectOption('archived');
    assert.equal(await page.locator('#change-table-body tr').count(), 1);
    await lifecycle.selectOption('active');
    const row = page.locator('#change-table-body tr').filter({ hasText: 'browser-flow' });
    await unique(row, '进行中 Change 行');
    const detail = row.getByRole('link', { name: '详情', exact: true });
    await unique(detail, 'Change 详情操作');
    await detail.click();
    await page.waitForURL(`${workspaceUrl}/changes/demo/active~browser-flow`);
    assert.equal(await page.locator('#change-detail-code').innerText(), 'browser-flow');
    assert.equal(await page.locator('#change-detail-lifecycle').innerText(), '进行中');
    assert.equal(await page.locator('#change-detail-progress').innerText(), '1 / 2');
    assert.equal(await page.locator('#change-artifacts .artifact-panel').count(), 4);
    const proceed = page.getByRole('button', { name: '继续推进', exact: true });
    await unique(proceed, '继续推进操作');
    await proceed.click();
    const generate = page.getByRole('button', { name: '生成继续推进指令', exact: true });
    await unique(generate, '生成继续推进指令操作');
    await generate.click();
    await page.locator('#action-prompt-output').waitFor({ state: 'visible' });
    assert.match(await page.locator('#action-prompt-output').inputValue(), /browser-flow/);
    assert.equal(await page.locator('#action-copy-state').innerText(), 'Change 文件未被修改。');
  });

  assert.deepEqual(browserErrors, [], browserErrors.join('\n'));
});
