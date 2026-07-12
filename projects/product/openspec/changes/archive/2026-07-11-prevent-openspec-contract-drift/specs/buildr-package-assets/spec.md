## ADDED Requirements

### Requirement: Package 发布 OpenSpec 契约门禁 sidebar
Buildr package MUST 发布 OpenSpec 契约门禁 Skill、CLI 契约和 Component member metadata，并区分上游生成资产与 Buildr 自有 sidebar。

#### Scenario: Package manifest 声明门禁 Skill
- **WHEN** package check 校验 OpenSpec Component
- **THEN** package manifest MUST 将 `openspec-contract-guard` 声明为该 Component 的 workspace Skill
- **AND** Component definition 和 integrity MUST 包含该 Skill 的完整源目录

#### Scenario: 校验不同来源的 Skills
- **WHEN** package check 遍历 OpenSpec Component Skill members
- **THEN** 上游 workflow Skills MUST 继续校验 `generatedBy` 与 upstream version 一致
- **AND** Buildr 契约门禁 Skill MUST 校验 Buildr 自有来源和支持的 upstream version
- **AND** package check MUST NOT 要求 Buildr sidebar 伪装为 OpenSpec 上游生成资产

### Requirement: 产品验证覆盖 OpenSpec 契约漂移门禁
Buildr 产品总验证 MUST 覆盖契约基线、同步前后检查、上游兼容性和候选 tree 的 canonical spec 变更审计。

#### Scenario: 门禁 fixture corpus
- **WHEN** 产品验证运行 OpenSpec contract fixtures
- **THEN** 验证 MUST 覆盖安全 ADDED、MODIFIED、REMOVED 和 RENAMED 同步
- **AND** 验证 MUST 覆盖 proposal/delta 不一致、active change 冲突、stale baseline、缺失基线、delta 后改动和未触达 Requirement 被破坏

#### Scenario: Product candidate 修改 canonical specs
- **WHEN** Product Project 的候选 Git tree 包含 canonical spec 变化
- **THEN** 产品验证 MUST 要求变化能够关联到通过 post-sync 的 active change 或本次归档 change receipt
- **AND** 只有 `openspec validate --all --strict` 通过 MUST NOT 被视为充分证据

#### Scenario: OpenSpec Component 上游升级
- **WHEN** package 中声明的 OpenSpec upstream version 变化
- **THEN** package check 和产品验证 MUST 对该版本运行 contract fixture corpus
- **AND** 未经支持或 fixture 失败 MUST 阻止 package verification 通过

#### Scenario: Runtime 投射门禁 Skill
- **WHEN** 临时 workspace 初始化、update 或 sync 支持的 Agent runtime
- **THEN** 产品 E2E MUST 验证 `openspec-contract-guard` 随 OpenSpec Component 物化并投射
- **AND** OpenSpec Component 被显式卸载时该 Skill MUST 随集合安全移除

#### Scenario: Runtime 组合和移除门禁 Contribution
- **WHEN** 临时 workspace 对支持的 Agent 安装或卸载 OpenSpec Component
- **THEN** 产品 E2E MUST 验证安装后的 `task-triage` 与 `task-finish` runtime 包含 Component-owned 门禁片段
- **AND** 产品 E2E MUST 验证卸载并 reconcile 后通用 runtime Skills 仍存在但门禁片段与命令完全消失
- **AND** workspace 中的通用 Skill 源 MUST NOT 因安装或卸载被注入门禁正文
