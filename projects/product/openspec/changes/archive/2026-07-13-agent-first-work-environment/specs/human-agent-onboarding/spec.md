## ADDED Requirements

### Requirement: Onboarding 采用 Agent-first 协作入口
Buildr onboarding MUST 优先让 Agent 读取产品入口、识别自身 runtime、理解用户目标并引导后续动作；人类用户 MUST 能通过表达目标开始使用 Buildr，而不需要先学习完整资产模型或 CLI 命令。

#### Scenario: 人通过 Agent 开始使用 Buildr
- **WHEN** 用户向 supported Agent 表达组织项目、共享工作资产或准备 Agent 工作环境的目标
- **THEN** Agent MUST 使用 Buildr Skill 或 bootstrap guide 理解并推进 onboarding
- **AND** Agent MUST 仅在需要业务判断、重要决策或风险确认时要求用户参与
