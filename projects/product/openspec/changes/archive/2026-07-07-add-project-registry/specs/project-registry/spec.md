## ADDED Requirements

### Requirement: root project registry
Buildr MUST 维护 root `projects.yml` registry，声明由 workspace 管理的 Projects。

#### Scenario: 初始化空 registry
- **WHEN** Agent executes `buildr init --target <root>`
- **THEN** Buildr MUST create `<root>/projects.yml` with schema version and an empty Project registry

#### Scenario: registry 记录 Project path
- **WHEN** Buildr records Project `<project>` in `projects.yml`
- **THEN** the registry MUST record its materialized path as `projects/<project>`
- **AND** the registry MUST NOT use an absolute path as the Project path

#### Scenario: registry 记录 Project title
- **WHEN** Buildr records Project `<project>` in `projects.yml`
- **THEN** the registry MUST record a human-readable `title` for the Project
- **AND** if no title is provided, Buildr MUST use `<project>` as the default title

#### Scenario: registry 可记录 Project description
- **WHEN** Buildr records Project `<project>` in `projects.yml`
- **THEN** the registry MUST support an optional `description` for a concise human-readable Project summary
- **AND** the description MUST NOT be treated as the authoritative location for Project business facts

#### Scenario: registry 只记录来源 metadata
- **WHEN** Buildr records Project metadata in `projects.yml`
- **THEN** the registry MUST limit Project data to registry and source metadata
- **AND** Project rules, memory, business facts, practices, Skills and service metadata MUST remain in `projects/<project>/`

### Requirement: project create maintains registry
Buildr 在创建或修复 Project asset root 时 MUST 更新 `projects.yml`。

#### Scenario: 创建 workspace-managed Project
- **WHEN** Agent executes `buildr project create <project> --target <root>` without a repo URL
- **THEN** Buildr MUST create or repair `<root>/projects/<project>/` using the Project baseline
- **AND** Buildr MUST record the Project in `<root>/projects.yml` with `repo.kind` set to `workspace`
- **AND** Buildr MUST record a Project title

#### Scenario: 创建 Git-managed Project
- **WHEN** Agent executes `buildr project create <project> --repo <git-url> --target <root>`
- **THEN** Buildr MUST materialize the Project asset repo at `<root>/projects/<project>/`
- **AND** Buildr MUST record the Git URL, remote, default branch and path in `<root>/projects.yml`
- **AND** Buildr MUST repair missing Project baseline assets without overwriting existing Project files

#### Scenario: 创建 Project 时提供说明
- **WHEN** Agent executes `buildr project create <project> --title <title> --description <description> --target <root>`
- **THEN** Buildr MUST record the provided title and description in `<root>/projects.yml`
- **AND** Buildr MUST NOT write the description into Project OpenSpec specs or knowledge as an authoritative project fact

#### Scenario: 不支持外部 Project 链接
- **WHEN** Agent executes `buildr project create <project> --repo <local-path>`
- **THEN** Buildr MUST reject the command
- **AND** Buildr MUST explain that Project assets must be materialized under `projects/<project>/`

#### Scenario: 既有目录由 project create 补登记
- **WHEN** Agent executes `buildr project create <project> --target <root>` and `<root>/projects/<project>/` already exists
- **THEN** Buildr MUST repair missing Project baseline assets and update `projects.yml`
- **AND** Buildr MUST NOT require a separate `project register` command
- **AND** Buildr MUST NOT overwrite existing Project files

### Requirement: Project repo boundaries
Buildr MUST 在 root workspace repo 与独立 Project asset repos 之间保持清晰的 Git ownership boundaries。

#### Scenario: workspace-managed Project follows root Git
- **WHEN** a Project registry entry has `repo.kind: workspace`
- **THEN** Buildr MUST treat `projects/<project>/` as root workspace assets
- **AND** Buildr MUST NOT add `projects/<project>/` to root `.gitignore`

#### Scenario: Git-managed Project is ignored by root Git
- **WHEN** a Project registry entry has `repo.kind: git`
- **THEN** Buildr MUST ensure root `.gitignore` ignores `projects/<project>/`
- **AND** Buildr MUST NOT require the root Git repo to store the nested Project repo contents

### Requirement: Project registry remains separate from service metadata
Buildr MUST 将 Project registry metadata 与 service repo metadata 保存在独立文件中。

#### Scenario: Project registry 不记录 services
- **WHEN** Buildr records Project `<project>` in `projects.yml`
- **THEN** `projects.yml` MUST NOT record that Project's service repo list
- **AND** service repo metadata MUST remain in `projects/<project>/services.yml`

#### Scenario: service create 不改变 Project repo kind
- **WHEN** Agent executes `buildr service create <project>/<service> <repo-ref> --target <root>`
- **THEN** Buildr MUST update `projects/<project>/services.yml`
- **AND** Buildr MUST NOT change the Project registry entry's `repo.kind`
