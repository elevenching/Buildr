## ADDED Requirements

### Requirement: Provider 通过 workspace registry 与业务上下文 binding 解析
Buildr MUST 从唯一 workspace Skill registry 解析 providers，并 MUST 使用明确 Project task context 或 workspace default binding 确定 provider，而不是使用 Project Skill source scope 继承。

#### Scenario: Project context 存在 binding
- **WHEN** 当前任务明确属于一个 Project，且 Project capability context 为 required capability 声明 binding
- **THEN** Buildr MUST 选择对应 workspace provider
- **AND** MUST NOT 将该 binding 解释为 Skill 可见性或安装隔离

#### Scenario: 没有 Project binding 时使用 workspace default
- **WHEN** 当前任务没有适用的 Project binding且 workspace 声明 default binding
- **THEN** Buildr MUST 使用 workspace default provider
- **AND** provider selection MUST NOT 依赖 Skill 安装顺序

#### Scenario: 无 binding 且只有唯一 provider
- **WHEN** 没有适用 binding 且只有一个兼容、已安装、runtime 可用的 workspace provider
- **THEN** Buildr MUST 自动选择该 provider

#### Scenario: 多个未绑定 providers
- **WHEN** 没有适用 binding 且存在多个兼容可用 providers
- **THEN** consumer readiness MUST 为 `blocked` 且 reason MUST 为 `ambiguous_provider`
- **AND** Buildr MUST 列出候选 providers，不得根据 Project 路径、builtin 或安装顺序选择

### Requirement: 不同 provider 必须使用不同 Skill ID
Buildr MUST 要求并行或替代 provider 使用各自 Skill ID，并 MUST NOT 使用同 ID 不同内容表达 capability substitution。

#### Scenario: 用户 provider 替代 builtin
- **WHEN** 用户创建内部 Skill 提供 builtin 已实现的 capability
- **THEN** 用户 provider MUST 使用自己的 Skill ID 并声明兼容 capability version
- **AND** binding MAY 在验证后选择该 provider

#### Scenario: Provider 冒充另一个 Skill ID
- **WHEN** 候选 provider 试图使用已存在 Skill ID 但具有不同 source identity 或内容
- **THEN** Buildr MUST 在 runtime binding 前报告 Skill name conflict
- **AND** MUST NOT 将 capability binding 作为绕过名称冲突的依据

## REMOVED Requirements

### Requirement: Provider 通过 scope binding 确定性解析
**Reason**: 原 Requirement 依赖 workspace/Project Skill source scope 链，而 Project 不再是 Skill source 或 runtime scope。
**Migration**: 将 workspace binding 保留为 default binding，将 Project binding 迁入 Project capability context，并按明确 task context 解析。
