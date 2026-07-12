## ADDED Requirements

### Requirement: service create 验证既有 repo identity
Buildr MUST 在写入 Service metadata 前验证 materialized Service repo 的实际 identity 与命令和既有 metadata 一致。

#### Scenario: 相同 Git 来源重复创建
- **WHEN** `service create <project>/<service> <git-url>` 的目标已是 Git repo，且实际 remote、命令 URL 和 metadata identity 一致
- **THEN** Buildr MUST 允许幂等修复 metadata 和 Git boundary
- **AND** Buildr MUST NOT 重新 clone 或覆盖 Service 文件

#### Scenario: 既有 Service Git 来源冲突
- **WHEN** 目标 remote、命令 Git URL 或既有 metadata URL 不一致
- **THEN** Buildr MUST 在 metadata 和 `.gitignore` 写入前失败
- **AND** Buildr MUST 报告实际与期望来源并要求显式解决

#### Scenario: 本地来源目标已存在
- **WHEN** `service create` 使用本地路径且目标 Service 目录已存在
- **THEN** Buildr MUST 保持既有拒绝语义
- **AND** Buildr MUST NOT 删除、合并或覆盖目标目录

#### Scenario: 新 Service materialization 失败
- **WHEN** clone、copy 或 source transaction 任一步骤失败
- **THEN** Buildr MUST NOT 留下半完成 Service 目录、metadata entry 或 Git boundary 变更
