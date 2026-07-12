## ADDED Requirements

### Requirement: Buildr 标准规则资产独立于 Agent runtime
Buildr MVP MUST 将 `AGENTS.md` 作为 Buildr 标准规则资产，并将 Agent runtime 目录视为可重建投射产物。

#### Scenario: 管理标准规则资产
- **WHEN** Buildr 管理组织、项目或服务级规则
- **THEN** Buildr MUST 以 `AGENTS.md` 或 Buildr 资产源文件作为长期规则资产

#### Scenario: 管理 Agent runtime 目录
- **WHEN** Buildr 为 Claude Code、Codex、Trae、Cursor 或其他 Agent 渲染 runtime
- **THEN** Buildr MUST 将 `.claude/`、`.codex/`、`.trae/`、`.cursor/` 等目录视为投射产物，而不是组织或项目资产源

### Requirement: workspace runtime 是 MVP 主路径
Buildr MVP MUST 优先保证 Buildr workspace 入口处的 Agent runtime 可用。

#### Scenario: 初始化 workspace runtime
- **WHEN** Agent 完成 Buildr workspace 初始化
- **THEN** Buildr MUST 能为当前 Agent 渲染或检查 workspace 级 runtime 桥接文件

#### Scenario: 多 Agent 使用同一 workspace
- **WHEN** 不同用户分别使用 Claude Code、Codex 或 Trae 打开同一个 Buildr workspace
- **THEN** 每个 Agent MUST 能基于 Buildr 标准资产生成自己的 runtime 投射，而不要求这些 runtime 目录成为共享资产源

### Requirement: service repo 不作为 MVP 独立 Agent runtime 入口
Buildr MVP MUST 将 Buildr workspace 作为 Agent 工作入口，不得将 service repo runtime 作为 service 接入的默认或必需能力。

#### Scenario: 只接入 service repo
- **WHEN** Agent 通过 `service link` 接入 service repo
- **THEN** Buildr MUST NOT 向该 service repo 写入 `CLAUDE.md`、`.claude/` 或其他 Agent runtime 文件

#### Scenario: 用户只打开 service repo
- **WHEN** 用户只在 service repo 目录中打开 Agent
- **THEN** Buildr MVP MUST NOT 将该目录视为完整 Buildr workspace 入口

#### Scenario: 用户权限被裁剪
- **WHEN** 用户只拥有某个项目或服务的权限
- **THEN** Buildr MUST 通过裁剪后的 Buildr workspace 资产提供上下文，而不是要求用户脱离 workspace 在 service repo 中工作

### Requirement: Buildr 作为 Agent 时代的项目契约
Buildr MVP MUST 将 Buildr 使用方式定义为跨 Agent 的项目协作契约。

#### Scenario: Agent 原生支持 Buildr
- **WHEN** 用户使用的 Agent 产品原生支持 Buildr
- **THEN** Agent MUST 能直接按 Buildr workspace 资产和规则工作

#### Scenario: Agent 未原生支持 Buildr
- **WHEN** 用户使用的 Agent 产品未原生支持 Buildr
- **THEN** 用户 MUST 能通过自然语言触发 Buildr bootstrap guide，让 Agent 学会使用 Buildr CLI 和 workspace 资产
