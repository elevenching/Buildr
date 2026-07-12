## ADDED Requirements

### Requirement: Project create 验证既有 repo identity
Buildr MUST 在修复既有 Project baseline 或 registry 前验证 materialized Project 的实际 repo identity 与命令和 registry 一致。

#### Scenario: 相同 Git 来源幂等修复
- **WHEN** `project create --repo <git-url>` 的目标已是 Git repo，且实际 remote、命令 URL 和既有 registry identity 一致
- **THEN** Buildr MUST 允许修复缺失 baseline 和 registry 低风险字段
- **AND** Buildr MUST NOT 覆盖既有 Project 文件

#### Scenario: 既有 Project 来源冲突
- **WHEN** 目标 repo remote、命令 URL、registry repo kind 或 registry URL 互相不一致
- **THEN** Buildr MUST 在任何 Project、registry 或 `.gitignore` 写入前失败
- **AND** Buildr MUST NOT 静默 relink、replace 或改写 repo identity

#### Scenario: 新 Git Project clone 失败
- **WHEN** 新 Project Git clone 或后续 baseline preflight 失败
- **THEN** Buildr MUST NOT 留下半完成 Project 目录或 registry entry
