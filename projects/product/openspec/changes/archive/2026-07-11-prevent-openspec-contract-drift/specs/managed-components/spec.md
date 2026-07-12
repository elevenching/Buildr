## ADDED Requirements

### Requirement: OpenSpec Component 交付 Buildr 契约门禁 sidebar
Buildr MUST 将 OpenSpec 契约门禁作为现有 OpenSpec Component 的 Buildr 自有 sidebar 成员交付，并保持外部 OpenSpec 工具链的独立升级边界。

#### Scenario: OpenSpec Component 成员包含门禁 Skill
- **WHEN** Buildr 初始化或更新默认启用 OpenSpec 的 workspace
- **THEN** OpenSpec Component MUST 同时包含上游 workflow Skills、OpenSpec Command collection 和 `openspec-contract-guard` Skill
- **AND** Component integrity MUST 覆盖该门禁 Skill

#### Scenario: 门禁更新不改外部 Skills
- **WHEN** Buildr 发布新版契约门禁
- **THEN** Component update MUST 通过正常三方比较更新 Buildr sidebar 成员
- **AND** Buildr MUST NOT 为加入门禁而修改外部 `openspec-*` workflow Skill 的正文

#### Scenario: OpenSpec 上游升级
- **WHEN** Buildr 更新 OpenSpec Component 的 upstream version 和上游 workflow Skills
- **THEN** package verification MUST 同时验证门禁对该 upstream version 的兼容性
- **AND** Component MUST 保持外部 CLI 只声明和检查、Project OpenSpec 内容不归 Component 所有的既有边界

### Requirement: Component 可以声明自然语言 Skill Contribution
Buildr MUST 允许 workspace Component 声明受 Component 生命周期和 integrity 统一管理的 Markdown Skill Contribution，而不直接修改目标 Skill 源。

#### Scenario: 安装带 Skill Contribution 的 Component
- **WHEN** Component 声明目标 Skill、稳定 slot 和 contribution fragment
- **THEN** fragment MUST 作为 Component member 被物化并纳入 integrity
- **AND** Agent runtime render MUST 只把 enabled installed Component 的 fragment 组合到目标 Skill 已声明的 slot

#### Scenario: 卸载带 Skill Contribution 的 Component
- **WHEN** Component 被显式卸载并 reconcile 当前 Agent runtime
- **THEN** Component-owned fragment MUST 随其他 members 一起安全移除
- **AND** 重新渲染的目标 Skill MUST NOT 保留该 Component 的正文、命令或悬空路由

#### Scenario: Contribution 声明无效
- **WHEN** contribution 引用未登记 member、不安全路径，或已启用目标 Skill 未声明对应 slot
- **THEN** Component/package check 或 runtime render MUST fail closed
- **AND** Buildr MUST NOT 把 fragment 写入目标 Skill 源

#### Scenario: 可选目标 Skill 未安装
- **WHEN** contribution 的目标 Skill 为 disabled、uninstalled 或当前 scope 未解析到
- **THEN** runtime render MUST 跳过该 contribution，而不阻止其他 Skills 渲染
- **AND** 目标 Skill 后续安装并重新渲染时 MUST 自动获得该 contribution
