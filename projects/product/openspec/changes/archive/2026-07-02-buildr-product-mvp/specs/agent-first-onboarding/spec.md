## ADDED Requirements

### Requirement: 自然语言触发 Buildr onboarding
Buildr MVP MUST 支持用户通过自然语言向 Agent 表达使用 Buildr 管理项目的意图，并由 Agent 按 bootstrap guide 完成后续引导。

#### Scenario: 用户请求使用 Buildr
- **WHEN** 用户在一个目录中向 Agent 表达“使用 Buildr 作为项目管理框架”或等价意图
- **THEN** Agent MUST 识别该意图并读取 Buildr bootstrap guide，而不是要求用户先记忆或手动输入一组 Buildr CLI 命令

#### Scenario: Agent 确认 workspace 根目录
- **WHEN** 当前目录尚未初始化为 Buildr workspace
- **THEN** Agent MUST 与用户确认是否将当前目录作为 Buildr workspace 根目录

### Requirement: Agent 使用 CLI 作为确定性执行层
Buildr MVP MUST 将 CLI 作为 Agent 执行用户意图的 hard constraint 层。

#### Scenario: Agent 执行初始化
- **WHEN** 用户确认使用当前目录作为 Buildr workspace
- **THEN** Agent MUST 通过 `buildr init` 或等价可验证命令初始化 workspace

#### Scenario: Agent 汇报执行动作
- **WHEN** Agent 即将执行会改变 Buildr workspace 的命令
- **THEN** Agent MUST 向用户说明将执行的 Buildr 动作和预期资产变化

### Requirement: MVP 先通过 bootstrap guide 和基础命令闭环
Buildr MVP MUST 先通过 bootstrap guide、`init`、`org create`、`project create`、`service link` 和 `doctor` 完成 onboarding 闭环，不得要求先实现更高层 `buildr use` 入口。

#### Scenario: 用户首次引入 Buildr
- **WHEN** 用户请求 Agent 引入 Buildr
- **THEN** Agent MUST 能通过 bootstrap guide 和基础命令完成最小闭环

#### Scenario: 讨论更高层入口
- **WHEN** 需要评估 `buildr use` 等更高层入口
- **THEN** 该能力 MUST 在 MVP 基础闭环成立后再单独设计
