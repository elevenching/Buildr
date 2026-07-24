## ADDED Requirements

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
