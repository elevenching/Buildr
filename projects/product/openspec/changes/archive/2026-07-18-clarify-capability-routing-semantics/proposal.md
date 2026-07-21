## Why

当前 capability contract 已支持 provider 替换和 consumer 依赖，但文档既使用“Skill 调用”一类容易类比成程序方法调用的表述，又把产品入口 Buildr Skill 描述成用户意图的全局前置路由器。实际上，Agent runtime 先根据 Skill description 发现并加载入口 Skill，入口 Skill 才读取受管 capability binding 解析依赖。若不澄清，后续既容易把所有 Skill 关系过度建模为静态依赖，也会误以为 binding 能自动解决顶层 Skill 的意图发现。

## What Changes

- 明确 capability contract 表达的是 consumer 所依赖的最低保证与结果证据，不是 Skill-to-Skill 方法调用协议。
- 区分 Agent 原生 Skill 意图发现、产品入口内部路由、能力依赖与 Agent 执行协作。
- 明确 capability binding 只选择 provider，不自动让顶层 provider 被 Agent 命中；替换顶层入口时必须同步保证 runtime 可发现性并消除触发歧义。
- 更新工作能力适配 Skill 的判断语言，避免把“被调用”作为创建 contract 的充分条件。
- 使用 `buildr.git-task-integration/v1` 展示 contract、manifest、provider、consumer、binding、runtime evidence 与 Agent 执行的完整结构。
- 不新增 manifest 字段、dispatch API、调用 DSL 或 runtime 执行引擎，不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `skill-capability-contracts`: 增加 Agent Skill 意图发现、能力目录、consumer dependency graph、产品入口内部路由和 Agent 执行协作的分层语义，明确 capability dependency 不等于 Skill 方法调用。

## Impact

- `openspec/specs/skill-capability-contracts/spec.md`
- `docs/skill-capability-contracts.md`
- `package/targets/runtime/skills/buildr/SKILL.md`
- `package/targets/workspace/skills/buildr/capability-adaptation/SKILL.md`
- `tools/cli/application/package-maintenance/static-validation.mjs`
- 对应 package/static validation 与自然语言测试仅在现有断言需要同步时调整。
