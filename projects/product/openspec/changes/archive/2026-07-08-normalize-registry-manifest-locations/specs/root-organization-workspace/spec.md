## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST create workspace assets that can receive Buildr product builtins and render supported Agent runtimes.

#### Scenario: 初始化根资产
- **WHEN** Agent executes `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST create root source assets including `.buildr/`, `rules/`, `practices/`, `skills/`, `commands/` and `projects/`
- **AND** Buildr MUST create `rules/manifest.yml`, `skills/manifest.yml`, `commands/manifest.yml` and `projects/manifest.yml`
- **AND** `skills/manifest.yml` MUST declare `schemaVersion: buildr.skills/v1`
- **AND** `projects/manifest.yml` MUST declare `schemaVersion: buildr.projects/v1`
- **AND** Buildr MUST create root `AGENTS.md` required block and reference `rules/buildr/core.md`
- **AND** Buildr MUST be able to render initial Agent runtime for supported adapters

#### Scenario: 初始化 Codex runtime
- **WHEN** Buildr initializes a new workspace for Codex usage
- **THEN** Buildr MUST keep `AGENTS.md` as the native Codex rule entry
- **AND** Buildr MUST be able to project enabled Skills to `.agents/skills/`

#### Scenario: 初始化 Claude Code runtime
- **WHEN** Buildr initializes or syncs workspace for Claude Code usage
- **THEN** Buildr MUST be able to generate Claude Code runtime projection from the same Buildr source assets and enabled builtins model

### Requirement: 项目资产使用根 projects 目录
Buildr MUST 默认使用根 `projects/<project>/` 维护项目级资产，并使用 `projects/manifest.yml` 管理 Project 集合。

#### Scenario: 创建项目
- **WHEN** Agent executes `buildr project create pig --target <root>`
- **THEN** Buildr MUST create project-level `AGENTS.md`, `openspec/`, `practices/`, `skills/`, `services/` and `services/manifest.yml` under `<root>/projects/pig/`

#### Scenario: 未指定组织的 service 接入
- **WHEN** Agent executes `buildr service create pig/freshx <repo-ref> --target <root>`
- **THEN** Buildr MUST attach that service to `<root>/projects/pig/` service metadata and default service repo directory
- **AND** service metadata MUST be written to `<root>/projects/pig/services/manifest.yml`

## ADDED Requirements

### Requirement: 多层 AGENTS.md 规则资产投射
Buildr MUST 将 root、Project 与 Service levels 的 `AGENTS.md` files 视为 rule source assets，并通过 supported Agent runtime adapters 暴露适用链。

#### Scenario: Claude Code scope rule bridge
- **WHEN** Buildr renders Claude Code rules for scope `projects/<project>/services/<service>`
- **THEN** Buildr MUST expose applicable root, Project and Service `AGENTS.md` files through Claude Code rule bridge files

#### Scenario: Codex native AGENTS.md
- **WHEN** Buildr syncs or checks Codex runtime for scope `projects/<project>/services/<service>`
- **THEN** Buildr MUST rely on Codex native `AGENTS.md` behavior for rule loading
- **AND** Buildr runtime check MUST still verify that applicable `AGENTS.md` rule assets exist for the scope
