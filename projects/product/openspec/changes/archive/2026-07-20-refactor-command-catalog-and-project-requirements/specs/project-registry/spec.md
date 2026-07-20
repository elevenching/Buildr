## ADDED Requirements

### Requirement: Project registry 识别 Command requirement context
Buildr MUST 将已登记 Project 的 `commands.yml` 识别为 Project context asset，并 MUST 验证其与 workspace Command catalog 的引用完整性。

#### Scenario: Project create 生成 Command context
- **WHEN** Buildr 成功创建一个 Project
- **THEN** Project baseline MUST 包含 `commands.yml`
- **AND** Project registry 与 doctor MUST 将其报告为已初始化 Project asset

#### Scenario: Project requirement 不影响 repo ownership
- **WHEN** Project 使用 workspace repo 或独立 asset repo
- **THEN** `commands.yml` MUST 跟随 Project asset ownership
- **AND** workspace Command catalog MUST 继续跟随 workspace root ownership

#### Scenario: 未登记目录不参与 requirements
- **WHEN** `projects/` 下存在未登记目录及其 `commands.yml`
- **THEN** Buildr MUST NOT 将其 requirements 纳入有效 task context
- **AND** doctor MAY 报告未登记目录，但 MUST 避免派生 machine readiness 噪音
