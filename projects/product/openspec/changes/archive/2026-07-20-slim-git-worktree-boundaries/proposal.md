## Why

独立 `task-verification` capability 已接管验证政策、Candidate evidence 和复用判断，但 `git-ops`、`task-worktree` 及其静态验证仍保留部分旧的验证执行与证据失效叙述，造成职责重复，`task-worktree` 中还出现了重复段落。现在需要在不合并 Skill、不改变 binding 的前提下收紧交接边界，让每个 provider 只描述自身必须提供的事实和结果证据。

本 change 不包含破坏性变更；现有 capability identity、version、provider 和 binding 均保持不变。

## What Changes

- 精简 `git-ops` 的候选集成说明：保留 Git 策略、tree 对比和 transition evidence，将验证执行、evidence 有效性与重跑决策明确交给 selected `buildr.task-verification/v1` provider/consumer。
- 精简 `task-worktree` 的候选交接说明：只返回 canonical checkout、clean/dirty 状态、candidate identity 和 checkout transition evidence，不承担内容编辑来源判断或验证 policy。
- 删除 `task-worktree` 当前重复的自举 sync/CLI 入口段落，并避免在 Guardrails 重复正文已明确的 provider policy。
- 调整 capability contract、产品说明、OpenSpec requirements、静态校验和专项测试，使职责边界由结构化断言保护，而不是依赖冗长的逐字文本。
- 补齐前序任务验证 change 归档后遗留的 canonical spec Purpose 占位文本，不改变其 Requirements。
- 保持 `git-ops`、`task-worktree`、`task-verification` 和 `task-finish` 的现有 capability/binding 拓扑及可替换性。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-task-workflows`: 明确 Git integration、worktree lifecycle 与 task verification 之间只交接 candidate identity/transition evidence，不跨层复制验证决策。
- `buildr-package-assets`: 验证随包 Skills 的精简职责、无重复段落及既有 capability/binding 拓扑保持不变。

## Impact

- Product package Skills：`git-ops`、`task-worktree`。
- Capability contract：`buildr.git-task-integration/v1` 的职责澄清，不改变 identity、version 或最低安全保证。
- 产品文档与 canonical OpenSpec：Skill capability 协作说明。
- 关联 spec maintenance：补齐 `task-verification` 的当前能力 Purpose，不改变 requirement identity 或行为。
- 静态 package verifier 和相关 contract tests。
- 不修改 CLI 命令行为，不新增或移除 provider，不改变 workspace manifest binding。
