import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const productRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (relative) => fs.readFileSync(path.join(productRoot, relative), 'utf8');
const cockpitSkill = read('package/targets/workspace/skills/buildr/task-cockpit/SKILL.md');
const triageSkill = read('package/targets/workspace/skills/buildr/task-triage/SKILL.md');
const template = read('package/targets/workspace/skills/buildr/task-cockpit/assets/task-cockpit-template.html');
const openaiMetadata = read('package/targets/workspace/skills/buildr/task-cockpit/agents/openai.yaml');

function parseCockpitData(html) {
  const match = html.match(/<script id="cockpit-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(match, 'template must contain cockpit-data JSON');
  return JSON.parse(match[1]);
}

test('任务驾驶舱与任务看板共享同一 artifact 并要求真实 change', () => {
  assert.match(cockpitSkill, /驾驶舱（任务看板）/);
  assert.match(cockpitSkill, /两种名称指向同一 artifact/);
  assert.match(cockpitSkill, /每个看板至少关联一个已经创建并核实路径的 OpenSpec change/);
  assert.match(triageSkill, /至少关联一个真实 OpenSpec change/);
  assert.match(triageSkill, /先进入 `change-flow`/);
  assert.match(openaiMetadata, /任务驾驶舱（任务看板）/);
});

test('任务看板模板提供 changes batches dependencyPool 和方案分层', () => {
  const data = parseCockpitData(template);
  assert.ok(Array.isArray(data.changes) && data.changes.length > 0);
  assert.ok(Array.isArray(data.progress.batches));
  assert.ok(Array.isArray(data.progress.dependencyPool));
  assert.ok(Array.isArray(data.solution.businessPlan));
  assert.ok(Array.isArray(data.solution.technicalPlan));
  assert.ok(Array.isArray(data.technical.details));
  assert.ok(data.progress.batches.every((batch) => batch.id && Array.isArray(batch.changeIds)));
  assert.ok(data.changes.every((change) => change.id && change.path && Array.isArray(change.batchIds)));
  assert.doesNotMatch(template, /https?:\/\//);
  assert.doesNotMatch(template, /data\.progress\.stages/);
});

test('任务看板从 runtime Skill 自身复制完整目录中的模板', () => {
  assert.match(cockpitSkill, /当前 runtime `SKILL\.md` 所在目录为基准/);
  assert.match(cockpitSkill, /相对路径 `assets\/task-cockpit-template\.html`/);
  assert.match(cockpitSkill, /完整目录投射是 Buildr runtime contract/);
  assert.match(cockpitSkill, /不要.*依赖 `agents\/openai\.yaml` 定位资源/);
  assert.doesNotMatch(cockpitSkill, /不要依赖 runtime 投射目录一定包含随附模板/);
});
