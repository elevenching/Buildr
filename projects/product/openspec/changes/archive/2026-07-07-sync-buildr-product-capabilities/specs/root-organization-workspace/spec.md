## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST 创建能接收 Buildr 产品内置能力并渲染支持 Agent runtime 的 workspace。

#### Scenario: 初始化根资产
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 创建根源资产，包括 `.buildr/`、`rules/`、`practices/`、`skills/`、`commands/` 和 `projects/`
- **AND** Buildr MUST 创建 `rules/manifest.yml`、`skills/manifest.yml` 和 `commands/manifest.yml`
- **AND** Buildr MUST 创建根 `AGENTS.md` required block 并引用 `rules/buildr/core.md`
- **AND** Buildr MUST 能够为支持的 adapter 渲染初始 Agent runtime

#### Scenario: 初始化 Codex runtime
- **WHEN** Buildr 为 Codex 使用场景初始化新 workspace
- **THEN** Buildr MUST 保持 `AGENTS.md` 作为 Codex 原生规则入口
- **AND** Buildr MUST 能够投射 enabled Skills 到 `.agents/skills/`

#### Scenario: 初始化 Claude Code runtime
- **WHEN** Buildr 为 Claude Code 使用场景初始化或同步 workspace
- **THEN** Buildr MUST 能够基于同一套 Buildr 源资产和已启用内置能力模型生成 Claude Code runtime 投射

## ADDED Requirements

### Requirement: 已有 workspace 升级兼容
Buildr MUST 支持已有 Buildr workspace 兼容内置能力和 adapter render 模型。

#### Scenario: 已有 workspace update
- **WHEN** Agent 在已有初始化 workspace 中运行 Buildr update
- **THEN** Buildr MUST 保留已有用户资产
- **AND** Buildr MUST 增加或更新 manifest 中的产品内置能力状态，同时不静默覆盖用户编写的规则正文

#### Scenario: 已有 AGENTS
- **WHEN** 已有 workspace 中存在 `AGENTS.md`
- **THEN** Buildr MUST 只检查并修复 Buildr required block
- **AND** Buildr MUST NOT 覆盖用户正文

#### Scenario: 旧版规则迁入
- **WHEN** 已有 workspace 使用旧版 package baseline rules
- **THEN** Buildr MUST 将产品发布规则迁入 `rules/buildr/` 并登记到 `rules/manifest.yml`
- **AND** Buildr MUST 将旧 `runtime.md` 语义内化进 `rules/buildr/core.md`
