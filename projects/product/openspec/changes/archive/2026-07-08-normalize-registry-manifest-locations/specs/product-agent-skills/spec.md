## ADDED Requirements

### Requirement: Skills manifest schemaVersion
Buildr MUST 要求 workspace/project `skills/manifest.yml` 声明 Skill manifest schema version。

#### Scenario: 新建 Skills manifest
- **WHEN** Buildr creates a workspace or project `skills/manifest.yml`
- **THEN** Buildr MUST write `schemaVersion: buildr.skills/v1`

#### Scenario: 旧 Skills manifest 缺 schemaVersion
- **WHEN** an existing `skills/manifest.yml` has valid Skill entries but no `schemaVersion`
- **THEN** Buildr update or sync MUST add `schemaVersion: buildr.skills/v1`
- **AND** Buildr doctor MUST report a warning before the file is repaired

#### Scenario: Skills manifest schemaVersion 错误
- **WHEN** `skills/manifest.yml` declares an unsupported `schemaVersion`
- **THEN** Buildr doctor MUST report a warning
