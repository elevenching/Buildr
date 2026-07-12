## ADDED Requirements

### Requirement: Agent runtime adapter discovery
Buildr MUST 提供 Agent-readable 的方式，用于发现已支持的 Agent runtime adapter 以及每个 adapter 实现的 render 能力。

#### Scenario: Agent lists supported runtime adapters
- **WHEN** Agent 运行 `buildr runtime list --json`
- **THEN** Buildr MUST 输出包含已支持 Agent runtime id 的 JSON
- **AND** 当 `claude-code` 和 `codex` adapter 已实现时，输出 MUST 包含 `claude-code` 和 `codex`
- **AND** 输出 MUST 包含 `requiredRenderCapabilities`
- **AND** 输出 MUST 描述每个已支持 adapter 的 render 能力、实现模式和 runtime-specific 推荐命令

#### Scenario: Runtime list includes recommended command templates
- **WHEN** Buildr 输出 supported Agent runtime adapter 信息
- **THEN** 每个 supported adapter MAY 包含 `recommendedCommands`
- **AND** `recommendedCommands` MUST be treated as Agent execution guidance rather than a complete CLI schema
- **AND** `recommendedCommands` MUST NOT replace command help as the complete CLI reference

#### Scenario: Runtime list is available outside workspace
- **WHEN** Agent 在非 Buildr workspace 目录运行 `buildr runtime list --json`
- **THEN** Buildr MUST 返回当前 CLI 支持的 runtime adapter 矩阵
- **AND** Buildr MUST NOT 要求目标目录已经初始化为 Buildr workspace

#### Scenario: Human lists supported runtime adapters
- **WHEN** 用户运行 `buildr runtime list`
- **THEN** Buildr MUST 输出人类可读的 supported Agent runtime adapter 摘要
- **AND** 摘要 MUST 说明每个 supported runtime 可使用的 render、sync、Skill install 和 runtime check 命令族

### Requirement: Adapter render capability checklist
Buildr MUST 定义一个 supported Agent adapter 需要实现的 render 能力清单。

#### Scenario: Required render capabilities
- **WHEN** Buildr 报告 supported Agent runtime adapters
- **THEN** Buildr MUST 将 `rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans` 和 `runtime-check` 列为 required render capabilities
- **AND** 每个 supported adapter MUST 报告自己是否支持每个 required render capability

#### Scenario: Render capability implementation modes
- **WHEN** Buildr 描述某个 adapter render capability
- **THEN** Buildr MUST 允许该能力通过 native behavior、file render、Skill install、install-plan render 或 diagnostic check 实现
- **AND** Buildr MUST NOT 要求每个 render capability 都写文件

#### Scenario: Codex native rules entry
- **WHEN** Buildr 描述 Codex 的 `rules-entry` capability
- **THEN** Buildr MUST 描述该能力由 Codex 原生消费 `AGENTS.md` 实现
- **AND** Buildr MUST 表明 rules render 不会写入 Codex bridge 文件

### Requirement: Unsupported Agent runtime guidance
Buildr MUST 清楚地区分 unsupported Agent runtime 和 supported runtime 中缺失 render 结果的情况。

#### Scenario: Unsupported Agent runtime is discovered
- **WHEN** Agent 判断自己的 runtime id 不在 `buildr runtime list --json` 输出中
- **THEN** Agent MUST NOT 使用该 unsupported runtime id 运行 `render`、`sync`、`skill install` 或 `runtime check`
- **AND** Agent MUST NOT 使用 supported fallback adapter 代替
- **AND** Agent MUST 警示用户 Buildr 暂不支持当前 Agent runtime 的自动渲染
- **AND** Agent MUST 告诉用户联系 Buildr 作者反馈该 Agent

#### Scenario: Unsupported Agent guidance in runtime list
- **WHEN** Buildr 输出 `buildr runtime list --json`
- **THEN** 输出 MUST 包含 unsupported-Agent guidance
- **AND** 该 guidance MUST 包含 `mustNotUseFallbackAdapter: true`
- **AND** 该 guidance MUST 告诉用户联系 Buildr 作者反馈该 Agent

### Requirement: Runtime render asset scope
Buildr runtime render MUST 限定为由 Buildr 源资产派生出的 Agent runtime 入口资产。

#### Scenario: Supported runtime render
- **WHEN** Buildr render 或 sync 某个 supported Agent runtime
- **THEN** Buildr MUST 只 render 该 Agent runtime 消费 Buildr workspace rules 和 Skills 所必需的资产
- **AND** Buildr MUST 将 Commands、Project registry、Service registry、OpenSpec content、practices、knowledge 和 docs 保持为 Buildr 源资产，而不是默认复制到 runtime 目录

#### Scenario: Product Buildr Skill boundary
- **WHEN** Buildr 为 supported Agent runtime 安装产品入口 Buildr Skill
- **THEN** Buildr MUST 使用 `buildr skill install <agent>`
- **AND** Buildr MUST NOT 将产品入口 Buildr Skill 登记到 workspace 或 Project `skills/manifest.yml`

### Requirement: Registry terminology
Buildr MUST 对列出受管资产的索引 manifest 统一使用 registry 术语。

#### Scenario: Project and Service registries
- **WHEN** Buildr 描述 root `projects/manifest.yml` 和 Project `services/manifest.yml`
- **THEN** Buildr MUST 分别称它们为 Project registry 和 Service registry
- **AND** Buildr MUST 将 metadata 保留给 registry entry 内部字段，例如 title、description、repo 和 path
