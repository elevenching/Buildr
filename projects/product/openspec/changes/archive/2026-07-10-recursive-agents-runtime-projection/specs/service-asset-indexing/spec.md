## MODIFIED Requirements

### Requirement: service metadata 表达服务语义和规则入口
Buildr MVP MUST allow service metadata to record Service type, while Service-level Rules MUST be discovered from the Service directory's `AGENTS.md` convention rather than from a rule-source pointer in metadata.

#### Scenario: 记录服务类型
- **WHEN** Agent 或用户指定 Service 类型
- **THEN** Buildr MUST 能在 Service metadata 中记录 backend、frontend、mobile、library 或 infra 等服务语义

#### Scenario: Service 规则入口使用目录约定
- **WHEN** `projects/<project>/services/<service>/AGENTS.md` 存在
- **THEN** Buildr MUST treat that file as the Service-level rule source
- **AND** runtime adapters MUST discover it through canonical scope and recursive `AGENTS.md` projection
- **AND** `services/manifest.yml` MUST NOT record `rules.source`、`rules` or an equivalent rule-source pointer

#### Scenario: Service manifest 保持封闭 schema
- **WHEN** Buildr creates、updates or migrates `services/manifest.yml`
- **THEN** Buildr MUST keep Service rule-source fields outside the manifest schema
- **AND** Buildr MUST NOT migrate legacy `rules.source` into the manifest

#### Scenario: 不记录 Service repo runtime 投射意图
- **WHEN** Buildr 写入 Service metadata
- **THEN** Service metadata MUST NOT 要求或默认记录向 Service repo 投射 Agent runtime 的意图
