## ADDED Requirements

### Requirement: Task Finish 必须隔离其他任务的 Local App preview
task-finish MUST 根据 preview owner worktree 区分当前任务、默认 Local App 与其他任务预览。当前任务拥有的健康 preview 必须在 worktree 删除前经认证停止并确认不再健康；其他 worktree 拥有的 preview MUST 保持运行，且不得被迁移、停止或清理。

#### Scenario: 收尾当前任务拥有的 preview
- **WHEN** 即将清理的 task worktree 拥有健康 preview
- **THEN** task-finish MUST 使用该 preview 的受认证停止流程关闭它
- **AND** MUST 在删除 worktree 前确认该 preview 不再健康且其状态记录已被安全清理

#### Scenario: 收尾时存在其他任务 preview
- **WHEN** preview list 中存在 owner worktree 不等于当前任务 worktree 的健康 preview
- **THEN** task-finish MUST 保持该 preview 运行
- **AND** MUST NOT 将它迁移到主 checkout、重新分配端口或删除其状态目录
- **AND** 最终报告 MUST 将其标记为未触碰的并发实例

#### Scenario: 当前任务 preview 无法停止
- **WHEN** 当前任务拥有的健康 preview 无法通过认证停止或停止后仍保持健康
- **THEN** task-finish MUST 停止删除该 task worktree 与本地任务分支
- **AND** MUST 保留 preview identity、失败原因和恢复动作
