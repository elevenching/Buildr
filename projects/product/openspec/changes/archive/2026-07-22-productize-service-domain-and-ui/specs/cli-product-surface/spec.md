## ADDED Requirements

### Requirement: Service CLI 必须使用 canonical Domain 术语
Service CLI MUST 使用 `code`、`name`、`description`、`type`、`source` 与 `integrationBranch` 表达 canonical Domain，并兼容旧参数。

#### Scenario: 查看 service create 帮助
- **WHEN** 用户查询 `service create` 帮助
- **THEN** canonical usage MUST 展示 `--name`、`--description`、`--type` 与 `--integration-branch`
- **AND** `--branch` MUST 只作为兼容别名说明

#### Scenario: 创建 Service JSON 输出
- **WHEN** Agent 使用 JSON 输出创建或登记 Service
- **THEN** 输出 MUST 包含稳定 Domain、registry revision 与 declared/observed 分离结果
