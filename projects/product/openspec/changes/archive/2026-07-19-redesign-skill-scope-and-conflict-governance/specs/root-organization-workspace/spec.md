## ADDED Requirements

### Requirement: Workspace 是 Skill 治理根和工作目录边界
Buildr MUST 将 Workspace 定义为 Skill 源资产治理根，并 MUST 将 workspace Skill 的本地 runtime 投射边界定义为 Agent 当前工作目录，而不是 Project 业务节点。

#### Scenario: Workspace 与工作目录语义一致
- **WHEN** Agent 从 Buildr workspace 根执行 workspace Skill render
- **THEN** Buildr MUST 将该 workspace 根视为 Agent 工作目录投射目标
- **AND** Buildr MUST 从根 `skills/manifest.yml` 读取全部受管 Skill 源

#### Scenario: Project 不作为 Skill runtime scope
- **WHEN** workspace 登记多个 Project
- **THEN** Buildr MUST 将 Project 保持为业务、依赖和能力上下文节点
- **AND** Buildr MUST NOT 声称 Project 目录能够限制 Skill 的 Agent runtime 可见范围

## MODIFIED Requirements

### Requirement: 项目资产使用根 projects 目录
Buildr MUST 默认使用根 `projects/<project>/` 维护项目级业务资产，并使用 `projects/manifest.yml` 管理 Project 集合，但 MUST NOT 在 Project 下创建或维护 Skill 源目录。

#### Scenario: 创建项目
- **WHEN** Agent executes `buildr project create pig --target <root>`
- **THEN** Buildr MUST create project-level `AGENTS.md`、`openspec/`、`services/` and `services/manifest.yml` under `<root>/projects/pig/`
- **AND** Buildr MUST NOT create `<root>/projects/pig/skills/`、`<root>/projects/pig/skills/manifest.yml` or `<root>/projects/pig/practices/`

#### Scenario: 未指定组织的 service 接入
- **WHEN** Agent executes `buildr service create pig/freshx <repo-ref> --target <root>`
- **THEN** Buildr MUST attach that service to `<root>/projects/pig/` service metadata and default service repo directory
- **AND** service metadata MUST be written to `<root>/projects/pig/services/manifest.yml`
