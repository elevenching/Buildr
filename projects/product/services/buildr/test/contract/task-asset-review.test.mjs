import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(productRoot, relative), 'utf8');
const fixtures = JSON.parse(read('test/fixtures/task-asset-review.json'));
const reviewSkill = read('package/targets/workspace/skills/buildr/task-asset-review/SKILL.md');
const finishSkill = read('package/targets/workspace/skills/buildr/task-finish/SKILL.md');
const buildrSkill = read('package/targets/runtime/skills/buildr/SKILL.md');
const packageManifest = read('package/manifest.yml');
const workspaceSkills = read('package/targets/workspace/skills/manifest.yml');

function assertIds(cases, expected) {
  assert.deepEqual(cases.map((item) => item.id), expected);
  for (const item of cases) {
    assert.ok(Array.isArray(item.expected) && item.expected.length > 0, `${item.id} must declare expected behavior`);
  }
}

test('任务节点 fixture 覆盖关键转折、成本和降级证据', () => {
  assertIds(fixtures.nodeCases, [
    'user-boundary-correction',
    'assumption-overturned',
    'failure-retry-root-cause',
    'invalid-repetition',
    'validation-deviation',
    'subagent-report',
    'unused-token-tool-cost',
    'necessary-verification-cost',
    'final-evidence-only',
  ]);
  assert.match(reviewSkill, /用户原始目标、纠正和明确决策/);
  assert.match(reviewSkill, /subagent 的任务划分、证据和最终报告/);
  assert.match(reviewSkill, /无效全量搜索、重复工具、重复完整验证、过度 subagent/);
  assert.match(reviewSkill, /必要成本/);
  assert.match(reviewSkill, /完成降级审查/);
});

test('审查输出 fixture 保持质量反馈、Rule Skill 候选和其他 follow-up 分层', () => {
  assertIds(fixtures.outputCases, [
    'quality-only',
    'rule-candidate',
    'skill-candidate',
    'openspec-as-evidence',
    'other-asset-follow-up',
    'no-qualified-candidate',
    'authoritative-conflict',
  ]);
  assert.match(reviewSkill, /执行质量反馈/);
  assert.match(reviewSkill, /资产沉淀建议/);
  assert.match(reviewSkill, /不得输出 Specs 候选/);
  assert.match(reviewSkill, /普通 follow-up/);
  assert.match(reviewSkill, /与权威事实冲突/);
});

test('task-finish fixture 覆盖轻量门控、复用、降级和写回授权', () => {
  assertIds(fixtures.finishCases, [
    'gate-no-signal',
    'gate-signal',
    'reuse-current-tree-result',
    'review-no-candidate',
    'skill-uninstalled',
    'review-failed',
    'candidate-capsule',
    'finish-does-not-authorize-write',
  ]);
  assert.match(finishSkill, /不得调用工具、重新读取任务文件或加载完整 selected asset-review provider/);
  assert.match(finishSkill, /静默跳过完整审查/);
  assert.match(finishSkill, /复用当前候选 tree 已有的有效审查结果/);
  assert.match(finishSkill, /审查成功不是 archive、commit、integration、push 或 cleanup 的新增前置条件/);
  assert.match(finishSkill, /“收尾”不构成 Rule 或 Skill 写入授权/);
  const preSync = finishSkill.indexOf('buildr:skill-contributions pre-spec-sync');
  const postSync = finishSkill.indexOf('buildr:skill-contributions post-spec-sync');
  const reviewGate = finishSkill.indexOf('## 2. 任务资产审查门控');
  const archive = finishSkill.indexOf('## 3. OpenSpec 归档与格式收敛');
  assert.ok(preSync < postSync && postSync < reviewGate && reviewGate < archive, 'contract checks must precede review, and review must precede archive');
});

test('task-finish 核对 requiredAssurance，并对 Product Candidate 保留 timing 专项', () => {
  for (const required of [
    'buildr.verification-timing/v1',
    '`level == requiredAssurance`',
    '`requiredAssurance`',
    '`status: passed`',
    '`totalDurationMs`',
    '`timingSource`',
    '`source.repositoryRoot`',
    '`source.productRoot`',
    '`source.head`',
    '`source.candidateFingerprint`',
    'Changed 或 Focus summary 不能替代 Candidate',
    '不得把并行 check duration 相加推算 wall-clock',
    '完整验证总耗时',
    '预算状态',
    '最慢检查及其耗时',
    '失败项',
    '跳过项',
    'evidence retention',
    'cleanup status',
    'summary 仍保留时报告绝对路径',
    '不得输出失效路径',
    '`implementationCandidateIdentity`',
    '`deliveryTreeIdentity`',
    '`taskVerificationExecuteCalls`',
    '`candidateExecutorCalls`',
    'closeout delta checks',
  ]) assert.ok(finishSkill.includes(required), `task-finish must include ${required}`);
});

test('证据胶囊支持 worktree 清理后继续核查并标记 session 限制', () => {
  assertIds(fixtures.postCloseoutCases, ['worktree-removed', 'session-only-evidence']);
  for (const required of [
    '最终 commit / diff',
    '归档 OpenSpec change',
    '稳定文件或任务看板',
    '证据限制',
    '证据耐久性较弱',
  ]) {
    assert.ok(reviewSkill.includes(required), `review Skill must include ${required}`);
  }
});

test('产品入口、optional builtin 和 workspace baseline 路由一致', () => {
  assert.match(buildrSkill, /`buildr\.task-asset-review\/v1` selected provider/);
  assert.match(buildrSkill, /optional 不可用时按 consumer 声明降级/);
  assert.match(packageManifest, /id: task-asset-review[\s\S]*required: false[\s\S]*capability: buildr\.task-asset-review/);
  assert.match(packageManifest, /task-asset-review\/agents\/openai\.yaml/);
  assert.match(workspaceSkills, /id: task-asset-review[\s\S]*state: installed[\s\S]*runtimePath: task-asset-review[\s\S]*capability: buildr\.task-asset-review/);
});

test('任务审查明确拒绝隐藏推理、完整轨迹和自动资产写入', () => {
  assert.match(reviewSkill, /不得声称读取模型隐藏推理、chain-of-thought 或内部 deliberation/);
  assert.match(reviewSkill, /不得为了审查采集或保存完整原始对话、完整工具日志、逐节点回放或完整任务轨迹/);
  assert.match(reviewSkill, /不自动写入组织资产/);
  assert.doesNotMatch(reviewSkill, /安装 runtime Hook|启动 daemon|启动 watcher|接入事件总线/);
});

test('任务审查核对源资源并输出明确覆盖度', () => {
  for (const required of [
    '候选目标资产的源文件、manifest、随附模板、脚本、metadata',
    '完整覆盖',
    '部分覆盖',
    '存在冲突',
    '尚无资产',
    'runtime 投射只能证明同步状态',
    '现有资产覆盖结论',
    '现有资产差距',
  ]) {
    assert.ok(reviewSkill.includes(required), `review Skill must include ${required}`);
  }
  assert.match(reviewSkill, /本 Skill 是 `buildr\.task-asset-review\/v1` 的默认 provider/);
  assert.match(reviewSkill, /selected provider/);
});
