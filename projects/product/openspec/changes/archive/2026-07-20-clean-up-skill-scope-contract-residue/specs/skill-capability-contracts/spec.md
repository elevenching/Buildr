## MODIFIED Requirements

### Requirement: Skill capability contract 使用独立身份和版本
Buildr MUST 将可组合 Skill 的能力契约与 Skill 资产身份分离，MUST 只从 workspace Skill registry 注册 contract definitions，并 MUST 使用稳定 capability id 和正整数 major version 表达兼容边界。

#### Scenario: 声明 capability contract
- **WHEN** workspace Skills manifest 声明一个 capability contract
- **THEN** manifest entry MUST 包含 namespaced capability id、version、description 和受管 contract 文档路径
- **AND** contract Markdown MUST 使用 `buildr.capability-contract/v1` frontmatter 自描述相同的 id 和 version
- **AND** contract 文档 MUST 定义 `Purpose`、`Consumer Obligations`、`Minimum Guarantees`、`Effects and Authorization`、`Result Evidence`、`Decision Points` 和 `Allowed Variations`
- **AND** contract MAY 包含非规范性的 `Examples`

#### Scenario: Contract frontmatter 与 manifest 不一致
- **WHEN** contract frontmatter 的 id 或 version 与 workspace manifest 注册断言不同
- **THEN** package check、doctor 和 render MUST 报告 contract identity integrity error
- **AND** Buildr MUST NOT 选择其中一份 identity 继续解析 provider

#### Scenario: Project 引用 capability contract
- **WHEN** Project `capabilities.yml` 声明 requirement、binding 或 applicability
- **THEN** Buildr MUST 将其解析到 workspace registry 的唯一 contract identity
- **AND** Project MUST NOT 定义、复制或覆盖 contract 文档

#### Scenario: 同一 workspace 重定义 contract identity
- **WHEN** workspace 或 package 为相同 capability id/version 提供多个不同 contract definitions
- **THEN** Buildr MUST 报告 contract identity conflict
- **AND** Buildr MUST NOT 依据路径、Project context 或安装顺序静默覆盖既有 contract 语义
- **AND** 内部 provider 实现 Buildr contract 时 MUST 引用既有 identity，而不是复制同名 contract

#### Scenario: Contract 发生不兼容变化
- **WHEN** capability contract 新增或修改 normative clause，使原本合规 provider 变为不合规，或改变前置条件、允许副作用、授权、结果或失败语义
- **THEN** 维护者 MUST 增加 capability major version
- **AND** Buildr MUST NOT 把旧 version provider 视为新 version consumer 的兼容实现

#### Scenario: Contract 只做兼容澄清
- **WHEN** 维护者只修改文字澄清、非规范性 examples 或不收紧 `Minimum Guarantees` 的说明
- **THEN** contract MAY 保持原 major version
- **AND** 变更 MUST NOT 把 provider-specific command、algorithm 或 policy 提升为 normative requirement

#### Scenario: 普通独立 Skill 不参与 composition
- **WHEN** Skill 不被其他 Skill 组合且不需要成为可替换 provider
- **THEN** Buildr MUST 允许该 Skill 不声明 `provides` 或 `requires`
- **AND** capability framework MUST NOT 强迫所有 Skill 创建空洞 contract
