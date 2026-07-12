## ADDED Requirements

### Requirement: doctor 提供 Agent-readable 诊断
Buildr MVP MUST 支持 `buildr doctor --json` 输出 Agent-readable 的结构化诊断结果。

#### Scenario: Agent 请求结构化诊断
- **WHEN** Agent 调用 `buildr doctor --json`
- **THEN** Buildr MUST 输出可被 Agent 稳定解析的 JSON 诊断结果

#### Scenario: 人类查看诊断
- **WHEN** 用户直接调用 `buildr doctor`
- **THEN** Buildr MAY 输出人类可读诊断文本

### Requirement: doctor 检查 workspace 和层级状态
Buildr MVP MUST 诊断 workspace、Organization、Project 和 Service 的基础状态。

#### Scenario: workspace 未初始化
- **WHEN** 当前目录不是有效 Buildr workspace
- **THEN** `doctor` MUST 报告 workspace 未初始化并提供初始化建议

#### Scenario: 项目资产缺失
- **WHEN** Organization 或 Project 资产目录缺失
- **THEN** `doctor` MUST 报告缺失层级和建议的创建动作

### Requirement: doctor 检查 service metadata 和 repo 状态
Buildr MVP MUST 诊断 service metadata 与本地 service repo 的一致性。

#### Scenario: metadata 声明的 repo 缺失
- **WHEN** service metadata 声明某个 Git repo 但本地路径不存在
- **THEN** `doctor --json` MUST 报告该 service repo 缺失，并给出可供 Agent 引导 clone 的建议

#### Scenario: repo remote 不匹配
- **WHEN** 本地 service repo 的 remote 与 metadata 记录不一致
- **THEN** `doctor --json` MUST 报告不一致状态和修复建议

#### Scenario: 外部本地路径不可访问
- **WHEN** service metadata 记录的外部本地路径不可访问
- **THEN** `doctor --json` MUST 报告路径不可访问并提示用户确认新路径

### Requirement: doctor 检查 Git 忽略和 runtime 状态
Buildr MVP MUST 诊断 workspace Git 忽略关系和 Agent runtime 投射状态。

#### Scenario: 嵌套 repo 未被忽略
- **WHEN** service repo 嵌套在 workspace 中但未被 workspace `.gitignore` 忽略
- **THEN** `doctor` MUST 报告该风险并建议更新忽略规则

#### Scenario: runtime bridge stale
- **WHEN** Agent runtime 桥接文件存在但已过期或不是 Buildr 管理产物
- **THEN** `doctor` MUST 报告 runtime 状态并建议重新 render 或迁移资产源
