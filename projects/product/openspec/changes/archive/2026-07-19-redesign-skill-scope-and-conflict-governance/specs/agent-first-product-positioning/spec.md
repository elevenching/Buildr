## ADDED Requirements

### Requirement: 公开产品模型区分 Workspace、Project 与 Skill destination
Buildr 公开入口 MUST 将 Workspace 说明为工作目录和 Skill 治理根，将 Project 说明为业务与依赖节点，并将 user/workspace 说明为两种 Agent Skill runtime destination。

#### Scenario: README 解释 Skill 生命周期
- **WHEN** README 介绍 Skill 创建、复用和安装
- **THEN** README MUST 说明 Skill 先在 workspace `skills/` 管理
- **AND** MUST 说明它可显式 render 到用户层或当前 workspace 层
- **AND** MUST NOT 将 Project 描述为 Buildr 能保证的 Skill 使用范围

#### Scenario: README 解释 Project 专用 Skill
- **WHEN** README 举例说明只适用于某 Project 的工作流程
- **THEN** README MUST 将其描述为 workspace Skill 加 Project applicability/capability context
- **AND** MUST 保留 workspace 的跨 Project registry 和依赖语义

### Requirement: 公开入口准确说明同名 Skill 治理
Buildr 公开文档 MUST 说明 Agent runtime 可能允许同名 Skill 共存，但 Buildr 对受管候选使用 identity、ownership 和 digest 执行确定性冲突治理。

#### Scenario: 用户比较 Agent 与 Buildr 行为
- **WHEN** 用户询问同名 Skill 是否覆盖
- **THEN** 文档 MUST 区分 Agent 自身行为与 Buildr 受管投射保证
- **AND** MUST NOT 声称 Agent Skills 规范提供全局唯一 ID 或稳定覆盖优先级
