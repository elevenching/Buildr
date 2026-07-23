import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(productRoot, relative), 'utf8');

const triageSkill = read('package/targets/workspace/skills/buildr/task-triage/SKILL.md');
const worktreeSkill = read('package/targets/workspace/skills/buildr/task-worktree/SKILL.md');
const proposeUpstream = read('package/targets/workspace/skills/openspec/openspec-propose/SKILL.md');
const proposeSidebar = read('package/targets/workspace/components/buildr/openspec/contributions/openspec-propose-sidebar.md');
const packageManifest = YAML.parse(read('package/manifest.yml'));
const workspaceManifest = YAML.parse(read('package/targets/workspace/skills/manifest.yml'));

test('task triage 在语义路径之外输出执行形态与任务位置', () => {
  for (const required of [
    '执行形态：implementation / metadata-only / 待确认',
    'Worktree：创建 / 复用 / 不需要 / 待确认',
    '`change-flow + implementation`',
    '`code-only + implementation`',
    '`change-flow + metadata-only`',
    '不得先写入 change artifacts 再决定位置',
  ]) assert.ok(triageSkill.includes(required), `task-triage must include ${required}`);

  assert.match(triageSkill, /等 task worktree ready 后才进入 OpenSpec propose/);
  assert.match(triageSkill, /本 Skill 只选择任务位置，不复制 worktree 创建、doctor、sync、保留或清理流程/);
});

test('OpenSpec propose 直接入口在首次写入前执行 worktree 门禁', () => {
  assert.match(proposeSidebar, /执行 `openspec new change` 或写入任何 change artifacts 前/);
  assert.match(proposeSidebar, /代码修改、构建、测试或需要长期开发上下文/);
  assert.match(proposeSidebar, /先使用 `task-worktree` 创建或复用 canonical task worktree/);
  assert.match(proposeSidebar, /无法判断是否会进入实现时，先澄清执行范围/);
  assert.match(proposeSidebar, /不修改外部 `openspec-propose` Skill 的上游正文/);

  assert.doesNotMatch(proposeUpstream, /canonical task worktree/);
  assert.doesNotMatch(proposeUpstream, /任务执行形态/);
});

test('worktree provider 保持环境职责且既有 capability 图不扩张', () => {
  assert.match(worktreeSkill, /它不判断业务语义是否需要 OpenSpec change/);
  assert.match(worktreeSkill, /propose 和创建 change artifacts 前先完成 worktree 决策/);
  assert.match(worktreeSkill, /artifacts、实现和合并前候选验证都只能写入该 worktree/);

  const packagedTriage = packageManifest.builtins.skills.find((item) => item.id === 'task-triage');
  const workspaceTriage = workspaceManifest.skills.find((item) => item.id === 'task-triage');
  assert.deepEqual(packagedTriage.provides || [], []);
  assert.deepEqual(packagedTriage.requires || [], []);
  assert.deepEqual(workspaceTriage.provides || [], []);
  assert.deepEqual(workspaceTriage.requires || [], []);

  const contract = packageManifest.capabilityContracts.find((item) => item.id === 'buildr.task-worktree-lifecycle');
  const binding = packageManifest.initialSkillBindings.find((item) => item.capability === 'buildr.task-worktree-lifecycle');
  assert.equal(contract.version, 1);
  assert.equal(binding.provider, 'task-worktree');
});
