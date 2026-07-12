## MODIFIED Requirements

### Requirement: MVP 先通过 bootstrap guide 和基础命令闭环
Buildr MVP MUST 先通过 bootstrap guide、`init`、`project create`、`service create`、`doctor` 和按 Agent 类型选择的 runtime 动作完成 onboarding 闭环，不得要求先实现更高层 `buildr use` 入口。

#### Scenario: Agent 获取 Buildr 使用指南
- **WHEN** Agent 通过 README、安装说明、`buildr --help` 或本地 CLI 发现 Buildr
- **THEN** Agent MUST 能通过 `buildr bootstrap guide` 理解基础命令和 onboarding 闭环

#### Scenario: service create 维护服务资产
- **WHEN** Agent 需要创建或维护 service metadata 与 service repo 引用
- **THEN** Agent MUST 使用 `buildr service create`
- **AND** bootstrap guide MUST NOT 将 `service link` 描述为主命令

#### Scenario: 共享服务创建项目
- **WHEN** 用户希望接入共享、基础或平台 service repo
- **THEN** Agent MUST 引导用户选择或创建一个 Project 来承载这些 services
- **AND** Agent MUST NOT 引导用户维护 root `shared/`

#### Scenario: 渐进式引导项目和服务
- **WHEN** Agent 完成 `buildr init`
- **THEN** Agent MUST 基于 `doctor --json` 和用户回答，逐步引导创建项目、接入 service repo 和执行必要的 runtime check/render

#### Scenario: Agent 根据自身 runtime 选择动作
- **WHEN** Agent 完成 `buildr init`
- **THEN** bootstrap guide MUST 引导 Agent 先判断自身是否原生读取 `AGENTS.md`
- **AND** 对原生读取 `AGENTS.md` 的 Agent MUST NOT 要求执行 rules render

#### Scenario: Codex 使用 Buildr workspace
- **WHEN** Codex Agent 在 Buildr workspace 中工作
- **THEN** Agent MUST 直接使用 `AGENTS.md` 作为规则入口
- **AND** Agent MUST NOT 为规则入口执行 `buildr rules render claude-code`

#### Scenario: Claude Code 使用 Buildr workspace
- **WHEN** Claude Code Agent 在 Buildr workspace 中工作
- **THEN** Agent MUST 使用 Claude Code adapter 的 runtime check/render 来维护 `CLAUDE.md` 和 `.claude/skills/`

#### Scenario: 讨论更高层入口
- **WHEN** 需要评估 `buildr use` 等更高层入口
- **THEN** 该能力 MUST 在 MVP 基础闭环成立后再单独设计
