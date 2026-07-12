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
- **AND** Project rules, memory, business facts, practices, Skills and service metadata MUST remain in `projects/<project>/`
- **AND** Buildr update or sync MUST remove unknown Project registry fields

### Requirement: project create maintains registry
Buildr 在创建或修复 Project asset root 时 MUST 更新 `projects/manifest.yml`。

#### Scenario: 创建 workspace-managed Project
- **WHEN** Agent executes `buildr project create <project> --target <root>` without a repo URL
- **THEN** Buildr MUST create or repair `<root>/projects/<project>/` using the Project baseline
- **AND** Buildr MUST record the Project in `<root>/projects/manifest.yml` with `repo.kind` set to `workspace`
- **AND** Buildr MUST record a Project title, description and path

#### Scenario: 创建 Git-managed Project
- **WHEN** Agent executes `buildr project create <project> --repo <git-url> --target <root>`
- **THEN** Buildr MUST materialize the Project asset repo at `<root>/projects/<project>/`
- **AND** Buildr MUST record the Git URL, remote, default branch and path in `<root>/projects/manifest.yml`
- **AND** Buildr MUST repair missing Project baseline assets without overwriting existing Project files

#### Scenario: 创建 Project 时提供说明
- **WHEN** Agent executes `buildr project create <project> --title <title> --description <description> --target <root>`
- **THEN** Buildr MUST record the provided title and description in `<root>/projects/manifest.yml`
- **AND** Buildr MUST NOT write the description into Project OpenSpec specs or knowledge as an authoritative project fact

#### Scenario: 不支持外部 Project 链接
- **WHEN** Agent executes `buildr project create <project> --repo <local-path>`
- **THEN** Buildr MUST reject the command
- **AND** Buildr MUST explain that Project assets must be materialized under `projects/<project>/`

#### Scenario: 既有目录由 project create 补登记
- **WHEN** Agent executes `buildr project create <project> --target <root>` and `<root>/projects/<project>/` already exists
- **THEN** Buildr MUST repair missing Project baseline assets and update `projects/manifest.yml`
- **AND** Buildr MUST NOT require a separate `project register` command
- **AND** Buildr MUST NOT overwrite existing Project files

### Requirement: Project registry remains separate from service metadata
Buildr MUST 将 Project registry metadata 与 service repo metadata 保存在独立 manifest files 中。

#### Scenario: Project registry 不记录 services
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** `projects/manifest.yml` MUST NOT record that Project's service repo list
- **AND** service repo metadata MUST remain in `projects/<project>/services/manifest.yml`

#### Scenario: service create 不改变 Project repo kind
- **WHEN** Agent executes `buildr service create <project>/<service> <repo-ref> --target <root>`
- **THEN** Buildr MUST update `projects/<project>/services/manifest.yml`
- **AND** Buildr MUST NOT change the Project registry entry's `repo.kind`

## ADDED Requirements

### Requirement: MVP Project registry convergence
Buildr MUST 从 `projects/` directory 收敛 Project registry state，且 MUST NOT 将 root `projects.yml` 视为 long-term source。

#### Scenario: 清理旧 projects.yml
- **WHEN** an existing workspace has `<root>/projects.yml`
- **THEN** Buildr update or sync MUST remove `<root>/projects.yml`
- **AND** Buildr MUST NOT read it as a migration source

#### Scenario: 从 Project 目录补登记
- **WHEN** `<root>/projects/<project>/` is a valid Project directory but `projects/manifest.yml` does not declare `<project>`
- **THEN** Buildr update or sync MUST add a minimal Project registry entry
- **AND** Buildr MUST infer `repo.kind` from whether `<root>/projects/<project>/.git/` exists

#### Scenario: Project registry drift
- **WHEN** `projects/manifest.yml` contains unknown fields, invalid paths, missing required fields or TODO descriptions
- **THEN** Buildr doctor MUST report a warning
- **AND** Buildr update or sync MUST repair low-risk defaults and remove unknown fields
