## Context

Buildr 已用 `contracts`、`provides`、`requires`、`bindings` 和 runtime routing evidence 管理首批六个能力。当前数据模型能够解析 consumer 依赖，但自然语言文档仍可能让维护者把它理解为 Skill-to-Skill 方法调用系统，并错误地把产品入口 Buildr Skill 当成所有用户意图的全局 dispatcher。

## Goals / Non-Goals

**Goals:**

- 用统一术语区分 Agent Skill 意图发现、能力目录、consumer dependency graph、产品入口内部路由和 Agent 执行协作。
- 明确 contract 是最低保证与结果证据的 interface，不是调用签名或执行协议。
- 提供一个可从源资产追踪到 runtime 和实际执行的完整实例。
- 明确替换顶层入口 provider 时，binding 与 runtime 可发现性必须共同收敛。

**Non-Goals:**

- 不新增 `invokes`、routing dependency 或 dispatch 字段。
- 不改变 resolver、binding、readiness 或 runtime projection 行为。
- 不把未迁移 Skill 强制 capability 化。

## Decisions

### 1. 使用“依赖保证”而不是“调用 Skill”

consumer 只声明无法安全继续时真正依赖的 capability guarantees 和 result evidence。Agent 负责解析 provider、读取 playbook、执行工具并判断结果；provider 不是由 consumer 以确定性函数调用方式执行。

### 2. 明确五种关系

- Agent Skill 意图发现：Agent runtime 暴露 Skill description，Agent 根据用户目标选择并加载入口 Skill；Buildr CLI 不拦截 prompt，也不在任务执行时运行全局 dispatcher。
- 能力目录：已登记、可提供和可绑定的全部 contracts。
- consumer dependency graph：只包含 manifest `requires` 形成的 required/optional 边。
- 产品入口内部路由：只有 Buildr Skill 已经因 Buildr 管理意图被加载时，它才根据当前用户意图选择相关 capability，不把自身登记为依赖全部能力的 consumer。
- Agent 执行协作：Agent 读取 contract、selected provider 和任务上下文完成真实动作，不进入静态 manifest 调用图。

不为五种关系新增 dispatch 数据结构；现有 Skill description、manifest、doctor graph 和 runtime evidence 已能表达本 change 范围内的产品行为。

### 3. 完整实例使用 Git 任务集成

`buildr.git-task-integration/v1` 同时具有真实 provider、真实 consumer 和显式 binding，最适合展示 contract Markdown、manifest 声明、resolver、runtime evidence 与 `task-finish` 实际编排之间的关系。

### 4. 顶层入口替换需要同时维护可发现性

binding 只决定 capability 解析到哪个 provider，不参与 Agent runtime 的首次 Skill description 匹配。若替换 `buildr.task-finish/v1` 这类顶层入口 provider，能力适配必须同时确保 selected provider 已投射到 runtime、description 覆盖对应用户意图，并处理旧入口造成的歧义。普通 `task-finish` 依赖的 Git provider 替换不需要改变“收尾”入口 description。

## Risks / Trade-offs

- [文档术语与既有实现漂移] → 用静态自然语言断言和 OpenSpec strict validation 固化关键表述。
- [完整实例被误解为固定 Git 策略] → 明确 merge/rebase/PR 等位于 provider 的 `Allowed Variations` 内，不属于 contract 固定内容。
- [binding 被误解为全局意图 dispatcher] → 在产品说明、Buildr Skill 和能力适配 Skill 中明确首次入口由 Agent 原生 Skill 匹配负责。
- [顶层 provider 改绑后 Agent 仍命中旧入口] → 激活前验证 selected provider 的 runtime 可发现性和 description 歧义。
- [为了分类新增冗余模型] → 明确本 change 只澄清现有结构，不修改 schema 或 runtime。
