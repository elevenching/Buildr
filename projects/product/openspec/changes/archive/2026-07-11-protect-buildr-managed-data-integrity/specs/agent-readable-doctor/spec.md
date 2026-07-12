## ADDED Requirements

### Requirement: doctor 报告 mutation transaction 状态
Buildr doctor MUST 检查 workspace mutation lock、transaction metadata、staging 和 backup，并以 Agent-readable finding 报告无法证明完成的操作。

#### Scenario: Workspace 没有残留 mutation
- **WHEN** workspace 不存在 active 或 incomplete mutation artifacts
- **THEN** doctor MUST NOT 报告 transaction error

#### Scenario: 发现不完整 transaction
- **WHEN** doctor 发现 lock、journal、staging 或 backup 表明 source mutation 未完整结束
- **THEN** doctor MUST 报告 error 和稳定 finding code
- **AND** finding MUST 包含 transaction id、operation、受影响路径、已知 phase 和不破坏 backup 的 next action

#### Scenario: 后续 mutation 被阻塞
- **WHEN** incomplete transaction 尚未恢复或明确清理
- **THEN** doctor MUST 标记 workspace source mutation 为 blocked
- **AND** runtime 只读诊断 MUST 仍可运行
