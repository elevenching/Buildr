## ADDED Requirements

### Requirement: doctor 严格验证 canonical workspace identity
Buildr doctor MUST 使用 canonical workspace 必要资产判断 workspace validity，并区分有效、不完整与不存在。

#### Scenario: canonical workspace identity 有效
- **WHEN** 根 `AGENTS.md`、`.buildr/workspace.yml` 和 `projects/` 均存在
- **THEN** doctor MUST 将 workspace identity 报告为 `valid`
- **AND** `workspace.initialized` MUST 为 true

#### Scenario: workspace identity 不完整
- **WHEN** 目标目录存在部分但不是全部 canonical workspace 必要资产
- **THEN** doctor MUST 将 workspace identity 报告为 `incomplete`
- **AND** `workspace.initialized` MUST 为 false
- **AND** doctor MUST 报告缺失的必要资产和可执行的初始化或恢复建议

#### Scenario: workspace identity 不存在
- **WHEN** 目标目录不存在任何 canonical Buildr workspace 痕迹
- **THEN** doctor MUST 将 workspace identity 报告为 `absent`
- **AND** doctor MUST 报告 workspace 未初始化

### Requirement: doctor 分离兼容成功状态与 readiness
Buildr doctor MUST 保留 `ok` 的既有无 error 语义，并独立报告 workspace validity、readiness 与 action requirement。

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

### Requirement: doctor 声明默认与专项诊断层级
Buildr doctor MUST 在 Agent-readable 结果中声明默认核心、条件通用和显式专项诊断边界。

#### Scenario: 默认 doctor 输出诊断 profile
- **WHEN** Agent 运行 `buildr doctor --json`
- **THEN** JSON MUST 区分 `core`、`conditional` 和 `specialty` 诊断层级
- **AND** 条件通用检查 MUST 仅在相关资产、scope 或 runtime adapter 适用时执行

#### Scenario: 默认 doctor 保持轻量
- **WHEN** 用户没有显式进入专项诊断
- **THEN** doctor MUST NOT 检查 Git dirty、ahead 或 behind 状态
- **AND** doctor MUST NOT 深检 OpenSpec active change
- **AND** doctor MUST NOT 运行 build 或 test

#### Scenario: finding 需要专项检查
- **WHEN** 默认 doctor 只能识别某类问题而不能完成场景化验证
- **THEN** diagnostic profile 或 repair guidance MUST 指向适用的已有专项命令或明确的专项场景
- **AND** doctor MUST NOT 为不存在的统一命令生成虚假命令

### Requirement: doctor 输出根因化 repair plan
Buildr doctor MUST 从 actionable findings 生成有优先级、去重且 Agent-readable 的 repair plan，并保留兼容的 `nextSteps`。

#### Scenario: 多个 findings 共享修复动作
- **WHEN** 多个 actionable findings 具有相同 commands 集合或相同 suggestion
- **THEN** `repairPlan` MUST 合并为一个 repair step
- **AND** repair step MUST 保留所有关联 finding codes
- **AND** `nextSteps` MUST NOT 重复该动作

#### Scenario: error 与 warning 同时存在
- **WHEN** actionable error 和 warning 同时存在
- **THEN** error 对应 repair step MUST 排在 warning 对应步骤之前
- **AND** 每个 repair step MUST 标识其 priority

#### Scenario: finding 不要求用户行动
- **WHEN** finding 的 `userActionRequired` 为 false 或没有可执行 suggestion/commands
- **THEN** 该 finding MUST NOT 产生 repair step

### Requirement: doctor 抑制未登记 Project 的派生噪音
Buildr doctor MUST 将 Project registry 作为 Project baseline 和 Service metadata 诊断的前置事实。

#### Scenario: orphan Project directory 只有登记根因
- **WHEN** materialized Project directory 未在 `projects/manifest.yml` 登记
- **THEN** doctor MUST 报告 `projects.unregistered` 根因
- **AND** doctor MUST NOT 同时为该目录报告 Project baseline incomplete
- **AND** doctor MUST NOT 同时为该目录报告 Service manifest missing

#### Scenario: Project 登记后继续下游诊断
- **WHEN** Project directory 已在 registry 登记
- **THEN** doctor MUST 按现有契约继续检查 Project baseline 和 Service metadata
