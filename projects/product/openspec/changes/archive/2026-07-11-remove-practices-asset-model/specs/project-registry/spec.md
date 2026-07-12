## MODIFIED Requirements

### Requirement: root project registry
Buildr MUST 维护 root `projects/manifest.yml` registry，声明由 workspace 管理的 Projects。

#### Scenario: 初始化空 registry
- **WHEN** Agent executes `buildr init --target <root>`
- **THEN** Buildr MUST create `<root>/projects/manifest.yml` with schema version and an empty Project registry
- **AND** Buildr MUST create `<root>/projects/` even when no Project exists

#### Scenario: registry 记录 Project path
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** the registry MUST record its materialized path as `projects/<project>`
- **AND** the registry MUST NOT use an absolute path as the Project path

#### Scenario: registry 记录 Project title
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** the registry MUST record a human-readable `title` for the Project
- **AND** if no title is provided, Buildr MUST use `<project>` as the default title

#### Scenario: registry 记录 Project description
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** the registry MUST record a `description` for a concise human-readable Project summary
- **AND** the description MUST NOT be treated as the authoritative location for Project business facts
- **AND** if no description is available, Buildr update or sync MAY write a TODO description and doctor MUST report a warning

#### Scenario: registry 使用封闭 schema
- **WHEN** Buildr records Project metadata in `projects/manifest.yml`
- **THEN** the registry MUST limit Project data to the schema fields defined by Buildr
- **AND** Project rules, memory, business facts, OpenSpec, Skills and service metadata MUST remain in `projects/<project>/`
- **AND** Buildr update or sync MUST remove unknown Project registry fields
