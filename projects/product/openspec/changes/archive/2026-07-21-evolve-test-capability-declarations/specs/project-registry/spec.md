## ADDED Requirements

### Requirement: Project registry 识别可选测试能力声明
Buildr MUST 将已登记 Project 的 `verification.yml` 识别为 Project context asset，并 MUST 保持该资产可选、跟随 Project ownership 且独立于 Skill capability context。

#### Scenario: Project 没有测试声明
- **WHEN** Buildr 创建 Project 或诊断没有 `verification.yml` 的既有 Project
- **THEN** Project MUST 保持有效且默认 baseline MUST NOT 强制生成空声明
- **AND** Buildr MUST NOT 因缺失声明改变 `capabilities.yml`、`commands.yml` 或 Service registry

#### Scenario: Project 初始化测试声明
- **WHEN** Agent 经用户意图在已登记 Project 中创建 `verification.yml`
- **THEN** 声明 MUST 跟随该 Project 的实际 asset repo ownership
- **AND** workspace runtime render MUST NOT 把声明复制为 Skill source 或 Service repo 文件

#### Scenario: 未登记目录包含测试声明
- **WHEN** `projects/` 下未登记目录包含 `verification.yml`
- **THEN** Buildr MUST NOT 将其能力纳入有效 Project task context
- **AND** doctor MAY 报告未登记目录，但 MUST NOT 执行声明中的测试命令
