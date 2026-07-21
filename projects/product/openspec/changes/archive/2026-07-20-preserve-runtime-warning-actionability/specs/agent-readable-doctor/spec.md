## MODIFIED Requirements

### Requirement: doctor 分离兼容成功状态与 readiness
Buildr doctor MUST 保留 `ok` 的既有无 error 语义，并独立报告 workspace validity、readiness 与 action requirement；聚合 finding MUST 保留其来源 findings 的 actionability。

#### Scenario: 只有 actionable warning
- **WHEN** doctor 没有发现 error 但发现至少一个需要用户行动的 warning
- **THEN** `ok` MUST 为 true
- **AND** `health.workspaceValid` MUST 反映 canonical workspace identity
- **AND** `health.ready` MUST 为 false
- **AND** `health.actionRequired` MUST 为 true
- **AND** `health.actionableCount` MUST 包含该 warning

#### Scenario: workspace 可直接继续工作
- **WHEN** canonical workspace identity 有效且不存在需要用户行动的 warning 或 error
- **THEN** `health.workspaceValid` MUST 为 true
- **AND** `health.ready` MUST 为 true
- **AND** `health.actionRequired` MUST 为 false

#### Scenario: 非行动信息不降低 readiness
- **WHEN** finding 明确设置 `userActionRequired: false`
- **THEN** 该 finding MUST NOT 计入 `health.actionableCount`
- **AND** 该 finding MUST NOT 单独使 `health.ready` 变为 false

#### Scenario: 聚合全部非行动型 runtime warnings
- **WHEN** 某个 scope/adapter 的全部 runtime warnings 都明确设置 `userActionRequired: false`
- **THEN** 顶层 runtime warning MUST 保留 warning severity 和来源诊断摘要
- **AND** 顶层 runtime warning MUST 设置 `userActionRequired: false`
- **AND** `health.ready` MUST NOT 因该聚合 warning 变为 false
- **AND** `repairPlan` 和 `nextSteps` MUST NOT 为该聚合 warning 生成修复动作

#### Scenario: 聚合混合 runtime warnings
- **WHEN** 某个 scope/adapter 同时包含行动型与非行动型 runtime warnings
- **THEN** 顶层 runtime warning MUST 设置 `userActionRequired: true`
- **AND** 顶层 finding MUST 保留全部来源 warning codes
- **AND** `health.actionRequired` MUST 为 true
