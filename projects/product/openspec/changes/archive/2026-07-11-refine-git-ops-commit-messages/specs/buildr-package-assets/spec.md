## MODIFIED Requirements

### Requirement: Required Core 暴露 Rule 消费协议
Buildr package assets MUST 将 Rule manifest consumption protocol 保留在 required Buildr Core 中，同时将 task-triggered procedures 保留在 Skills 中。

#### Scenario: Package Core 声明 Rule 状态语义
- **WHEN** Buildr packages or validates `rules/buildr/core.md`
- **THEN** required Core MUST state that enabled、required and installed Rules are always read
- **AND** required Core MUST state that enabled optional installed Rules are selected semantically from description and task context
- **AND** required Core MUST state that disabled or uninstalled Rules do not participate in the task

#### Scenario: Package Core 不承载操作手册
- **WHEN** Buildr packages Rule consumption guidance
- **THEN** required Core MUST NOT copy task-specific Git、OpenSpec、worktree or other operational procedures
- **AND** reusable task procedures MUST remain available through the corresponding Skills

#### Scenario: Package Core 提供默认提交语言
- **WHEN** Buildr packages the default Git operations capability
- **THEN** Conventional Commits generation guidance MUST be provided by the Git operations Skill
- **AND** required Core MUST define Chinese as the default commit-message language when no more specific convention applies
- **AND** required Core MUST NOT contain Git commands、type selection or message generation procedures

## ADDED Requirements

### Requirement: Core 默认提交语言独立生效
Buildr package MUST 通过 required Core 提供独立于 Git Ops Skill 生命周期的默认提交语言。

#### Scenario: 初始化默认 workspace
- **WHEN** Buildr initializes a workspace from the default package
- **THEN** required Core MUST state that commit-message subject and body use Chinese when no more specific convention applies
- **AND** it MUST allow code identifiers、paths、scope and proper nouns to retain their original form

#### Scenario: 卸载 Git Ops Skill
- **WHEN** Git Ops Skill is uninstalled
- **THEN** the Core commit-language default MUST remain available to Agent rule consumption
- **AND** Buildr MUST NOT remove or alter Core as a side effect of the Skill lifecycle

#### Scenario: 更具体约定覆盖默认语言
- **WHEN** Project、Service or repository rules define a more specific commit language
- **THEN** Agent MUST use the more specific convention instead of the Core default

### Requirement: 产品验证覆盖提交信息资产边界
Buildr product verification MUST 防止提交格式与默认语言重新耦合到同一 Skill 生命周期。

#### Scenario: 校验 Git Ops 提交格式
- **WHEN** Buildr validates the packaged Git Ops Skill
- **THEN** verification MUST confirm the concise Conventional Commits format、supported types、optional scope and breaking-change guidance
- **AND** verification MUST confirm Git Ops follows Core and more specific conventions without copying the Chinese constraint

#### Scenario: 校验 Core 默认提交语言
- **WHEN** Buildr validates the default package and a temporary initialized workspace
- **THEN** verification MUST confirm required Core contains the concise Chinese default and allowed original-form exceptions
- **AND** verification MUST confirm the Core default remains present when Git Ops is absent
