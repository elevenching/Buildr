## MODIFIED Requirements

### Requirement: OpenSpec 作为首个随包 Component
Buildr MUST 随包提供 workspace 级 OpenSpec Component，统一管理 OpenSpec Command collection、外部 workflow Skills 和 Buildr sidebar。

#### Scenario: OpenSpec Component 成员
- **WHEN** Buildr 初始化或更新默认启用 OpenSpec 的 workspace
- **THEN** OpenSpec Component MUST 包含 `commands/buildr/openspec/manifest.yml`
- **AND** Component MUST 以外部发布型 Skill 身份包含全部支持的 `openspec-*` workflow Skills
- **AND** Component MUST 包含 Buildr 自有的 `openspec-contract-guard` 和 sidebar contributions
- **AND** Component 定义 MUST 分别记录 OpenSpec 上游版本、外部 Skill 来源与 integrity，以及 Buildr sidebar 成员 integrity
- **AND** Component MUST NOT 在 `skills/buildr/openspec-*` 下物化外部 workflow Skill fork

#### Scenario: OpenSpec CLI 仍是外部工具
- **WHEN** OpenSpec Component 安装或更新
- **THEN** Buildr MUST 只声明并检查 OpenSpec CLI
- **AND** Buildr MUST NOT 自动安装、升级或卸载本机 OpenSpec CLI

#### Scenario: OpenSpec Component 不拥有 Project 数据
- **WHEN** OpenSpec Component 安装、更新或卸载
- **THEN** Buildr MUST NOT 创建、修改或删除任何 Project 的 `openspec/` 内容

### Requirement: Component 可以声明自然语言 Skill Contribution
Buildr MUST 允许 workspace Component 声明受 Component 生命周期和 integrity 统一管理的 Markdown Skill Contribution，并在 runtime source assembly 中非侵入式组合目标 Skill。

#### Scenario: Buildr 自有 Skill 使用 slot contribution
- **WHEN** Component 声明目标 Buildr Skill、稳定 slot 和 contribution fragment
- **THEN** fragment MUST 作为 Component member 被物化并纳入 integrity
- **AND** Agent runtime render MUST 只把 enabled installed Component 的 fragment 组合到目标 Skill 唯一声明的 slot
- **AND** workspace 中的目标 Skill 源 MUST 保持不变

#### Scenario: 外部 Skill 使用边界 contribution
- **WHEN** Component 对已解析外部 Skill 声明 `prepend` 或 `append` contribution
- **THEN** runtime source assembly MUST 以已验证的上游正文为基础生成带 provenance marker 的派生内容
- **AND** Buildr MUST NOT 修改外部 Skill 的 workspace 源正文
- **AND** Buildr MUST NOT 要求外部 Skill 包含 Buildr slot marker

#### Scenario: 卸载带 Skill Contribution 的 Component
- **WHEN** Component 被显式卸载并 reconcile 当前 Agent runtime
- **THEN** Component-owned fragment MUST 随其他 members 一起安全移除
- **AND** 重新渲染的目标 Skill MUST NOT 保留该 Component 的正文、命令或悬空路由

#### Scenario: Contribution 声明无效
- **WHEN** contribution 引用未登记 member、不安全路径、不支持的 placement，或 slot 目标没有唯一声明对应 slot
- **THEN** Component/package check 或 runtime render MUST fail closed
- **AND** Buildr MUST NOT 把 fragment 写入目标 Skill 源

#### Scenario: 可选目标 Skill 未安装
- **WHEN** contribution 的目标 Skill 为 disabled、uninstalled 或当前 scope 未解析到
- **THEN** runtime render MUST 跳过该 contribution，而不阻止其他 Skills 渲染
- **AND** 目标 Skill 后续安装并重新渲染时 MUST 自动获得该 contribution
