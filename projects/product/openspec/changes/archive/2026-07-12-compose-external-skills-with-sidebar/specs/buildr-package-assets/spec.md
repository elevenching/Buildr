## MODIFIED Requirements

### Requirement: Package manifest 声明 workspace Components
Buildr package manifest MUST 显式声明随包 workspace Components，并将 Component 定义、外部 Skill resolved sources 和 Buildr-owned member sources 限制在可验证的发布边界内。

#### Scenario: 声明随包 Component
- **WHEN** Buildr 产品包提供 workspace Component
- **THEN** `package/manifest.yml` MUST 声明 Component id、定义源路径、默认启用状态和 required 状态
- **AND** Component 定义源 MUST 位于 `package/targets/workspace/components/<source>/<id>/component.yml`

#### Scenario: Component 定义引用不同来源成员
- **WHEN** 随包 Component 声明外部 Skills、Buildr-owned Rules/Skills、Command collections 或 Skill Contributions
- **THEN** 每个 Buildr-owned member 源和目标路径 MUST 位于允许的 workspace target 边界
- **AND** 每个外部 Skill MUST 声明可验证的 source、resolved source、version 和 integrity
- **AND** Component 定义 MUST 声明全部物化成员 integrity
- **AND** 同一个随包成员 MUST NOT 被多个 Component 声明生命周期所有权

#### Scenario: Package check 校验 Component
- **WHEN** Agent 运行 `buildr package check`
- **THEN** Buildr MUST 校验 Component manifest schema、定义 schema、稳定 id、版本、来源、成员路径、成员存在性和 integrity
- **AND** Buildr MUST 校验外部 Skill 内容未包含 Buildr sidebar 修改
- **AND** Buildr MUST 校验 Component 与独立 Builtins、workspace baseline 和其他 Components 不存在 id、路径或 ownership 冲突

#### Scenario: OpenSpec Component 上游版本对齐
- **WHEN** package check 校验随包 OpenSpec Component
- **THEN** Buildr MUST 校验 OpenSpec Command collection 和全部声明的外部 workflow Skills 存在
- **AND** Buildr MUST 校验外部 Skills 的 `generatedBy`、resolved source 和 integrity 与 Component 声明的 OpenSpec 上游版本一致
- **AND** Buildr MUST 校验 sidebar 对该上游版本兼容

#### Scenario: Component 不重复进入 baseline 映射
- **WHEN** package manifest 已通过 Component 声明某个 Rule、Skill 或 Command collection
- **THEN** Buildr MUST NOT 再依赖重复的 workspace baseline 文件清单决定该成员的安装状态
- **AND** init/update MUST 通过 Component 生命周期物化该成员

### Requirement: Package 发布 OpenSpec 契约门禁 sidebar
Buildr package MUST 发布 OpenSpec 契约门禁 Skill、Contribution fragments、CLI 契约和 Component metadata，并严格区分上游 workflow Skills 与 Buildr 自有 sidebar。

#### Scenario: Package manifest 声明门禁 Skill
- **WHEN** package check 校验 OpenSpec Component
- **THEN** package manifest MUST 将 `openspec-contract-guard` 声明为该 Component 的 Buildr-owned workspace Skill
- **AND** Component definition 和 integrity MUST 包含该 Skill 的完整源目录

#### Scenario: 校验不同来源的 Skills
- **WHEN** package check 遍历 OpenSpec Component Skill members
- **THEN** 外部 workflow Skills MUST 校验 `generatedBy`、resolved source 与 upstream version 一致
- **AND** 外部 workflow Skills MUST 位于外部来源命名空间且正文不含 Buildr sidebar 修改
- **AND** Buildr 契约门禁 Skill MUST 校验 Buildr 自有来源和支持的 upstream version
- **AND** package check MUST NOT 要求 Buildr sidebar 伪装为 OpenSpec 上游生成资产

#### Scenario: Runtime 组合 sidebar
- **WHEN** 临时 workspace 为支持的 Agent render OpenSpec Component
- **THEN** runtime workflow Skills MUST 由纯上游内容和 enabled sidebar contributions 确定性组合
- **AND** workspace 外部 Skill 源 MUST 与上游 package source 保持一致
- **AND** Component 卸载并 reconcile 后 runtime MUST 移除 sidebar 和 Component-owned workflow Skills，不得遗留 Buildr fork
