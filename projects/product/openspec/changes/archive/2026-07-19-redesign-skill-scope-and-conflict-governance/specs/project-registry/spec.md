## ADDED Requirements

### Requirement: Project 只引用 workspace 能力资产
Buildr MUST 允许 Project 声明对 workspace Skill 和 capability 的逻辑引用，并 MUST NOT 将这些引用解释为 Skill 安装、发现或访问隔离范围。

#### Scenario: Project 声明 capability requirement
- **WHEN** Project 声明一个 required 或 optional capability
- **THEN** Buildr MUST 将该声明解析到 workspace `skills/manifest.yml` 中的 contract 和 providers
- **AND** Project MUST NOT 内嵌或复制 provider Skill 内容

#### Scenario: Project 声明 Skill applicability
- **WHEN** Project 将一个 workspace Skill 标记为适用于自身业务任务
- **THEN** Buildr MUST 将该信息用于 Agent 路由提示和 doctor readiness 检查
- **AND** Buildr MUST NOT 将 applicability 描述为 Agent runtime 可见性限制

#### Scenario: Project 引用不存在的 workspace Skill
- **WHEN** Project 引用的 Skill ID 或 capability identity 无法从 workspace registry 解析
- **THEN** doctor MUST 报告 error、Project、缺失 identity 和可执行 nextActions
- **AND** Buildr MUST NOT 从 Project 目录猜测或生成 Skill 源

### Requirement: Project capability context 保持跨 Project 确定性
Buildr MUST 使用明确的 Project task context 解析 Project binding，并 MUST 在跨 Project 绑定不一致时 fail closed。

#### Scenario: 单 Project task 使用 Project binding
- **WHEN** 当前任务明确属于一个 Project 且该 Project 为 capability 声明 binding
- **THEN** Buildr MUST 使用该 binding 选择 workspace provider
- **AND** 该选择 MUST NOT 改变 provider 的 runtime 可见范围

#### Scenario: 跨 Project binding 冲突
- **WHEN** 当前任务涉及多个 Project 且它们为同一 capability 选择不同 providers
- **THEN** Buildr MUST 报告 `cross_project_binding_ambiguous`
- **AND** Agent MUST 拆分 Project 动作或取得明确选择，不得依据当前目录或 Project 顺序猜测
