# project-registry Specification

## Purpose
定义 root Project registry 的结构、Project 创建与修复、Git 边界，以及从 `projects/` 目录事实收敛 registry 状态的行为。
## Requirements
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
Buildr MUST 将 Project registry metadata 与 service repo metadata 保存在独立 manifest files 中。

#### Scenario: Project registry 不记录 services
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** `projects/manifest.yml` MUST NOT record that Project's service repo list
- **AND** service repo metadata MUST remain in `projects/<project>/services/manifest.yml`

#### Scenario: service create 不改变 Project repo kind
- **WHEN** Agent executes `buildr service create <project>/<service> <repo-ref> --target <root>`
- **THEN** Buildr MUST update `projects/<project>/services/manifest.yml`
- **AND** Buildr MUST NOT change the Project registry entry's `repo.kind`

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

### Requirement: Project create 验证既有 repo identity
Buildr MUST 在修复既有 Project baseline 或 registry 前验证 materialized Project 的实际 repo identity 与命令和 registry 一致。

#### Scenario: 相同 Git 来源幂等修复
- **WHEN** `project create --repo <git-url>` 的目标已是 Git repo，且实际 remote、命令 URL 和既有 registry identity 一致
- **THEN** Buildr MUST 允许修复缺失 baseline 和 registry 低风险字段
- **AND** Buildr MUST NOT 覆盖既有 Project 文件

#### Scenario: 既有 Project 来源冲突
- **WHEN** 目标 repo remote、命令 URL、registry repo kind 或 registry URL 互相不一致
- **THEN** Buildr MUST 在任何 Project、registry 或 `.gitignore` 写入前失败
- **AND** Buildr MUST NOT 静默 relink、replace 或改写 repo identity

#### Scenario: 新 Git Project clone 失败
- **WHEN** 新 Project Git clone 或后续 baseline preflight 失败
- **THEN** Buildr MUST NOT 留下半完成 Project 目录或 registry entry
