## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST 创建可直接作为 Organization 上下文维护的根资产，而不是只创建空容器。

#### Scenario: 初始化根资产
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 在 `<dir>` 下创建根 `AGENTS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`practices/`、`skills/` 和 `projects/` 的基础骨架
- **AND** Buildr MUST NOT 默认创建 root `shared/`

#### Scenario: 初始化元数据
- **WHEN** Buildr 创建 `.buildr/workspace.yml`
- **THEN** 该文件 MUST 记录 schema version、上下文 kind、实例 name 和 profile

### Requirement: 默认 scope 使用根相对表达
Buildr MUST 支持根相对 project scope 作为默认 scope 表达。

#### Scenario: 项目 scope
- **WHEN** Agent 运行 `buildr runtime check claude-code --scope projects/pig --target <root>`
- **THEN** Buildr MUST 解析根规则、项目规则和相关 runtime 投射状态

#### Scenario: 基础服务 scope
- **WHEN** Agent 运行 `buildr doctor --scope projects/foundation/openapi --target <root> --json`
- **THEN** Buildr MUST 解析 `projects/foundation` 下 `openapi` 的 metadata 和本地 repo 状态

## REMOVED Requirements

### Requirement: 共享服务使用根 shared 目录
**Reason**: root `shared/` 不再是默认产品模型；共享/基础服务通过普通 Project 表达。

**Migration**: 将 `shared/services.yml` 和 `shared/services/<service>/` 迁移到 `projects/<project>/services.yml` 和 `projects/<project>/services/<service>/`。
