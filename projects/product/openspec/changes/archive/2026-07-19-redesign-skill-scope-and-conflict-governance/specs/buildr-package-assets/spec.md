## ADDED Requirements

### Requirement: Package baseline 只交付 workspace Skill authority
Buildr package MUST 只向 workspace baseline 交付受管 Skill manifest、contracts、sources 和 Components，并 MUST NOT 在默认 Project template 中交付 Skill source assets。

#### Scenario: 初始化 package workspace
- **WHEN** package manifest 将 Skill baseline 映射到新 workspace
- **THEN** 所有 workspace-managed Skill entries MUST 写入根 `skills/manifest.yml`
- **AND** Project template MUST NOT 包含 `skills/` 或 `skills/manifest.yml`

#### Scenario: Package Skill 声明 Project applicability
- **WHEN** 随包 Skill 只适用于特定 Project 类型或 capability context
- **THEN** package MUST 通过 Project capability/applicability declaration 引用 workspace Skill ID
- **AND** MUST NOT 复制 Skill source 到 Project template

### Requirement: Package verification 覆盖 destination 与冲突迁移
产品验证 MUST 覆盖 workspace-only source、user/workspace render destination、effective inventory conflict 和 legacy Project Skill migration。

#### Scenario: 临时 workspace Skill 生命周期
- **WHEN** package verification 创建临时 workspace 并维护 Skill
- **THEN** verification MUST 覆盖 workspace add/remove、workspace render、显式 user render 隔离和最终 doctor
- **AND** MUST 证明 init/sync 不写用户层

#### Scenario: Project Skill migration fixtures
- **WHEN** verification 检查 legacy workspace
- **THEN** MUST 覆盖 Project 独有 Skill、等价重复、同名不同内容、Project binding 和 migration rollback
- **AND** blocking conflict MUST 保持整次零写入

## REMOVED Requirements

### Requirement: package manifest 声明 workspace Skill 引用来源
**Reason**: Requirement 同时允许 workspace/project manifest 引用随包 Skill，继续制造双层 source authority。
**Migration**: package Skill sources 只由 workspace manifest 引用；Project 通过 capability/applicability context 引用 workspace Skill ID。
