## MODIFIED Requirements

### Requirement: Runtime 投射按 Agent 能力选择
Buildr MUST 将支持的 Agent runtime 视为从 Buildr 源资产、canonical scope discovery plan 和已启用内置能力生成的 adapter 投射。

#### Scenario: Codex runtime 投射
- **WHEN** Buildr 渲染 Codex adapter
- **THEN** Buildr MUST 保持 discovered `AGENTS.md` files 作为 Codex 原生规则入口
- **AND** Buildr MUST NOT 为 Rules 写入 Codex bridge 文件
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到当前 Codex 打开项目根目录的 `.agents/skills/`
- **AND** Buildr MUST 将 `.agents/skills/` 视为 runtime 投射产物，而不是长期 Buildr 源资产

#### Scenario: Claude Code runtime 投射
- **WHEN** Buildr 渲染 Claude Code adapter
- **THEN** Buildr MUST 为 discovery plan 中每个 `AGENTS.md` 写入或更新同目录 `CLAUDE.md` 引用桥
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到 `.claude/skills/`
- **AND** Buildr MUST 将 `CLAUDE.md` 和 `.claude/skills/` 视为 runtime 投射产物，而不是长期 Buildr 源资产

#### Scenario: 支持的 adapters
- **WHEN** Buildr syncs or renders Agent runtime
- **THEN** Buildr MUST 支持 `codex` 和 `claude-code`
- **AND** Buildr MUST 清楚报告不支持的 adapter，且不得修改 runtime 文件

#### Scenario: Runtime 准备顺序
- **WHEN** Buildr 渲染 Agent runtime
- **THEN** Buildr MUST 按 `rules/manifest.yml` 暴露和检查 enabled rules
- **AND** Buildr MUST 按 `skills/manifest.yml` 投射 enabled skills
- **AND** Buildr 内置项 MUST 在 manifest 中排在用户项之前
- **AND** rule discovery plan MUST order ancestor sources before descendant sources
- **AND** 在处理 Project scope 时，Buildr MUST 在 workspace 资产之后处理 Project 用户资产
- **AND** 更具体的源资产 MUST 在 Agent 可读入口中更靠后出现

#### Scenario: Rules 语义索引读取
- **WHEN** Agent 进入 Buildr workspace scope
- **THEN** Agent MUST 先读取 applicable `AGENTS.md` 和 `rules/buildr/core.md`
- **AND** Agent MUST 再读取 `rules/manifest.yml`
- **AND** Agent MUST 根据用户目标、修改范围、代码语义、workspace context 和 Rule `description` 判断 enabled user Rules 是否与当前任务相关
- **AND** Agent MUST NOT require `rules/manifest.yml` to contain structured role, path, service, or directory routing tables

#### Scenario: Rule 和 Skill 加载语义
- **WHEN** Buildr exposes Rules and Skills to an Agent runtime
- **THEN** Buildr MUST distinguish Rules and Skills by asset semantics rather than by whether they are always loaded
- **AND** Buildr MUST treat Rules as values, boundaries, and constraints
- **AND** Buildr MUST treat Skills as reusable professional actions and procedures

#### Scenario: Rule manifest 状态消费
- **WHEN** Agent consumes a valid `rules/manifest.yml`
- **THEN** Agent MUST read every enabled、required and installed Rule before performing workspace work
- **AND** Agent MUST inspect the description of every enabled、non-required and installed Rule
- **AND** Agent MUST read an optional Rule body before acting when user goals、changed files、code semantics or workspace context make that Rule relevant
- **AND** Agent MUST NOT use disabled or uninstalled Rules for the current task
- **AND** adapter discovery MUST NOT decide semantic Rule relevance on behalf of the Agent

#### Scenario: 根 sync 递归投射
- **WHEN** Agent runs `buildr sync <agent> --target <root>` without an explicit scope
- **THEN** Buildr MUST use canonical scope `.`
- **AND** Rules projection MUST reconcile all supported `AGENTS.md` in the managed workspace subtree
- **AND** native adapters MUST perform no Rules writes

#### Scenario: 深层 Rules scope 与 Skills scope 分离
- **WHEN** Agent renders a Service or deeper canonical scope through the combined `buildr render` command
- **THEN** Rules discovery MUST use the full canonical scope
- **AND** Skills resolution MUST use the owning workspace or Project scope
- **AND** Buildr MUST NOT infer Service-level Skills support

#### Scenario: Render conflict is validated before writes
- **WHEN** any planned rendered Rules target conflicts with a non-Buildr-managed runtime file
- **THEN** Buildr MUST fail before writing any planned Rules target
- **AND** Buildr MUST report every detected conflict in the selected scope

#### Scenario: Orphan managed bridge cleanup
- **WHEN** a selected scope contains a Buildr-managed rule bridge whose same-directory `AGENTS.md` no longer exists
- **THEN** rendered adapter reconcile MUST remove the orphan bridge
- **AND** Buildr MUST NOT remove non-Buildr-managed runtime files

### Requirement: Agent runtime adapter discovery
Buildr MUST 提供 Agent-readable 的方式，用于发现已支持的 Agent runtime adapter、每个 adapter 实现的 render 能力以及 Rules source discovery semantics。

#### Scenario: Agent lists supported runtime adapters
- **WHEN** Agent 运行 `buildr runtime list --json`
- **THEN** Buildr MUST 输出包含已支持 Agent runtime id 的 JSON
- **AND** 当 `claude-code` 和 `codex` adapter 已实现时，输出 MUST 包含 `claude-code` 和 `codex`
- **AND** 输出 MUST 包含 `requiredRenderCapabilities`
- **AND** 输出 MUST 描述每个已支持 adapter 的 render 能力、实现模式和 runtime-specific 推荐命令

#### Scenario: Rules entry discovery metadata
- **WHEN** `runtime list --json` 描述 supported adapter 的 `rules-entry`
- **THEN** metadata MUST identify canonical scope syntax as workspace-relative paths
- **AND** metadata MUST describe recursive `**/AGENTS.md` source discovery and ancestor inclusion
- **AND** metadata MUST identify whether projection is native or rendered
- **AND** metadata MUST identify whether the capability writes files
- **AND** rendered projection MUST describe its target pattern

#### Scenario: Runtime list includes recommended command templates
- **WHEN** Buildr 输出 supported Agent runtime adapter 信息
- **THEN** 每个 supported adapter MAY 包含 `recommendedCommands`
- **AND** `recommendedCommands` MUST be treated as Agent execution guidance rather than a complete CLI schema
- **AND** `recommendedCommands` MUST NOT replace command help as the complete CLI reference
- **AND** recommended scope examples MUST use canonical workspace-relative paths

#### Scenario: Runtime list is available outside workspace
- **WHEN** Agent 在非 Buildr workspace 目录运行 `buildr runtime list --json`
- **THEN** Buildr MUST 返回当前 CLI 支持的 runtime adapter 矩阵
- **AND** Buildr MUST NOT 要求目标目录已经初始化为 Buildr workspace

#### Scenario: Human lists supported runtime adapters
- **WHEN** 用户运行 `buildr runtime list`
- **THEN** Buildr MUST 输出人类可读的 supported Agent runtime adapter 摘要
- **AND** 摘要 MUST 说明每个 supported runtime 可使用的 render、sync、Skill install 和 runtime check 命令族
