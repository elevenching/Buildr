## Context

Git Ops Skill 当前明确了 commit、push、merge、rebase 的授权边界，但没有规定任务分支与目标分支分叉后的默认集成方式。缺少默认值时，Agent 可能通过 merge 解决分叉并把 merge commit 带入目标分支，即使任务提交尚未推送、完全可以安全 rebase。

## Goals / Non-Goals

**Goals:**

- 本地未推送任务分支默认 rebase 到最新目标分支。
- 目标分支只通过 fast-forward 集成任务分支。
- merge commit 必须由用户当前轮次明确要求。
- 保持现有 commit、push、rebase 和远端改写授权边界。

**Non-Goals:**

- 不修改 Git 配置或服务端保护规则。
- 不自动 rebase 已推送或多人共享分支。
- 不规定所有仓库必须 squash 为单提交。

## Decisions

### 1. 本地未推送任务分支采用 rebase-first

Agent 在集成前先 fetch。目标分支出现新提交且任务提交未推送时，默认在任务分支执行 `rebase <latest-target>`，然后重新验证。相比 merge，这能保留线性历史且不会改写远端状态。

### 2. 目标分支只接受 fast-forward

任务分支完成 rebase 后，目标分支使用 fast-forward-only 集成。若无法 fast-forward，说明事实状态已变化，必须停止并重新检查，而不是自动创建 merge commit。

### 3. 共享分支和冲突保留人工决策

任务提交已经推送或分支被多人共享时，rebase 会改写协作历史，仍需用户明确授权。rebase 冲突若仅是机械路径迁移可以保留双方语义解决；涉及业务取舍时停止并报告。

## Risks / Trade-offs

- [rebase 后需要重新验证] → Skill 明确把验证作为集成前完成条件。
- [远端持续前进导致重复 rebase] → push 前再次 fetch；状态变化时停止并刷新事实。
- [仓库明确要求 merge commit] → 用户或项目规则可显式覆盖默认策略。

## Migration Plan

更新 Git Ops Skill、验证脚本和 specs；通过 Buildr sync 更新自举 workspace。该变更只影响后续 Agent 行为，无历史数据迁移。

## Open Questions

无。
