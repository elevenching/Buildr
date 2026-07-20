import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const buildr = path.join(productRoot, 'tools', 'buildr');
const legacyPageContent = '<!doctype html><title>历史任务驾驶舱</title><p>原内容不得迁移或改写。</p>\n';

function runBuildr(args, options = {}) {
  const result = spawnSync(process.execPath, [buildr, ...args], {
    cwd: productRoot,
    encoding: 'utf8',
    timeout: 120000,
    env: { ...process.env, ...(options.env || {}) },
  });
  if (!options.allowFailure) assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  return result;
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

function renameCurrentSourceToLegacy(workspace, { uninstalled = false } = {}) {
  const manifestFile = path.join(workspace, 'skills', 'manifest.yml');
  const currentDir = path.join(workspace, 'skills', 'buildr', 'task-board');
  const legacyDir = path.join(workspace, 'skills', 'buildr', 'task-cockpit');
  fs.renameSync(currentDir, legacyDir);
  fs.writeFileSync(manifestFile, fs.readFileSync(manifestFile, 'utf8').replaceAll('task-board', 'task-cockpit'));

  const receiptFile = path.join(workspace, '.buildr', 'builtin-receipts.json');
  const receipts = JSON.parse(fs.readFileSync(receiptFile, 'utf8'));
  const receipt = receipts.builtins.find((item) => item.type === 'skill' && item.id === 'task-board');
  receipt.id = 'task-cockpit';
  receipt.target = 'skills/buildr/task-cockpit';
  if (uninstalled) {
    receipts.builtins.splice(receipts.builtins.indexOf(receipt), 1);
    fs.rmSync(legacyDir, { recursive: true, force: true });
    fs.writeFileSync(manifestFile, fs.readFileSync(manifestFile, 'utf8')
      .replace(/(  - id: task-cockpit[\s\S]*?    enabled:) true/, '$1 false')
      .replace(/(  - id: task-cockpit[\s\S]*?    state:) installed/, '$1 uninstalled'));
  }
  writeJson(receiptFile, receipts);
}

function renameCurrentRuntimeToLegacy(workspace) {
  const skillsRoot = path.join(workspace, '.agents', 'skills');
  fs.renameSync(path.join(skillsRoot, 'task-board'), path.join(skillsRoot, 'task-cockpit'));
  const receiptsRoot = path.join(workspace, '.agents', 'buildr', 'skill-projection-receipts', 'codex');
  const currentReceipt = path.join(receiptsRoot, 'task-board.json');
  const legacyReceipt = path.join(receiptsRoot, 'task-cockpit.json');
  const receipt = JSON.parse(fs.readFileSync(currentReceipt, 'utf8'));
  receipt.skillId = 'task-cockpit';
  receipt.runtimePath = 'task-cockpit';
  writeJson(legacyReceipt, receipt);
  fs.rmSync(currentReceipt);
}

function createLegacyWorkspace(options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-task-board-upgrade-'));
  const workspace = path.join(root, 'workspace');
  runBuildr(['init', '--target', workspace, '--name', 'task-board-upgrade', '--profile', 'team']);
  runBuildr(['sync', 'codex', '--target', workspace]);
  renameCurrentSourceToLegacy(workspace, options);
  if (options.withRuntime) renameCurrentRuntimeToLegacy(workspace);
  else fs.rmSync(path.join(workspace, '.agents'), { recursive: true, force: true });
  const historicalPage = path.join(workspace, 'projects', 'demo', 'openspec', 'knowledge', 'task-cockpits', '2026-01-01-existing.html');
  fs.mkdirSync(path.dirname(historicalPage), { recursive: true });
  fs.writeFileSync(historicalPage, legacyPageContent);
  return { root, workspace, historicalPage };
}

function treeDigest(root) {
  const hash = crypto.createHash('sha256');
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
      const file = path.join(directory, entry.name);
      hash.update(path.relative(root, file));
      if (entry.isDirectory()) visit(file);
      else hash.update(fs.readFileSync(file));
    }
  };
  visit(root);
  return hash.digest('hex');
}

function assertSyncStopsWithoutWrites(fixture) {
  const before = treeDigest(fixture.workspace);
  const result = runBuildr(['sync', 'codex', '--target', fixture.workspace], { allowFailure: true });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /sync 暂停.*需要用户决策/s);
  assert.equal(treeDigest(fixture.workspace), before);
  assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);
}

test('sync 原子替换官方 task-cockpit source 和 runtime，但不迁移历史 HTML', () => {
  const fixture = createLegacyWorkspace({ withRuntime: true });
  try {
    runBuildr(['sync', 'codex', '--target', fixture.workspace]);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit')), false);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-board', 'SKILL.md')), true);
    assert.equal(fs.existsSync(path.join(fixture.workspace, '.agents', 'skills', 'task-cockpit')), false);
    assert.equal(fs.existsSync(path.join(fixture.workspace, '.agents', 'skills', 'task-board', 'assets', 'task-board-template.html')), true);
    assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'projects', 'demo', 'openspec', 'knowledge', 'task-boards', '2026-01-01-existing.html')), false);
    const receipts = JSON.parse(fs.readFileSync(path.join(fixture.workspace, '.buildr', 'builtin-receipts.json'), 'utf8'));
    assert.equal(receipts.builtins.some((item) => item.id === 'task-cockpit'), false);
    assert.equal(receipts.builtins.some((item) => item.id === 'task-board'), true);
    const converged = treeDigest(fixture.workspace);
    runBuildr(['sync', 'codex', '--target', fixture.workspace]);
    assert.equal(treeDigest(fixture.workspace), converged, 'repeat sync must be idempotent');
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('新 workspace init 只创建 task-board source identity', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'buildr-task-board-init-'));
  const workspace = path.join(root, 'workspace');
  try {
    runBuildr(['init', '--target', workspace, '--name', 'task-board-init', '--profile', 'team']);
    const manifest = fs.readFileSync(path.join(workspace, 'skills', 'manifest.yml'), 'utf8');
    assert.match(manifest, /  - id: task-board/);
    assert.doesNotMatch(manifest, /  - id: task-cockpit/);
    assert.equal(fs.existsSync(path.join(workspace, 'skills', 'buildr', 'task-board', 'assets', 'task-board-template.html')), true);
    assert.equal(fs.existsSync(path.join(workspace, 'skills', 'buildr', 'task-cockpit')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('用户修改过 legacy Skill 时 sync 零写入并请求判断', () => {
  const fixture = createLegacyWorkspace();
  try {
    fs.appendFileSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit', 'SKILL.md'), '\n用户自定义内容\n');
    assertSyncStopsWithoutWrites(fixture);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('显式 restore 接管 Buildr-managed 未知 legacy 内容并由后续 sync 收敛 runtime', () => {
  const fixture = createLegacyWorkspace({ withRuntime: true });
  try {
    fs.appendFileSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit', 'SKILL.md'), '\n旧版官方内容不在当前 legacyIntegrities 中\n');
    assertSyncStopsWithoutWrites(fixture);

    const restored = runBuildr(['builtin', 'restore', 'task-board', '--target', fixture.workspace]);
    assert.match(restored.stdout, /已恢复 Buildr builtin：task-board/);
    assert.match(restored.stdout, /replacement: task-cockpit -> task-board/);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit')), false);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-board', 'SKILL.md')), true);
    assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);

    const manifest = fs.readFileSync(path.join(fixture.workspace, 'skills', 'manifest.yml'), 'utf8');
    assert.match(manifest, /  - id: task-board/);
    assert.doesNotMatch(manifest, /  - id: task-cockpit/);
    const receipts = JSON.parse(fs.readFileSync(path.join(fixture.workspace, '.buildr', 'builtin-receipts.json'), 'utf8'));
    assert.equal(receipts.builtins.some((item) => item.id === 'task-cockpit'), false);
    assert.equal(receipts.builtins.some((item) => item.id === 'task-board'), true);

    runBuildr(['sync', 'codex', '--target', fixture.workspace]);
    assert.equal(fs.existsSync(path.join(fixture.workspace, '.agents', 'skills', 'task-cockpit')), false);
    assert.equal(fs.existsSync(path.join(fixture.workspace, '.agents', 'skills', 'task-board', 'SKILL.md')), true);
    assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);

    const repeated = runBuildr(['builtin', 'restore', 'task-board', '--target', fixture.workspace]);
    assert.match(repeated.stdout, /已恢复 Buildr builtin：task-board/);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('replacement restore 对 ownership、target 和 missing 冲突保持零写入且不假报成功', async (t) => {
  async function assertRestoreBlocked(fixture, mutate, expected = /Buildr builtin restore blocked: task-board/) {
    try {
      mutate(fixture.workspace);
      const before = treeDigest(fixture.workspace);
      const result = runBuildr(['builtin', 'restore', 'task-board', '--target', fixture.workspace], { allowFailure: true });
      assert.notEqual(result.status, 0);
      assert.match(`${result.stdout}${result.stderr}`, expected);
      assert.doesNotMatch(`${result.stdout}${result.stderr}`, /已恢复 Buildr builtin：task-board/);
      assert.equal(treeDigest(fixture.workspace), before);
      assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  }

  await t.test('manifest target mismatch', () => assertRestoreBlocked(createLegacyWorkspace(), (workspace) => {
    const manifestFile = path.join(workspace, 'skills', 'manifest.yml');
    fs.writeFileSync(manifestFile, fs.readFileSync(manifestFile, 'utf8').replace('path: buildr/task-cockpit', 'path: buildr/task-cockpit-other'));
  }));
  await t.test('foreign manifest source', () => assertRestoreBlocked(createLegacyWorkspace(), (workspace) => {
    const manifestFile = path.join(workspace, 'skills', 'manifest.yml');
    fs.writeFileSync(manifestFile, fs.readFileSync(manifestFile, 'utf8').replace(/(  - id: task-cockpit[\s\S]*?    source:) buildr/, '$1 external'));
  }, /must not combine path with source.*skills\/manifest\.yml/));
  await t.test('replacement target occupied', () => assertRestoreBlocked(createLegacyWorkspace(), (workspace) => {
    const target = path.join(workspace, 'skills', 'buildr', 'task-board');
    fs.mkdirSync(target, { recursive: true });
    fs.writeFileSync(path.join(target, 'SKILL.md'), 'foreign target\n');
  }));
  await t.test('predecessor source missing', () => assertRestoreBlocked(createLegacyWorkspace(), (workspace) => {
    fs.rmSync(path.join(workspace, 'skills', 'buildr', 'task-cockpit'), { recursive: true, force: true });
  }));
});

test('显式 replacement restore mutation 失败时回滚且不输出成功', () => {
  const fixture = createLegacyWorkspace({ withRuntime: true });
  try {
    fs.appendFileSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit', 'SKILL.md'), '\nunknown legacy\n');
    const before = treeDigest(fixture.workspace);
    const result = runBuildr(['builtin', 'restore', 'task-board', '--target', fixture.workspace], {
      allowFailure: true,
      env: { BUILDR_FAULT_AFTER_MUTATION_WRITE: '1' },
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /Injected Buildr mutation failure/);
    assert.doesNotMatch(`${result.stdout}${result.stderr}`, /已恢复 Buildr builtin：task-board/);
    assert.equal(treeDigest(fixture.workspace), before);
    assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('legacy source missing 或 replacement source 已存在时 preflight 零写入', async (t) => {
  await t.test('legacy source missing', () => {
    const fixture = createLegacyWorkspace();
    try {
      fs.rmSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit'), { recursive: true, force: true });
      assertSyncStopsWithoutWrites(fixture);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
  await t.test('replacement source target exists', () => {
    const fixture = createLegacyWorkspace();
    try {
      const target = path.join(fixture.workspace, 'skills', 'buildr', 'task-board');
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, 'SKILL.md'), '用户已有的 task-board\n');
      assertSyncStopsWithoutWrites(fixture);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
  await t.test('legacy source contains unknown file', () => {
    const fixture = createLegacyWorkspace();
    try {
      fs.writeFileSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit', 'user-note.md'), '用户文件\n');
      assertSyncStopsWithoutWrites(fixture);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});

test('legacy runtime 被修改或 replacement runtime 被占用时 preflight 零写入', async (t) => {
  await t.test('legacy runtime modified', () => {
    const fixture = createLegacyWorkspace({ withRuntime: true });
    try {
      fs.appendFileSync(path.join(fixture.workspace, '.agents', 'skills', 'task-cockpit', 'SKILL.md'), '\n用户 runtime 修改\n');
      assertSyncStopsWithoutWrites(fixture);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
  await t.test('replacement runtime target exists', () => {
    const fixture = createLegacyWorkspace({ withRuntime: true });
    try {
      const target = path.join(fixture.workspace, '.agents', 'skills', 'task-board');
      fs.mkdirSync(target, { recursive: true });
      fs.writeFileSync(path.join(target, 'SKILL.md'), '用户已有的 runtime task-board\n');
      assertSyncStopsWithoutWrites(fixture);
    } finally {
      fs.rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});

test('replacement source mutation 失败时回滚到完整 legacy 状态', () => {
  const fixture = createLegacyWorkspace({ withRuntime: true });
  try {
    const before = treeDigest(fixture.workspace);
    const result = runBuildr(['sync', 'codex', '--target', fixture.workspace], {
      allowFailure: true,
      env: { BUILDR_FAULT_AFTER_MUTATION_WRITE: '1' },
    });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /Injected Buildr mutation failure/);
    assert.equal(treeDigest(fixture.workspace), before);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-cockpit')), true);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-board')), false);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('最终 doctor 失败不假报迁移成功，修复后重复 sync 收敛', () => {
  const fixture = createLegacyWorkspace({ withRuntime: true });
  try {
    const projectsManifest = path.join(fixture.workspace, 'projects', 'manifest.yml');
    fs.writeFileSync(projectsManifest, [
      'schemaVersion: buildr.projects/v1',
      'projects:',
      '  missing-project:',
      '    title: Missing Project',
      '    description: Doctor failure fixture',
      '    path: projects/missing-project',
      '    repo:',
      '      kind: workspace',
      '',
    ].join('\n'));
    const first = runBuildr(['sync', 'codex', '--target', fixture.workspace], { allowFailure: true });
    assert.notEqual(first.status, 0);
    assert.match(`${first.stdout}${first.stderr}`, /sync 未完成：最终 doctor 未通过/);
    assert.doesNotMatch(`${first.stdout}${first.stderr}`, /doctor 通过/);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-board')), true);
    assert.equal(fs.existsSync(path.join(fixture.workspace, '.agents', 'skills', 'task-board')), true);
    fs.writeFileSync(projectsManifest, 'schemaVersion: buildr.projects/v1\nprojects: {}\n');
    runBuildr(['sync', 'codex', '--target', fixture.workspace]);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('显式卸载的 legacy Skill 迁移为 task-board 卸载状态且不重新安装', () => {
  const fixture = createLegacyWorkspace({ uninstalled: true });
  try {
    runBuildr(['sync', 'codex', '--target', fixture.workspace]);
    const manifest = fs.readFileSync(path.join(fixture.workspace, 'skills', 'manifest.yml'), 'utf8');
    assert.match(manifest, /  - id: task-board[\s\S]*?    enabled: false[\s\S]*?    state: uninstalled/);
    assert.doesNotMatch(manifest, /  - id: task-cockpit/);
    assert.equal(fs.existsSync(path.join(fixture.workspace, 'skills', 'buildr', 'task-board')), false);
    assert.equal(fs.readFileSync(fixture.historicalPage, 'utf8'), legacyPageContent);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});
