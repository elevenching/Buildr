## ADDED Requirements

### Requirement: Task Finish 必须报告可信的完整验证 timing 证据
Buildr `task-finish` MUST 消费最终完整 Candidate verification 的 timing summary，并将其作为收尾 Result Evidence 的一部分。

#### Scenario: 最终 Candidate 验证成功
- **WHEN** `task-finish` 使用当前候选 tree 的成功 Candidate 验证作为收尾证据
- **THEN** `task-finish` MUST 从验证输出读取 timing summary 路径并解析 summary
- **AND** MUST 核对 summary status、run kind 和 source identity 与当前 worktree/候选证据一致
- **AND** 最终收尾报告 MUST 说明总耗时、最慢阶段、失败阶段（成功时为无）和 summary 路径

#### Scenario: timing summary 不可信
- **WHEN** summary 缺失、不可读、已被其他 run 覆盖或 source identity 无法匹配当前候选
- **THEN** `task-finish` MUST NOT 引用其他 run 的耗时或根据并行 step 耗时推算整体 wall-clock
- **AND** 在仍可安全重跑完整验证时 MUST 重新生成可信 Candidate timing evidence
- **AND** 无法重跑时 MUST 将 timing evidence 缺口作为剩余风险如实报告

#### Scenario: 只有 Changed timing
- **WHEN** 当前任务只有 Changed verification timing 而没有可信的最终 Candidate timing
- **THEN** `task-finish` MUST NOT 将 Changed summary 表述为完整 Candidate 验证耗时
