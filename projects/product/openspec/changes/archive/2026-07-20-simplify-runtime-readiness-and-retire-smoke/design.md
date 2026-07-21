## Context

Buildr 当前有三种彼此独立但实现上混合的 runtime 事实：静态 supported adapter registry、workspace 中实际存在的受管投射，以及当前 Agent 选择。`doctor --agent` 已能正确过滤到当前 adapter，但无参数兼容模式会遍历全部 supported adapters，把不存在的 runtime 当成 stale；TRAE Work descriptor 又把尚未完成 marker smoke 固化为无条件 prerequisite。另一方面，WorkBuddy 的一次历史 headless smoke 被写入 descriptor 并由 Candidate 断言，但 Candidate 并不会重新运行真实产品，因此该字段只是不可持续的版本快照。

本 change 暂时撤下 Agent runtime marker smoke 整体模型。npm release smoke、package smoke 和 workspace lifecycle E2E 属于不同验证 owner，不受影响。

## Goals / Non-Goals

**Goals:**

- supported、present 和 selected runtime 三个集合保持独立。
- 显式 `--agent` 继续成为当前任务 readiness 的权威口径。
- 无 `--agent` doctor 只诊断可由 Buildr managed marker 或 receipt 证明已存在的 runtime，并把未选中 runtime 作为 inventory evidence，不让其 drift 阻塞通用 workspace readiness。
- 删除全部 Agent marker smoke generator、状态字段、WorkBuddy 快照和 TRAE Work smoke prerequisite。
- 保留全部 adapter 的自动 descriptor、plan、projection、checker、完整 Skill inventory、安全清理和幂等验证。

**Non-Goals:**

- 不删除任何 supported adapter，也不改变 render/sync 目标格式。
- 不在本 change 重新设计真实 GUI/CLI Agent smoke、证据保存或版本失效策略。
- 不通过应用安装状态猜测 workspace 正在使用某个 runtime。
- 不把普通 `.agents`、`.trae` 等目录存在本身视为 Buildr runtime 证据。

## Decisions

### 1. 以受管证据发现 present runtime

默认 doctor 从 adapter RuntimePlan 的 expected targets 中识别 Buildr-managed marker、adapter-specific projection receipt 或 skill satisfaction evidence。只有至少一个当前受管投射证据存在时，adapter 才属于 present runtime inventory。共享 `.agents` root、普通 vendor 目录或已安装应用都不足以确定 workspace runtime identity。

备选方案是按目录名或 installation probe 发现；`.agents` 被 Codex、Cursor 和 TRAE 共享，`.trae` 也可能保存普通产品数据，应用安装更不代表该 workspace 已 render，因此不采用。

### 2. selected runtime 与 inventory diagnostics 分离 actionability

传入 `--agent` 时只运行 selected adapter checker，保留现有修复命令和 actionability，并由其 findings 参与 `health.ready`。未传 `--agent` 时只检查 present adapters，保留投射状态作为 inventory evidence，但 runtime 聚合 finding 显式 `userActionRequired: false`，不进入 repair plan，也不降低通用 workspace readiness。JSON 保留兼容字段，并增加实际 `checkedAgents`/`detectedAgents` 证据。

如果调用方需要某个 runtime 的可操作结论，必须传入 `--agent <agent>`；Buildr Skill 和 onboarding 已采用这一入口。

### 3. smoke 作为整体模型下线而非降级为品牌例外

删除 `verificationLevel`、`smokeStatus`、`smoke` 快照、TRAE Work smoke prerequisite、smoke workspace generator 及 Candidate step。Adapter descriptor 只保留 Rules/Skills/activation 所依据的独立文档、源码或本机 intake provenance；这些证据支持 adapter contract，但不声称真实 Agent 已加载当前 workspace。

WorkBuddy 不再保留 `verified/passed` 特例，TRAE Work 也不再因 `pending` 生成 runtime warning。未来如果恢复 smoke，必须一次性设计证据版本、surface、失效条件、执行 owner 和当前机器配置的独立模型。

### 4. 自动验证继续覆盖 Buildr 可负责的边界

`runtime-adapter-contract` 继续遍历全部 supported descriptors；`runtime-adapter-parity` 继续在临时 workspace 验证完整目录投射、receipt、doctor 识别、安装/render/check、幂等、orphan、uninstall/restore、symlink 和 Git boundary。只移除无法在 Candidate 中真实重放的 marker smoke generator，不削减 Buildr 文件系统与 CLI 契约覆盖。

## Risks / Trade-offs

- [默认 doctor 不再提示未选中 runtime 的修复动作] → JSON 保留 detected/checked inventory；使用该 Agent 时运行显式 `doctor --agent` 获得 actionable 诊断。
- [旧 workspace 没有新版 receipt] → 同时识别 Buildr-managed Rules/Skill marker；普通目录和外部文件不会被误判。
- [删除 WorkBuddy smoke 后兼容信心表述下降] → 保留来源 provenance 与自动 contract/parity；不再把一次历史版本快照包装成持续保证。
- [未来重新引入 smoke 需要迁移] → 本 change 删除状态字段而不是保留半成品，未来通过独立 OpenSpec change 重新建立完整模型。
