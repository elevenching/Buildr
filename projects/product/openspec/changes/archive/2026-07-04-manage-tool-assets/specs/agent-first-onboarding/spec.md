## ADDED Requirements

### Requirement: onboarding 引导 Agent 使用工具型资产规则
Buildr onboarding MUST 引导 Agent 通过 Buildr 技能和默认规则维护规则、技能和命令行工具清单。

#### Scenario: Agent 安装 Buildr 技能后继续初始化
- **WHEN** Agent 已安装或可使用 Buildr 技能
- **THEN** onboarding MUST 引导 Agent 按 Buildr 技能使用 Buildr CLI 初始化 workspace、检查状态并维护需要沉淀或复用的资产

#### Scenario: Agent 遇到命令行工具需求
- **WHEN** onboarding 或后续协作中出现需要沉淀或复用的命令行工具需求
- **THEN** Agent MUST 将该需求登记到 Buildr 命令行工具清单
- **AND** Agent MUST 通过 `commands check` 或 doctor 判断当前本机环境是否满足声明

#### Scenario: Buildr 技能不可用
- **WHEN** 当前 Agent 无法使用 Buildr 技能
- **THEN** onboarding MUST 引导 Agent 运行 `buildr bootstrap guide`
- **AND** bootstrap guide MUST 说明规则、技能、命令行工具等需要沉淀或复用的资产应先维护到 Buildr 源资产，再按需同步到 Agent 运行环境或本机
