## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST 创建可直接作为 Organization 上下文维护的根资产，而不是只创建空容器或低信息量占位文档。

#### Scenario: 初始化根资产
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 在 `<dir>` 下创建根 `AGENTS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`practices/`、`skills/`、`shared/` 和 `projects/` 的基础骨架
- **AND** `rules/` MUST 包含默认任务分流、OpenSpec 工作流、runtime 投射、worktree 和 Git 规则

#### Scenario: 默认根规则可指导 Agent
- **WHEN** Agent 读取初始化生成的根 `AGENTS.md`
- **THEN** Agent MUST 能理解该 workspace 的资产源、读取顺序、任务分流、长期事实写回位置和 runtime 边界

#### Scenario: 默认不生成资产手册
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST NOT 默认创建 `ASSETS.md`

#### Scenario: 初始化元数据
- **WHEN** Buildr 创建 `.buildr/workspace.yml`
- **THEN** 该文件 MUST 记录 schema version、上下文 kind、实例 name 和 profile
