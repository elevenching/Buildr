## MODIFIED Requirements

### Requirement: MVP 先通过 bootstrap guide 和基础命令闭环
Buildr MVP MUST 先通过 bootstrap guide、`init`、`project create`、`service create`、`doctor` 和 runtime check/render 完成 onboarding 闭环，不得要求先实现更高层 `buildr use` 入口。

#### Scenario: 用户首次引入 Buildr
- **WHEN** 用户请求 Agent 引入 Buildr
- **THEN** Agent MUST 能通过 bootstrap guide 和基础命令完成最小闭环

#### Scenario: 渐进式引导项目和服务
- **WHEN** Agent 完成 `buildr init`
- **THEN** Agent MUST 基于 `doctor --json` 和用户回答，逐步引导创建项目、接入 service repo 和执行 runtime check/render

#### Scenario: 讨论更高层入口
- **WHEN** 需要评估 `buildr use` 等更高层入口
- **THEN** 该能力 MUST 在 MVP 基础闭环成立后再单独设计
