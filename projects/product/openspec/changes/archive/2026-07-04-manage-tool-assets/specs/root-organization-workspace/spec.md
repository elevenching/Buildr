## ADDED Requirements

### Requirement: 默认 workspace 规则路由工具型资产维护
Buildr MUST 在默认 workspace 规则中要求 Agent 识别规则、技能、命令行工具相关任务，并优先通过 Buildr 技能维护源资产。

#### Scenario: Agent 读取默认规则
- **WHEN** Agent 读取 `buildr init` 生成的 workspace `AGENTS.md`
- **THEN** Agent MUST 能看到“Buildr 管理团队资产，不接管个人机器”的规则
- **AND** Agent MUST 能看到 Agent 运行环境、本机状态和临时提示都不是资产源

#### Scenario: 用户要求维护工具型资产
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的规则、技能或命令行工具
- **THEN** 默认 workspace 规则 MUST 要求 Agent 先使用 Buildr 技能
- **AND** 默认 workspace 规则 MUST 要求变更先维护到 Buildr workspace 源资产，再按需同步到 Agent 运行环境或本机

#### Scenario: Agent 不确定如何维护资产
- **WHEN** Agent 不确定如何维护 Buildr 工具型资产
- **THEN** 默认 workspace 规则 MUST 引导 Agent 优先使用 Buildr 技能
- **AND** 当 Buildr 技能不可用时 MUST 引导 Agent 使用 `buildr bootstrap guide`
