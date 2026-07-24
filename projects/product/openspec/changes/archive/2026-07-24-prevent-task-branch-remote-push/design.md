## Context

`task-finish` 编排 Git 任务集成，而 `git-ops` 是 `buildr.git-task-integration/v1` 的默认 provider。当前规则禁止“自动创建远端分支”，但收尾中的“推送”没有把目标分支与任务分支明确区分，执行者可能把本地任务分支也作为常规收尾步骤推送。

## Goals / Non-Goals

**Goals:**

- 收尾默认只推送已完成集成的目标分支。
- 将远端任务分支视为独立、需当前轮次明确说明的写入动作。
- 在 provider contract、编排 Skill 与静态测试中一致表达该保证。

**Non-Goals:**

- 不改变本地任务分支、worktree 清理或远端分支删除策略。
- 不取消用户明确要求的 PR、远程备份、交接或发布分支推送。
- 不新增或替换 capability provider、binding 或 Git 命令。

## Decisions

1. 在 `buildr.git-task-integration/v1` 的最小保证中加入默认远端范围。这样 `task-finish` 即使与兼容的替代 Git provider 组合，也能依赖相同的安全边界。
2. `task-finish` 只声明并传递默认目标分支推送，不复制 provider 的 Git 实现策略；`git-ops` 在自身远端默认行为中落实这一限制。
3. 用 package 静态校验和契约测试检查三个层次的关键语义，避免仅修改文字而没有随包行为证据。

## Risks / Trade-offs

- [用户实际需要远端任务分支时被默认阻止] → 用户在当前轮次明确说明 PR、交接、远程备份或指定任务分支后，provider 可以披露并执行该推送。
- [不同 provider 的实现偏离] → contract 将“默认只推送目标分支”设为最小保证，替代 provider 必须满足该保证。
