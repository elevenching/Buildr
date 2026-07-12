## ADDED Requirements

### Requirement: Buildr 状态变更后必须 doctor 验证
Buildr required Core MUST 将 doctor 定义为已初始化 workspace 在 Buildr 状态变更后的统一完成条件。

#### Scenario: Workspace 源资产或 runtime 状态变更
- **WHEN** Agent 修改已初始化 workspace 的 Buildr 源资产、内置能力状态或 Agent runtime 投射
- **THEN** Agent MUST 在任务完成前运行当前 Agent 对应的 doctor
- **AND** Agent MUST NOT 在 doctor 仍报告需要立即处理的 error 时把该 Buildr 操作视为完成

#### Scenario: Buildr CLI 安装或刷新
- **WHEN** Agent 为一个已初始化 workspace 安装或刷新 Buildr CLI 开发入口
- **THEN** Agent MUST 在确认 CLI 可执行后运行当前 Agent 对应的 doctor

#### Scenario: Core 与 Skill 的职责
- **WHEN** Buildr 发布 doctor 完成约束
- **THEN** required Core MUST 只声明状态变更后必须验证的 invariant
- **AND** Buildr Skill 或 bootstrap MUST 提供具体 doctor 命令、执行时机和后续处理流程
