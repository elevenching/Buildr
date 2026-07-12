## MODIFIED Requirements

### Requirement: 自然语言触发 Buildr onboarding
Buildr MVP MUST 支持用户通过自然语言向 Agent 表达使用 Buildr 管理项目的意图，并由 Agent 优先按 Buildr Skill 完成后续引导；当 Skill 不可用时，Agent MUST 能按 bootstrap guide 兜底。

#### Scenario: 用户请求使用 Buildr
- **WHEN** 用户在一个目录中向 Agent 表达“使用 Buildr 作为项目管理框架”或等价意图
- **THEN** Agent MUST 识别该意图并优先使用 Buildr Skill
- **AND** 当 Buildr Skill 不可用时，Agent MUST 读取 Buildr bootstrap guide，而不是要求用户先记忆或手动输入一组 Buildr CLI 命令

#### Scenario: Agent 确认 workspace 根目录
- **WHEN** 当前目录尚未初始化为 Buildr workspace
- **THEN** Agent MUST 与用户确认是否将当前目录作为 Buildr workspace 根目录

### Requirement: MVP 先通过 Buildr Skill 和基础命令闭环
Buildr MVP MUST 先通过 Buildr Skill、bootstrap guide 兜底、`init`、`project create`、`service create`、`doctor` 和按 Agent 类型选择的 runtime 动作完成 onboarding 闭环，不得要求先实现更高层 `buildr use` 入口。

#### Scenario: Agent 获取 Buildr 使用指南
- **WHEN** Agent 通过 README、安装说明、`buildr --help` 或本地 CLI 发现 Buildr，但当前 Agent runtime 尚未安装 Buildr Skill
- **THEN** Agent MUST 优先通过 `buildr skill install <agent>` 安装 Buildr Skill
- **AND** 当 Buildr Skill 仍不可用时，Agent MUST 能通过 `buildr bootstrap guide` 理解基础命令和 onboarding 兜底路径

#### Scenario: Agent 使用 Buildr Skill
- **WHEN** 当前 Agent runtime 已渲染 Buildr Skill
- **THEN** Agent MUST 通过 Buildr Skill 理解 Buildr workspace onboarding、项目创建、服务接入、诊断和 runtime 处理约束
- **AND** Buildr Skill MUST 以轻约束和命令地图引导 Agent 自主编排，而不是规定固定交互脚本

#### Scenario: service create 维护服务资产
- **WHEN** Agent 需要创建或维护 service metadata 与 service repo 引用
- **THEN** Agent MUST 使用 `buildr service create`
- **AND** bootstrap guide MUST NOT 将 `service link` 描述为主命令

#### Scenario: 渐进式引导项目和服务
- **WHEN** Agent 完成 `buildr init` 或其他 Buildr 状态变更
- **THEN** Agent MUST 基于 `doctor --json` 和用户回答，逐步引导创建项目、接入 service repo 和执行必要的 runtime check/render

#### Scenario: Agent 根据自身 runtime 选择动作
- **WHEN** Agent 完成 `buildr init`
- **THEN** Buildr Skill 和 bootstrap guide MUST 引导 Agent 先判断自身是否原生读取 `AGENTS.md`
- **AND** 对原生读取 `AGENTS.md` 的 Agent MUST NOT 要求执行 rules render

#### Scenario: Codex 使用 Buildr workspace
- **WHEN** Codex Agent 在 Buildr workspace 中工作
- **THEN** Agent MUST 直接使用 `AGENTS.md` 作为规则入口
- **AND** Agent MUST NOT 为规则入口执行 `buildr rules render claude-code`

#### Scenario: Claude Code 使用 Buildr workspace
- **WHEN** Claude Code Agent 在 Buildr workspace 中工作
- **THEN** Agent MUST 使用 Claude Code adapter 的 runtime check/render 来维护 `CLAUDE.md` 和 `.claude/skills/`

#### Scenario: 初始化不自动写 runtime
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST 只创建 Buildr workspace 源资产
- **AND** Buildr MUST NOT 自动渲染 Buildr Skill、`CLAUDE.md` 或其他 Agent runtime 文件

#### Scenario: 产品 Skill 安装不同于 workspace Skills 投射
- **WHEN** Agent 只需要让当前 runtime 学会使用 Buildr
- **THEN** Agent MUST 使用 `buildr skill install <agent>`
- **AND** 当 Agent 需要投射 workspace/project Skills 时，Agent MUST 使用 `buildr skills render <agent>`

#### Scenario: 讨论更高层入口
- **WHEN** 需要评估 `buildr use` 等更高层入口
- **THEN** 该能力 MUST 在 Buildr Skill 编排效果被验证后再单独设计
