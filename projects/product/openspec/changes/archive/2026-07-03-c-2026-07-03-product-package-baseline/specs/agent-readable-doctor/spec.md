## MODIFIED Requirements

### Requirement: doctor 检查 workspace 和层级状态
Buildr MVP MUST 诊断 Buildr root、Project、shared service 和 Service 的基础状态。

#### Scenario: workspace 未初始化
- **WHEN** 当前目录不是有效 Buildr root
- **THEN** `doctor` MUST 报告 workspace 未初始化并提供初始化建议

#### Scenario: 项目资产缺失
- **WHEN** Project 资产目录缺失
- **THEN** `doctor` MUST 报告缺失层级和建议的创建动作

#### Scenario: legacy scope 不受支持
- **WHEN** Agent 使用 `organizations/<org>/...` scope 调用 `doctor`
- **THEN** `doctor` MUST 报告该 scope 不受支持，并提示使用根相对 scope
