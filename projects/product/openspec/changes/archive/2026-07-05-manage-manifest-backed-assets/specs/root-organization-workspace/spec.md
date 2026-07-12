## MODIFIED Requirements

### Requirement: 默认 workspace 规则路由工具型资产维护
Buildr MUST 在默认 workspace 规则中要求 Agent 识别规则、技能、命令行工具相关任务，并优先通过 Buildr 技能维护源资产。

#### Scenario: Agent 读取默认规则
- **WHEN** Agent 读取 `buildr init` 生成的 workspace `AGENTS.md`
- **THEN** Agent MUST 能看到“Buildr 管理团队资产，不接管个人机器”的规则
- **AND** Agent MUST 能看到 Agent 运行环境、本机状态和临时提示都不是资产源

#### Scenario: 用户要求维护 manifest-backed 工具型资产
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的技能或命令行工具
- **THEN** 默认 workspace 规则 MUST 要求 Agent 先使用 Buildr 技能
- **AND** 默认 workspace 规则 MUST 要求 Agent 优先通过对应 manifest-backed CLI 维护 Buildr workspace 源资产
- **AND** 默认 workspace 规则 MUST 要求 runtime 投射或本机环境补齐按需在源资产维护后执行

#### Scenario: 用户要求维护规则资产
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的规则
- **THEN** 默认 workspace 规则 MUST 要求 Agent 先使用 Buildr 技能
- **AND** 默认 workspace 规则 MUST 要求 Agent 直接维护当前 scope 的 `AGENTS.md` 或 `rules/*.md`
- **AND** 默认 workspace 规则 MUST NOT 要求 Agent 使用 `rules add/remove`

#### Scenario: Agent 不确定如何维护资产
- **WHEN** Agent 不确定如何维护 Buildr 工具型资产
- **THEN** 默认 workspace 规则 MUST 引导 Agent 优先使用 Buildr 技能
- **AND** 当 Buildr 技能不可用时 MUST 引导 Agent 使用 `buildr bootstrap guide`

## ADDED Requirements

### Requirement: Service 层级源资产支持作为后续统一方向
Buildr MUST 在产品路线中将 service 层级源资产支持作为统一后续方向记录，而不是在单个 manifest-backed 命令中局部引入不一致的 service scope。

#### Scenario: 记录 service 层级方向
- **WHEN** Buildr 文档描述 manifest-backed 资产维护命令的 scope 边界
- **THEN** 文档 MUST 说明本变更不改变现有 scope 模型
- **AND** 文档 MUST 记录后续统一评估 service scope 下 rules、skills、commands、practices 或后续源资产模块的解析、叠加/覆盖、来源链和权限模型

