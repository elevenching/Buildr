## MODIFIED Requirements

### Requirement: service repo 不作为 MVP 独立 Agent runtime 入口
Buildr MVP MUST 将 Buildr workspace 作为 Agent 工作入口，不得将 service repo runtime 作为 service 接入的默认或必需能力。

#### Scenario: 只接入 service repo
- **WHEN** Agent 通过 `service create` 接入 project service repo
- **THEN** Buildr MUST NOT 向该 service repo 写入 `CLAUDE.md`、`.claude/` 或其他 Agent runtime 文件

#### Scenario: 用户只打开 service repo
- **WHEN** 用户只在 service repo 目录中打开 Agent
- **THEN** Buildr MVP MUST NOT 将该目录视为完整 Buildr workspace 入口

#### Scenario: 用户权限被裁剪
- **WHEN** 用户只拥有某个项目或服务的权限
- **THEN** Buildr MUST 通过裁剪后的 Buildr workspace 资产提供上下文，而不是要求用户脱离 workspace 在 service repo 中工作
