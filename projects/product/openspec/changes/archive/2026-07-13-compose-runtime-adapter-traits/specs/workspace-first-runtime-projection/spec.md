## ADDED Requirements

### Requirement: Runtime adapter descriptor 通过受约束 traits 组合
Buildr MUST 使用受约束的 Rules、Skills、surface、activation 和 checker traits 组合每个静态 runtime adapter descriptor，并从组合结果派生 runtime contract metadata。

#### Scenario: 组合完整 adapter
- **WHEN** Buildr 注册一个 supported runtime adapter
- **THEN** descriptor MUST 声明 Rules、Skills、surface、activation 和 checker traits
- **AND** composer MUST 从 traits 派生 required render capabilities、runtime targets、Rules discovery/projection metadata、Skills roots 和 checker metadata
- **AND** capability evidence MUST 继续归因到该具体 adapter id

#### Scenario: Trait 组合不完整
- **WHEN** descriptor 使用未知 trait、缺少 trait 必需参数、引用未注册 implementation，或 Rules 组合不能覆盖 Buildr 的完整 scope 语义
- **THEN** adapter validation MUST fail
- **AND** Buildr MUST NOT 将该 adapter 报告为 supported

#### Scenario: 复用 trait 不等于 runtime alias
- **WHEN** 两个 adapter 使用相同 Rules primitive 或 Skills layout trait
- **THEN** Buildr MUST 保留两个独立 adapter identity、metadata、capability evidence 和 contract tests
- **AND** Buildr MUST NOT 将一个 runtime id 解析或 fallback 到另一个 runtime id

#### Scenario: Environment probe 安全边界
- **WHEN** checker trait 声明 command installation 或 version probe
- **THEN** Buildr MUST 只执行随产品静态声明的 executable 和 arguments
- **AND** probe MUST 不经过 shell、具有有限超时且不执行 workspace 提供的代码
- **AND** 未声明 probe 时 Buildr MUST NOT 声称已检查目标 Agent 的安装或版本

## MODIFIED Requirements

### Requirement: Agent runtime adapter discovery
Buildr MUST 提供 Agent-readable 的方式，用于发现已支持的 Agent runtime adapter、每个 adapter 实现的 render 能力、组合 traits 以及 Rules source discovery semantics。

#### Scenario: Agent lists supported runtime adapters
- **WHEN** Agent 运行 `buildr runtime list --json`
- **THEN** Buildr MUST 输出包含已支持 Agent runtime id 的 JSON
- **AND** 当 `claude-code` 和 `codex` adapter 已实现时，输出 MUST 包含 `claude-code` 和 `codex`
- **AND** 输出 MUST 包含 `requiredRenderCapabilities`
- **AND** 输出 MUST 包含受支持的 Rules、Skills、surface、activation 和 checker trait catalog
- **AND** 输出 MUST 描述每个已支持 adapter 的组合 traits、render 能力、实现模式和 runtime-specific 推荐命令

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
- **THEN** Buildr MUST 返回当前 CLI 支持的 runtime adapter 矩阵和 trait catalog
- **AND** Buildr MUST NOT 要求目标目录已经初始化为 Buildr workspace

#### Scenario: Human lists supported runtime adapters
- **WHEN** 用户运行 `buildr runtime list`
- **THEN** Buildr MUST 输出人类可读的 supported Agent runtime adapter 摘要
- **AND** 摘要 MUST 说明每个 supported runtime 可使用的 render、sync、Skill install 和 runtime check 命令族

### Requirement: Supported runtime adapter 使用静态完整契约
Buildr MUST 使用随产品发布的静态 registry 作为 supported Agent runtime adapter 的唯一事实源，并要求每个 registered adapter 通过受约束 traits 完整声明和实现 runtime contract。

#### Scenario: 注册完整 adapter
- **WHEN** package verification 校验一个 supported adapter
- **THEN** adapter descriptor MUST 包含稳定且唯一的 runtime id、完整 traits、全部 required render capabilities、runtime targets、实现入口和 Agent-readable metadata
- **AND** `runtime list`、CLI 参数校验、render、sync、Skill install、runtime check 和 doctor MUST 从同一组合后 registry descriptor 解析该 adapter

#### Scenario: Adapter contract 不完整
- **WHEN** registered adapter 缺少任一 required trait、required capability、实现入口或必要 capability evidence
- **THEN** package verification MUST fail
- **AND** Buildr MUST NOT 将该 adapter 报告为 supported

#### Scenario: 未注册 runtime
- **WHEN** Agent 请求一个不在静态 registry 中的 runtime id
- **THEN** Buildr MUST 将其作为 unsupported adapter 处理
- **AND** Buildr MUST NOT alias、猜测或 fallback 到其他 supported adapter

### Requirement: Adapter 可以组合受约束的内置投射原语
Buildr MUST 允许不同静态 adapter 组合受约束的 Rules、Skills、surface、activation 和 checker traits，同时保持每个 runtime 的独立 identity、contract 和诊断归因。

#### Scenario: Rules trait 分类
- **WHEN** adapter 声明 Rules trait
- **THEN** trait kind MUST 是 `native-recursive`、`native-root`、`reference-bridge` 或 `vendor-rule-files` 之一
- **AND** `native-root` 或其他部分原生行为 MUST NOT 在没有完整 scope projection implementation 时认证 `rules-entry`

#### Scenario: Skills、surface 与 activation trait 分类
- **WHEN** adapter 声明非 Rules traits
- **THEN** Skills kind MUST 是 `agents-compatible` 或 `vendor-root`
- **AND** surface kind MUST 是 `ide`、`cli`、`desktop` 或 `cloud`
- **AND** Rules 和 Skills activation MUST 分别声明为 `immediate`、`path-read`、`session-start` 或 `explicit-reload`
- **AND** `explicit-reload` MUST 提供 Agent-readable reload guidance

#### Scenario: 两个 runtime 复用相同布局
- **WHEN** 两个 registered adapters 使用相同 Rules implementation 或 Skills layout
- **THEN** 它们 MAY 复用同一个内置投射 primitive
- **AND** 每个 adapter MUST 继续拥有独立 descriptor、capability evidence 和 contract tests
- **AND** Buildr MUST NOT 将其中一个 runtime id 解析为另一个 runtime id

#### Scenario: 验证 adapter 扩展点
- **WHEN** package tests 使用 fake adapter 验证新增 adapter 的集成路径
- **THEN** fake adapter MUST 只能通过测试注入点使用
- **AND** fake adapter MUST 能验证 trait composition、implementation dispatch 和 capability validation
- **AND** 发布的 `runtime list`、CLI help 和 package registry MUST NOT 将 fake adapter 报告为 supported
