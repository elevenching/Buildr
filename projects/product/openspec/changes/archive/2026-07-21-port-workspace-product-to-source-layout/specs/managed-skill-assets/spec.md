## ADDED Requirements

### Requirement: Skills registry 必须复用 canonical Workspace identity
Buildr MUST 让 `skills/manifest.yml.workspaceId` 引用 `.buildr/workspace.yml.id` 表示的同一个 Workspace UUID，不得维护第二套独立 Workspace identity。

#### Scenario: 初始化新的 Workspace
- **WHEN** Buildr 初始化新的 Workspace
- **THEN** Buildr MUST 只生成一次 Workspace UUID
- **AND** `.buildr/workspace.yml.id` 与 `skills/manifest.yml.workspaceId` MUST 写入相同值

#### Scenario: 迁移已有 Skills registry identity
- **WHEN** 旧 Workspace 尚无 `.buildr/workspace.yml.id`，但 `skills/manifest.yml.workspaceId` 是合法 UUID
- **THEN** Workspace metadata migration MUST 复用该 UUID
- **AND** MUST NOT 另外生成 Workspace identity

#### Scenario: 补齐缺失的 Skills registry identity
- **WHEN** `.buildr/workspace.yml.id` 已存在且合法，但 `skills/manifest.yml.workspaceId` 缺失
- **THEN** 受控 Workspace migration MUST 将 canonical Workspace UUID 写入 Skills registry
- **AND** 写入 MUST 与 Workspace metadata migration 属于同一个可回滚 transaction

#### Scenario: 两处 Workspace identity 冲突
- **WHEN** `.buildr/workspace.yml.id` 与 `skills/manifest.yml.workspaceId` 都存在但值不同
- **THEN** Buildr MUST 在任何 mutation 前 fail closed
- **AND** doctor MUST 报告两个 identity 的来源与修复要求
- **AND** update、sync、migration 和 UI MUST NOT 静默选择其中一个或产生部分写入
