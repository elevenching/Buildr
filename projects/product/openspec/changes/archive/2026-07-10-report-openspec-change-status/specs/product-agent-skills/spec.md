## MODIFIED Requirements

### Requirement: 任务工作流必须显式可见
Buildr task 和 OpenSpec Skills MUST 在改变 task state 前，以及已报告状态发生实质变化时，明确 workflow selection、task location 和当前 OpenSpec change status。

#### Scenario: 使用 OpenSpec 前说明 change
- **WHEN** Agent 决定 create、explore、apply、sync 或 archive OpenSpec change
- **THEN** Agent MUST 在执行动作前说明正在使用 OpenSpec
- **AND** Agent MUST 在已知时尽快明确 change id、resolved change path 和 intended action

#### Scenario: 采用 OpenSpec 时说明当前 change 状态
- **WHEN** task triage 选择或继续 OpenSpec change-flow
- **THEN** Agent MUST 在面向用户的回复中包含当前 change status
- **AND** status MUST 在已知时标识 change id、resolved change path、current action，以及 change 是 planned、active、blocked、apply-ready、complete 还是 archived
- **AND** 在可用时，status MUST 汇总 artifact 或 task progress，并明确 next executable action 或 blocking reason
- **AND** Agent MUST 在首次采用 OpenSpec、状态发生实质变化、工作暂停或完成，或用户询问进度时刷新该 status

#### Scenario: 创建或复用 task worktree 前说明位置
- **WHEN** Agent 决定 create 或 reuse task worktree
- **THEN** Agent MUST 在 task edits 前说明正在创建还是复用 worktree
- **AND** Agent MUST 明确当前 Buildr workspace root、task id、worktree path 和 task branch

#### Scenario: Task worktree canonical location
- **WHEN** Agent 在 Buildr workspace 中创建 task worktree
- **THEN** 其 canonical path MUST 为 `<workspace-root>/.worktrees/<task-id>`
- **AND** Agent MUST NOT 静默回退到 `/tmp` 或其他任意位置
- **AND** 同一 task MUST reuse 其现有 worktree
- **AND** multi-repository task MUST 使用 repo-qualified task ids 避免 path collisions

#### Scenario: Task worktree lifecycle remains a Skill concern
- **WHEN** Buildr 打包 task worktree guidance
- **THEN** placement、disclosure、reuse、retention 和 cleanup procedures MUST 保留在 task Skills 中
- **AND** required Core Rule MUST NOT 复制 worktree operation manual
