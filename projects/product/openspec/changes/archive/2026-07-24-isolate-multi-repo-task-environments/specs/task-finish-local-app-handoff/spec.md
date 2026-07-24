## MODIFIED Requirements

### Requirement: Task Finish 必须隔离其他任务的 Local App preview
task-finish MUST 根据 preview owner task environment 区分当前任务、默认 Local App 与其他任务预览。当前 environment 拥有的健康 preview 必须在 environment 删除前经认证停止并确认不再健康；其他 environment 拥有的 preview MUST 保持运行，且不得被迁移、停止或清理。

#### Scenario: 收尾当前任务拥有的 preview
- **WHEN** 即将清理的 task environment 拥有健康 preview
- **THEN** task-finish MUST 使用该 preview 的受认证停止流程关闭它
- **AND** MUST 在删除任一仍被 preview 使用的 repository worktree 前确认该 preview 不再健康且其状态记录已被安全清理

#### Scenario: 收尾时存在其他任务 preview
- **WHEN** preview list 中存在 owner environment 不等于当前 task environment 的健康 preview
- **THEN** task-finish MUST 保持该 preview 运行
- **AND** MUST NOT 将它迁移到主 checkout、重新分配端口或删除其状态目录
- **AND** 最终报告 MUST 将其标记为未触碰的并发实例

#### Scenario: 当前任务 preview 无法停止
- **WHEN** 当前 task environment 拥有的健康 preview 无法通过认证停止或停止后仍保持健康
- **THEN** task-finish MUST 停止删除该 environment 的 repository worktrees 与本地任务分支
- **AND** MUST 保留 environment/preview identity、失败原因和恢复动作

## ADDED Requirements

### Requirement: Task Finish 必须按 task environment repository set 收尾
当任务包含多个 Git repositories 时，task-finish MUST 以同一 environment receipt 为边界逐仓核对候选、验证、目标 integration branch、提交和集成状态；只有全部 required repositories 安全完成且 task-owned 本机资源已处理后，才能清理 environment。

#### Scenario: 多仓任务全部可收尾
- **WHEN** environment 的全部 required repositories 都有匹配候选 evidence、改动属于当前任务、目标分支唯一且集成前置条件满足
- **THEN** task-finish MUST 向用户一次披露逐仓提交/集成/推送计划和 environment cleanup 范围
- **AND** MUST 逐仓调用 selected providers 并保留每项 result evidence
- **AND** 全部成功后 MUST 按 nested repositories 后 root 的顺序清理 environment

#### Scenario: 一个 repository 无法消歧
- **WHEN** 任一 repository 的目标分支、远端、任务改动、验证 evidence 或 integration state 无法确认
- **THEN** task-finish MUST 停止尚未执行的破坏性动作并保留整个 environment
- **AND** MUST 报告阻塞 repository 与其他 repositories 已完成/未执行的实际状态

#### Scenario: 多仓远端操作部分成功
- **WHEN** 一个 repository 已成功 push、后续 repository push 失败或远端发生竞争更新
- **THEN** task-finish MUST NOT 回滚、force push 或隐藏已经成功的远端状态
- **AND** MUST 保留 task environment，报告逐仓远端 ref 和安全恢复路径

#### Scenario: 其他 task environment 使用相同 source repositories
- **WHEN** 同一 source repository 还存在其他 task environments 的 worktrees 或 branches
- **THEN** task-finish MUST 只集成和清理当前 environment receipt 中的 checkout/branch/resources
- **AND** MUST NOT 停止、迁移、删除或改写其他 environment 的任何成员
