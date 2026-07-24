# Task Finish Local App Handoff

## Purpose

Define the safe Local App handoff required before task-finish cleans an integrated task worktree.

## Requirements

### Requirement: Task Finish 必须保留运行中 Local App 的端口
当 task-finish 需要将本机 Buildr 入口从即将清理的 task worktree 迁移到保留 checkout，且存在健康的 Local App 实例时，provider MUST 在停止旧实例前记录其已认证 loopback URL 与端口，并 MUST 使用同一端口启动保留 checkout 的新实例。

#### Scenario: 健康实例需要随收尾迁移
- **WHEN** 已集成的任务 worktree 仍是当前 Local App 或开发 CLI 的来源，且 `instance.json` 对应实例通过带 secret 的健康检查
- **THEN** task-finish MUST 在停止实例前解析并记录该实例的 loopback port
- **AND** MUST 先从保留 checkout 重装开发 CLI 与 development launcher
- **AND** MUST 使用 `buildr app --port <recorded-port> --no-open` 启动或复用新实例
- **AND** MUST 在删除 task worktree 前验证新实例仍监听该 port 且来源不再指向 task worktree

#### Scenario: 没有健康 Local App 实例
- **WHEN** 没有实例记录、记录无法通过健康检查，或当前实例不依赖即将清理的 task worktree
- **THEN** task-finish MUST 不虚构或保留端口
- **AND** MAY 按既有入口迁移与 worktree 清理流程继续

### Requirement: 同端口迁移失败必须阻止 cleanup
task-finish MUST 将端口交接视为 worktree cleanup 的前置条件；不得以随机端口、不同端口或只完成 CLI 重装替代成功的同端口迁移。

#### Scenario: 原端口无法重新启动
- **WHEN** 旧实例停止后，保留 checkout 无法在记录端口启动或无法通过健康检查
- **THEN** task-finish MUST 停止删除 task worktree 与本地任务分支的后续动作
- **AND** MUST 保留 task worktree、端口事实与失败原因
- **AND** MUST 报告不得使用新端口替代的原因和恢复路径

#### Scenario: 成功交接后的清理证据
- **WHEN** 新实例已经在记录端口健康运行且其 CLI 入口解析到保留 checkout
- **THEN** task-finish MAY 删除已集成且干净的 task worktree
- **AND** 最终报告 MUST 包含迁移前后端口、入口来源、实例健康结果和 cleanup 结果

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
