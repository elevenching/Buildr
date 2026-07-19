## ADDED Requirements

### Requirement: Buildr Skill 使用 workspace source 与两种 render destination
产品入口 Buildr Skill MUST 将 Skill 源资产维护统一路由到 workspace，并 MUST 根据用户意图区分 user 与 workspace render destination。

#### Scenario: 用户创建项目专用 Skill
- **WHEN** 用户要求沉淀只适用于某个 Project 的 Skill
- **THEN** Buildr Skill MUST 在 workspace `skills/` 创建或登记该 Skill
- **AND** MUST 在 Project capability/applicability context 中记录项目语义
- **AND** MUST NOT 创建 Project `skills/` 源目录

#### Scenario: 用户要求当前工作目录使用 Skill
- **WHEN** 用户要求 Skill 仅在当前 workspace 可发现
- **THEN** Buildr Skill MUST 使用 workspace destination render
- **AND** MUST NOT 修改用户级 Skills

#### Scenario: 用户要求所有 workspace 使用 Skill
- **WHEN** 用户明确要求全局或个人用户层安装 Skill
- **THEN** Buildr Skill MUST 使用 user destination render
- **AND** MUST 在执行前说明用户级影响和冲突检查结果

### Requirement: Buildr Skill 解释并处理 Agent Skills 同名行为
产品入口 Buildr Skill MUST 说明 Agent runtime 可以暴露多个同名 Skill，但 Buildr 受管投射不依赖未定义覆盖行为。

#### Scenario: 候选与当前 Agent Skill 同名
- **WHEN** render preflight 报告候选与用户、workspace、plugin、system 或其他来源 Skill 同名
- **THEN** Buildr Skill MUST 向用户展示可证明的来源、ownership、digest 和冲突类型
- **AND** MUST 提供 rename、skip、remove/disable external 或显式 adopt/transfer 中实际可执行的 nextActions
- **AND** MUST NOT 推荐依赖 Agent selector 顺序或隐式覆盖

#### Scenario: 不同 Skill 实现同一专业能力
- **WHEN** 用户希望保留两个不同实现并选择其中一个参与 Skill 协作
- **THEN** Buildr Skill MUST 引导它们使用不同 Skill ID 和同一 capability contract
- **AND** MUST 通过显式 binding 选择 provider

## REMOVED Requirements

### Requirement: 内置 Agent Skills 通过现有 render 体系投射
**Reason**: 原 Requirement 将 `skills render` 定义为 workspace/root/project source scope 投射，无法表达 user/workspace destination。
**Migration**: 产品入口 Buildr Skill 仍由 `skill install` 独立维护；workspace Skills 使用新的 destination render。

### Requirement: 内置 Agent Skill 来源冲突必须显式处理
**Reason**: 冲突治理不应只覆盖产品内置 Skill 与 workspace/Project Skill，而应覆盖候选涉及的完整可观测有效 Agent Skills 集。
**Migration**: 使用统一 Skill identity、ownership、digest 和 effective inventory conflict requirements。
