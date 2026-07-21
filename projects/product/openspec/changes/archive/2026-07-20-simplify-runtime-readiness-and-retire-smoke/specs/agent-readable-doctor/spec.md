## MODIFIED Requirements

### Requirement: doctor remains backward compatible without Agent filter
Buildr doctor MUST 保持未传 Agent runtime filter 的公开调用兼容性，但 MUST NOT 将全部 supported adapters 解释为当前 workspace 已安装或必须维护的 runtime。

#### Scenario: Doctor without Agent filter
- **WHEN** 调用方运行 `buildr doctor --target <root> --json` 且不传 `--agent`
- **THEN** doctor MUST 从 Buildr managed marker、projection receipt 或等价受管证据发现当前 workspace 的 present runtime inventory
- **AND** doctor MUST 只运行 present adapters 的 runtime diagnostics
- **AND** doctor JSON MUST 报告实际 `detectedAgents` 和 `checkedAgents`
- **AND** Buildr onboarding guidance MUST 在 Agent identity 已知后优先传入 `--agent <agent>`

#### Scenario: Supported adapter 在 workspace 中不存在
- **WHEN** 一个 adapter 位于 supported registry，但 workspace 没有该 adapter 的受管投射证据
- **THEN** 默认 doctor MUST NOT 对该 adapter 运行 checker
- **AND** MUST NOT 为该 adapter 生成 missing、stale、warning、repair plan 或 nextSteps

#### Scenario: Present runtime 未被选为当前 Agent
- **WHEN** 默认 doctor 发现一个 present runtime 的投射 drift，但调用方没有显式选择该 adapter
- **THEN** doctor MAY 在 runtime inventory 中保留该 drift evidence
- **AND** 顶层聚合 finding MUST 设置 `userActionRequired: false`
- **AND** 该 drift MUST NOT 单独降低通用 workspace `health.ready`

### Requirement: doctor 分离兼容成功状态与 readiness
Buildr doctor MUST 保留 `ok` 的既有无 error 语义，并独立报告 workspace validity、readiness 与 action requirement；聚合 finding MUST 保留其来源 findings 的 actionability，且只有通用 workspace/source 检查或显式 selected runtime 的 actionable finding 能降低当前 readiness。

#### Scenario: Selected runtime 存在 actionable warning
- **WHEN** doctor 显式选择 runtime，且该 runtime 没有 error 但存在至少一个需要用户行动的 warning
- **THEN** `ok` MUST 为 true
- **AND** `health.workspaceValid` MUST 反映 canonical workspace identity
- **AND** `health.ready` MUST 为 false
- **AND** `health.actionRequired` MUST 为 true
- **AND** `health.actionableCount` MUST 包含该 warning

#### Scenario: workspace 可直接继续工作
- **WHEN** canonical workspace identity 有效且通用检查及 selected runtime 不存在需要用户行动的 warning 或 error
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

#### Scenario: Selected runtime 聚合混合 warnings
- **WHEN** selected runtime 的某个 scope 同时包含行动型与非行动型 runtime warnings
- **THEN** 顶层 runtime warning MUST 设置 `userActionRequired: true`
- **AND** 顶层 finding MUST 保留全部来源 warning codes
- **AND** `health.actionRequired` MUST 为 true

#### Scenario: 未选中 runtime 聚合混合 warnings
- **WHEN** 默认 inventory diagnostics 在未选中 runtime 中发现行动型与非行动型 runtime warnings
- **THEN** 顶层 inventory warning MUST 设置 `userActionRequired: false`
- **AND** MUST NOT 进入 `repairPlan` 或 `nextSteps`
- **AND** `health.ready` MUST NOT 因该 runtime 变为 false
