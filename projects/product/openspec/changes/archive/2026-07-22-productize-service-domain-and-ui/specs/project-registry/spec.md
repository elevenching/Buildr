## ADDED Requirements

### Requirement: 新建 Project 必须初始化 canonical Service registry
Buildr MUST 在创建 Project 时使用父实体 identity 初始化 `buildr.services/v2` 空 registry。

#### Scenario: 创建 Workspace Project
- **WHEN** Project 创建成功并安装基线资产
- **THEN** `services/manifest.yml` MUST 使用 `buildr.services/v2`
- **AND** 顶层 `projectId` MUST 等于新 Project UUID

#### Scenario: Project 创建回滚
- **WHEN** Service registry 初始化失败
- **THEN** Project create transaction MUST 不留下半完成 Project 或 registry
