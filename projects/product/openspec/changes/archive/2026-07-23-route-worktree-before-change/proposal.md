## Why

Buildr 已要求实现型 OpenSpec change 在 propose 前完成 task worktree 决策，但该约束只存在于 `task-worktree` 和产品规格中，`task-triage` 没有输出独立的执行位置判断，直接命中 `openspec-propose` 时也没有写入前门禁，导致 Agent 可能先在主开发 workspace 创建 artifacts，再撤销并迁移到 worktree。现在需要让执行位置判断成为 change 创建前的稳定路由步骤，避免重复写入和主 workspace 污染。

## What Changes

- 扩展 `task-triage`，在语义路径之外独立判断执行形态与任务位置，并在 `change-flow + implementation` 时先路由到 `task-worktree`。
- 扩展 Buildr 的 OpenSpec propose contribution，在任何 change artifact 写入前执行 worktree 兜底判断，直接命中 `openspec-propose` 也不能绕过。
- 保持 `task-worktree` 负责 checkout placement 和 lifecycle，不让它接管业务语义或 OpenSpec change 判断。
- 保留纯元内容任务直接维护 artifacts，以及元内容任务后来升级为实现任务时的单副本迁移路径。
- 增加 package 静态检查和组合场景测试，覆盖实现型 change、纯元内容 change、直接 propose、code-only 和任务升级场景。

本变更不包含破坏性变更，不新增 capability contract，也不让 `task-triage` 无条件依赖 worktree provider。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-task-workflows`: 明确 task triage 与 OpenSpec propose 在首次 artifact 写入前完成执行位置判断和 worktree 路由的要求。

## Impact

- 修改随包 `task-triage` Skill 源与 OpenSpec Component 的 propose contribution。
- 调整 package 静态校验、相关 contract/集成测试和 runtime 投射验证。
- 不修改上游 `openspec-propose` Skill 正文，不改变 `buildr.task-worktree-lifecycle/v1` contract、provider binding 或 CLI 接口。
