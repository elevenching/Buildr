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
- **AND** `projects/manifest.yml` MUST declare `schemaVersion: buildr.projects/v2`
- **AND** Buildr MUST create root `AGENTS.md` required block and reference `rules/buildr/core.md`
- **AND** Buildr MUST be able to render initial Agent runtime for supported adapters

#### Scenario: 初始化 Codex runtime
- **WHEN** Buildr initializes a new workspace for Codex usage
- **THEN** Buildr MUST keep `AGENTS.md` as the native Codex rule entry
- **AND** Buildr MUST be able to project enabled Skills, including enabled Component Skills, to `.agents/skills/`

#### Scenario: 初始化 Claude Code runtime
- **WHEN** Buildr initializes or syncs workspace for Claude Code usage
- **THEN** Buildr MUST be able to generate Claude Code runtime projection from the same Buildr source assets, enabled builtins and enabled Components model
