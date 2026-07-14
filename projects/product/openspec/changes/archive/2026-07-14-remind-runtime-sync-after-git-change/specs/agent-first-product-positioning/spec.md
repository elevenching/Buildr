## ADDED Requirements

### Requirement: Buildr 功能优先由 Agent 执行
Buildr MUST 将 Agent 作为产品功能的默认操作入口；人通过 Agent 表达目标、授权必要变更和提供 Agent 无法代替的判断，而不需要默认代 Agent 执行 Buildr 命令。

#### Scenario: Agent 能安全完成用户目标
- **WHEN** Agent 已理解用户目标，具备完成 Buildr 动作所需的工具和权限，且已取得该动作要求的授权
- **THEN** Agent MUST 直接执行该 Buildr 动作并验证结果
- **AND** Agent MUST NOT 把命令或操作步骤作为默认交付结果要求用户代为执行

#### Scenario: 动作需要用户授权
- **WHEN** Agent 能完成 Buildr 动作但该动作需要用户确认范围、影响或写操作授权
- **THEN** Agent MUST 先说明必要影响并请求授权
- **AND** 用户确认后 Agent MUST 直接执行，而不是再次要求用户手动操作

#### Scenario: 手动操作作为兜底
- **WHEN** 用户明确选择手动方式，或 Agent 因工具不可用、权限、登录态、外部环境等原因无法完成动作
- **THEN** Agent MUST 提供准确、可执行的手动操作方式
- **AND** Agent 无法执行时 MUST 说明具体阻塞原因
