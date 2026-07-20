import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(productRoot, relative), 'utf8');

const contract = read('package/targets/workspace/skills/contracts/buildr/task-verification/v1.md');
const verificationSkill = read('package/targets/workspace/skills/buildr/task-verification/SKILL.md');
const worktreeSkill = read('package/targets/workspace/skills/buildr/task-worktree/SKILL.md');
const gitIntegrationContract = read('package/targets/workspace/skills/contracts/buildr/git-task-integration/v1.md');
const gitOpsSkill = read('package/targets/workspace/skills/buildr/git-ops/SKILL.md');
const finishSkill = read('package/targets/workspace/skills/buildr/task-finish/SKILL.md');
const buildrSkill = read('package/targets/runtime/skills/buildr/SKILL.md');
const packageManifest = YAML.parse(read('package/manifest.yml'));
const workspaceManifest = YAML.parse(read('package/targets/workspace/skills/manifest.yml'));
const closeoutFixtures = JSON.parse(read('test/fixtures/task-verification-closeout.json'));

test('task-verification contract 定义独立验证与耗时证据', () => {
  assert.match(contract, /id: buildr\.task-verification/);
  for (const required of [
    'minimal', 'affected', 'candidate', 'candidateIdentity', 'totalDurationMs',
    'timingSource', 'verifier-reported', 'wrapper-measured', 'slowestCheck',
    'failedChecks', 'skippedChecks', 'evidenceReference', 'evidenceRetention',
    'cleanupAfter', 'cleanupStatus', 'cleanupReference', 'transient', 'caller-managed',
    'inspect', 'execute', 'cleanup', 'taskVerificationExecuteCalls', 'candidateExecutorCalls',
  ]) assert.ok(contract.includes(required), `contract must include ${required}`);
  assert.match(contract, /不得相加并行检查耗时推算整体 wall-clock/);
  assert.match(contract, /不得.*要求 Git worktree/);
});

test('默认 provider 执行三级验证并统一报告', () => {
  for (const required of [
    'Rules/AGENTS', 'Minimal', 'Affected', 'Candidate', '单调时钟',
    'wait、poll 或 resume 同一进程', 'totalDurationMs', 'timingSource',
    'slowestCheck', 'failedChecks', 'skippedChecks', 'evidenceReference',
    'evidenceRetention', 'cleanupAfter', 'cleanupStatus', 'cleanupReference',
    '用户无需主动点名本 Skill', 'task-worktree` 不负责这项清理',
    '最终候选验证尚未执行', 'inspect', 'execute', 'cleanup',
    'taskVerificationExecuteCalls', 'candidateExecutorCalls',
  ]) assert.ok(verificationSkill.includes(required), `verification Skill must include ${required}`);
  assert.doesNotMatch(verificationSkill, /必须使用 Git worktree/);
});

test('worktree lifecycle 与任务验证职责解耦', () => {
  assert.match(worktreeSkill, /候选边界交接/);
  assert.match(worktreeSkill, /不执行三级验证/);
  assert.doesNotMatch(worktreeSkill, /实现期间采用三级验证门禁/);
  assert.doesNotMatch(worktreeSkill, /单任务最小反馈：/);
  assert.match(worktreeSkill, /不监控普通编辑/);
  assert.match(worktreeSkill, /不把 task checkout lifecycle contract 扩张为内容监控、Git integration 或验证执行 contract/);
  assert.equal(worktreeSkill.split('实际自举 workspace 的 sync 是独立的状态变更').length - 1, 1);
  assert.equal(worktreeSkill.split('本机 `buildr` 若指向即将删除的 task worktree').length - 1, 1);
  assert.doesNotMatch(worktreeSkill, /旧 evidence 随即失效/);
});

test('Git integration 只返回内容转换证据，不拥有 Candidate 验证决策', () => {
  assert.match(gitIntegrationContract, /version: 1/);
  assert.match(gitIntegrationContract, /输入与最终 candidate content identity/);
  assert.match(gitIntegrationContract, /tree 等价性信号只描述 Git 操作效果/);
  assert.match(gitIntegrationContract, /验证 evidence 的有效性、复用或重跑由 task-verification provider 或其 consumer 决定/);
  assert.match(gitOpsSkill, /不执行项目 Candidate 验证/);
  assert.match(gitOpsSkill, /tree 等价性信号只描述 Git 操作效果/);
  assert.doesNotMatch(gitOpsSkill, /改变已验证 tree 时，原验证结果失效/);
  assert.doesNotMatch(gitOpsSkill, /集成前重新运行受影响的验证/);
  assert.doesNotMatch(gitOpsSkill, /复用已有验证结果/);
});

test('随包 manifest 原子登记 contract、provider、binding 与 consumer', () => {
  const packagedContract = packageManifest.capabilityContracts.find((item) => item.id === 'buildr.task-verification');
  assert.equal(packagedContract.version, 1);
  assert.equal(packageManifest.initialSkillBindings.find((item) => item.capability === 'buildr.task-verification').provider, 'task-verification');
  const packagedSkill = packageManifest.builtins.skills.find((item) => item.id === 'task-verification');
  assert.equal(packagedSkill.provides[0].capability, 'buildr.task-verification');
  assert.match(packagedSkill.description, /Agent 准备判断或声称开发完成/);
  assert.match(packagedSkill.description, /用户无需主动点名本 Skill/);
  const finish = packageManifest.builtins.skills.find((item) => item.id === 'task-finish');
  assert.ok(finish.requires.some((item) => item.capability === 'buildr.task-verification' && item.mode === 'required'));

  assert.equal(workspaceManifest.bindings.find((item) => item.capability === 'buildr.task-verification').provider, 'task-verification');
  const workspaceSkill = workspaceManifest.skills.find((item) => item.id === 'task-verification');
  assert.ok(workspaceSkill.runtimes.includes('workbuddy'));
  assert.equal(workspaceSkill.description, packagedSkill.description);

  const gitContract = packageManifest.capabilityContracts.find((item) => item.id === 'buildr.git-task-integration');
  const worktreeContract = packageManifest.capabilityContracts.find((item) => item.id === 'buildr.task-worktree-lifecycle');
  assert.equal(gitContract.version, 1);
  assert.equal(worktreeContract.version, 1);
  assert.equal(packageManifest.initialSkillBindings.find((item) => item.capability === 'buildr.git-task-integration').provider, 'git-ops');
  assert.equal(packageManifest.initialSkillBindings.find((item) => item.capability === 'buildr.task-worktree-lifecycle').provider, 'task-worktree');
  assert.deepEqual(packageManifest.builtins.skills.find((item) => item.id === 'git-ops').provides.map((item) => item.capability), [
    'buildr.git-single-operation',
    'buildr.git-task-integration',
    'buildr.git-workspace-update',
  ]);
  assert.deepEqual(packageManifest.builtins.skills.find((item) => item.id === 'task-worktree').provides.map((item) => item.capability), [
    'buildr.task-worktree-lifecycle',
  ]);
});

test('task-finish 消费标准 Candidate evidence 并报告耗时', () => {
  for (const required of [
    'selected task-verification provider', '`level: candidate`', '`totalDurationMs`',
    '`timingSource`', '最慢检查', '失败项', '跳过项', 'evidence retention',
    'cleanup status', 'selected task-verification provider 使用其 `cleanupReference`',
    'implementationCandidateIdentity', 'deliveryTreeIdentity', 'same-content',
    'closeout-metadata-only', 'implementation-changed', 'taskVerificationExecuteCalls',
    'candidateExecutorCalls',
  ]) assert.ok(finishSkill.includes(required), `finish Skill must include ${required}`);
  assert.match(finishSkill, /Buildr Product.*buildr\.verification-timing\/v1/s);
});

test('已有 Candidate 进入收尾时按 transition class 去重 executor 调用', () => {
  assert.equal(closeoutFixtures.schemaVersion, 'buildr.task-verification-closeout-fixtures/v1');
  assert.deepEqual(closeoutFixtures.cases.map((item) => item.id), [
    'existing-candidate-same-content',
    'openspec-archive-only',
    'implementation-changed',
  ]);

  const [sameContent, archiveOnly, implementationChanged] = closeoutFixtures.cases;
  for (const item of [sameContent, archiveOnly]) {
    assert.equal(item.taskVerificationExecuteCalls, 0, `${item.id} must not execute task verification`);
    assert.equal(item.candidateExecutorCalls, 0, `${item.id} must not execute Candidate`);
    assert.equal(item.candidateReused, true, `${item.id} must reuse Candidate evidence`);
    assert.ok(item.providerOperations.includes('inspect'), `${item.id} must inspect existing evidence`);
    assert.ok(!item.providerOperations.includes('execute'), `${item.id} must not request execute`);
  }
  assert.equal(sameContent.transitionClass, 'same-content');
  assert.equal(archiveOnly.transitionClass, 'closeout-metadata-only');
  assert.deepEqual(archiveOnly.closeoutChecks, ['openspec-strict', 'contract-guard', 'git-diff-check']);

  assert.equal(implementationChanged.transitionClass, 'implementation-changed');
  assert.deepEqual(implementationChanged.providerOperations, ['execute', 'cleanup']);
  assert.equal(implementationChanged.taskVerificationExecuteCalls, 1);
  assert.equal(implementationChanged.candidateExecutorCalls, 1);
  assert.equal(implementationChanged.candidateReused, false);
});

test('产品入口分别路由验证与 worktree lifecycle 意图', () => {
  assert.match(buildrSkill, /实现任务到达验证\/完成节点 \| `buildr\.task-verification\/v1` selected provider；用户无需主动点名该能力/);
  assert.match(buildrSkill, /清理 task worktree \| `buildr\.task-worktree-lifecycle\/v1` selected provider/);
});
