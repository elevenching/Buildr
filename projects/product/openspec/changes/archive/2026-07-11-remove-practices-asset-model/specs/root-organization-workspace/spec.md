## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST create workspace assets that can receive Buildr product builtins and Components and render supported Agent runtimes.

#### Scenario: 初始化根资产
- **WHEN** Agent executes `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST create root source assets including `.buildr/`, `rules/`, `skills/`, `commands/`, `components/` and `projects/`
- **AND** Buildr MUST NOT create a root `practices/` directory
- **AND** Buildr MUST create `rules/manifest.yml`, `skills/manifest.yml`, `commands/manifest.yml`, `components/manifest.yml` and `projects/manifest.yml`
- **AND** `skills/manifest.yml` MUST declare `schemaVersion: buildr.skills/v1`
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

### Requirement: 项目资产使用根 projects 目录
Buildr MUST 默认使用根 `projects/<project>/` 维护项目级资产，并使用 `projects/manifest.yml` 管理 Project 集合。

#### Scenario: 创建项目
- **WHEN** Agent executes `buildr project create pig --target <root>`
- **THEN** Buildr MUST create project-level `AGENTS.md`, `openspec/`, `skills/`, `services/` and `services/manifest.yml` under `<root>/projects/pig/`
- **AND** Buildr MUST NOT create `<root>/projects/pig/practices/`

#### Scenario: 未指定组织的 service 接入
- **WHEN** Agent executes `buildr service create pig/freshx <repo-ref> --target <root>`
- **THEN** Buildr MUST attach that service to `<root>/projects/pig/` service metadata and default service repo directory
- **AND** service metadata MUST be written to `<root>/projects/pig/services/manifest.yml`

### Requirement: Service 层级源资产支持作为后续统一方向
Buildr MUST 在产品路线中将 service 层级源资产支持作为统一后续方向记录，而不是在单个 manifest-backed 命令中局部引入不一致的 service scope。

#### Scenario: 记录 service 层级方向
- **WHEN** Buildr 文档描述 manifest-backed 资产维护命令的 scope 边界
- **THEN** 文档 MUST 说明本变更不改变现有 scope 模型
- **AND** 文档 MUST 记录后续统一评估 service scope 下 rules、skills、commands 或后续源资产模块的解析、叠加/覆盖、来源链和权限模型

### Requirement: 已有 workspace 升级兼容
Buildr MUST 支持已有 Buildr workspace 兼容内置能力和 adapter render 模型。

#### Scenario: 已有 workspace update
- **WHEN** Agent 在已有初始化 workspace 中运行 Buildr update
- **THEN** Buildr MUST 保留已有用户资产
- **AND** Buildr MUST 增加或更新 manifest 中的产品内置能力状态，同时不静默覆盖用户编写的规则正文

#### Scenario: 保留遗留 Practices 目录
- **WHEN** 已有 workspace root 或已登记 Project 中存在 `practices/` 目录
- **THEN** Buildr init、update、sync、Project repair 和 doctor MUST NOT 删除、覆盖、移动或读取其中内容
- **AND** 该目录 MUST NOT 阻塞正常命令或被视为缺失的当前 baseline 资产
- **AND** doctor with information findings enabled MUST report an informational finding that does not require immediate user action

#### Scenario: 已有 AGENTS
- **WHEN** 已有 workspace 中存在 `AGENTS.md`
- **THEN** Buildr MUST 只检查并修复 Buildr required block
- **AND** Buildr MUST NOT 覆盖用户正文

#### Scenario: 旧版规则迁入
- **WHEN** 已有 workspace 使用旧版 package baseline rules
- **THEN** Buildr MUST 将产品发布规则迁入 `rules/buildr/` 并登记到 `rules/manifest.yml`
- **AND** Buildr MUST 将旧 `runtime.md` 语义内化进 `rules/buildr/core.md`

## ADDED Requirements

### Requirement: 遗留 Practices 内容迁移说明
Buildr MUST 将遗留 `practices/` 视为用户保留数据，并提供基于内容语义的人工迁移说明。

#### Scenario: Agent 处理遗留 Practices 内容
- **WHEN** Agent 或用户决定整理已有 `practices/` 内容
- **THEN** Buildr guidance MUST 说明约束和值守边界迁移为 Rule
- **AND** guidance MUST 说明可复用专业动作和操作流程迁移为 Skill
- **AND** guidance MUST 说明产品事实、需求和变更迁移为 OpenSpec
- **AND** guidance MUST 说明其他说明保留为普通 docs
- **AND** Buildr MUST NOT 根据文件名或正文自动决定迁移类别
