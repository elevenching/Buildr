## ADDED Requirements

### Requirement: Workspace metadata 使用稳定领域 identity
Buildr MUST 使用 `.buildr/workspace.yml` 持久化 Workspace 的 UUID `id`、`name` 和 `description`，并将该文件作为本地 Workspace metadata 的 canonical source。

#### Scenario: canonical Workspace metadata
- **WHEN** Buildr 创建或迁移 Workspace metadata
- **THEN** `.buildr/workspace.yml` MUST 声明 `schemaVersion: buildr.workspace/v1`
- **AND** MUST 包含系统生成且持久化的 UUID `id`
- **AND** MUST 包含非空 `name` 和 `description`
- **AND** 历史 `kind` 与 `profile` MUST NOT 成为 Workspace Domain 字段
- **AND** 文件适配层 MAY 将 `kind` 与 `profile` 保留为兼容 metadata，但 Application MUST 将其视为只读且不属于 Workspace Domain

#### Scenario: Workspace identity 稳定
- **WHEN** Workspace 名称、说明、Git checkout 位置或文件内容发生变化
- **THEN** Buildr MUST 保持已经持久化的 Workspace UUID 不变
- **AND** MUST NOT 根据当前绝对路径重新生成 identity

#### Scenario: 旧 Workspace metadata 兼容读取
- **WHEN** Buildr 读取旧 `schemaVersion: 1` 或无 schemaVersion 的 Workspace metadata
- **THEN** Buildr MUST 返回真实 name、兼容 metadata 和 migration-required 状态
- **AND** 只读操作 MUST NOT 修改 Workspace 文件

#### Scenario: 旧 Workspace metadata 显式迁移
- **WHEN** Buildr 通过 canonical sync 显式迁移旧 Workspace metadata
- **THEN** Buildr MUST 优先复用合法的 `skills/manifest.yml.workspaceId`，仅在两处都没有 Workspace identity 时生成一次 UUID
- **AND** MUST 保留已有 name
- **AND** 缺少 description 时 MUST 写入明确 TODO 并产生可见诊断
- **AND** 迁移失败 MUST 保持旧文件不变

## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST create workspace assets that can receive Buildr product builtins and Components and render supported Agent runtimes.

#### Scenario: 初始化根资产
- **WHEN** Agent executes `buildr init --target <dir> --name <name> [--description <description>]`
- **THEN** Buildr MUST create root source assets including `.buildr/`, `rules/`, `skills/`, `commands/`, `components/` and `projects/`
- **AND** Buildr MUST NOT create a root `practices/` directory
- **AND** Buildr MUST create `.buildr/workspace.yml` with `schemaVersion: buildr.workspace/v1`、a generated UUID、name and description
- **AND** 未提供 description 时 Buildr MUST 写入明确 TODO 并让 doctor 产生可见提示
- **AND** Buildr MUST create `rules/manifest.yml`, `skills/manifest.yml`, `commands/manifest.yml`, `components/manifest.yml` and `projects/manifest.yml`
- **AND** `skills/manifest.yml` MUST declare `schemaVersion: buildr.skills/v1`
- **AND** `skills/manifest.yml.workspaceId` MUST equal `.buildr/workspace.yml.id`
- **AND** `components/manifest.yml` MUST declare `schemaVersion: buildr.components/v1`
- **AND** `projects/manifest.yml` MUST declare `schemaVersion: buildr.projects/v1`
- **AND** Buildr MUST create root `AGENTS.md` required block and reference `rules/buildr/core.md`
- **AND** Buildr MUST be able to render initial Agent runtime for supported adapters

#### Scenario: 初始化 Codex runtime
- **WHEN** Buildr initializes a new workspace for Codex usage
- **THEN** Buildr MUST keep `AGENTS.md` as the native Codex rule entry
- **AND** Buildr MUST be able to project enabled Skills, including enabled Component Skills, to `.agents/skills/`

#### Scenario: 初始化 Claude Code runtime
- **WHEN** Buildr initializes or syncs workspace for Claude Code usage
- **THEN** Buildr MUST be able to generate Claude Code runtime projection from the same Buildr source assets, enabled builtins and enabled Components model
