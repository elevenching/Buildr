import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import YAML from 'yaml';

const read = (path) => fs.readFileSync(path, 'utf8');
const packageManifest = YAML.parse(read('package/manifest.yml'));
const workspaceManifest = YAML.parse(read('package/targets/workspace/skills/manifest.yml'));
const core = read('package/targets/workspace/rules/buildr/core.md');
const buildrSkill = read('package/targets/runtime/skills/buildr/SKILL.md');
const adaptation = read('package/targets/workspace/skills/buildr/capability-adaptation/SKILL.md');

test('工作能力适配从自然语言意图路由且不要求用户维护 capability 原语', () => {
  assert.match(buildrSkill, /采用内部流程、调整工作方式、修改或替换 Skill 行为/);
  assert.match(buildrSkill, /先加载 `capability-adaptation` 判断是否触达或产生跨 Skill 稳定依赖边界/);
  assert.match(buildrSkill, /产品入口 Buildr Skill 是能力路由者/);
  assert.match(adaptation, /用户无需知道这些资产名称/);
  assert.match(adaptation, /判断的是稳定协作边界，不是用户是否说出 capability 名字/);
  assert.match(adaptation, /不要要求用户手改 manifest/);
});

test('Core 要求 Skill 变更前检查跨 Skill 影响', () => {
  assert.match(core, /创建、修改、替换或卸载 Skill 前必须检查相关 `provides`、`requires`/);
  assert.match(core, /不得绕过已知依赖直接激活/);
});

test('capability-adaptation 作为 optional 管理 Skill 发布且不声明空洞 capability', () => {
  const packaged = packageManifest.builtins.skills.find((skill) => skill.id === 'capability-adaptation');
  const workspace = workspaceManifest.skills.find((skill) => skill.id === 'capability-adaptation');
  assert.ok(packaged);
  assert.equal(packaged.required, false);
  assert.deepEqual(packaged.provides, undefined);
  assert.deepEqual(packaged.requires, undefined);
  assert.equal(packaged.runtimes.length, 7);
  assert.ok(workspace);
  assert.equal(workspace.state, 'installed');
  assert.equal(workspace.required, false);
  assert.equal(workspace.runtimePath, 'capability-adaptation');
});

test('能力适配先验证候选并保留可恢复的当前实现', () => {
  assert.match(adaptation, /先开发候选，再改变当前实现/);
  assert.match(adaptation, /不得先卸载或覆盖当前有效实现/);
  assert.match(adaptation, /在新 binding ready 之前不卸载旧 provider/);
  assert.match(adaptation, /使用记录的旧 binding 恢复选择/);
  assert.match(adaptation, /验证 Task Finish 后激活/);
});
