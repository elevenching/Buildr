## MODIFIED Requirements

### Requirement: root project registry
Buildr MUST 维护 root `projects/manifest.yml` registry，将由 Workspace 管理的 Projects 投影为存储无关 Project Domain。

#### Scenario: 初始化空 registry
- **WHEN** Agent executes `buildr init --target <root>`
- **THEN** Buildr MUST create `<root>/projects/manifest.yml` with `schemaVersion: buildr.projects/v2` and an empty Project registry
- **AND** Buildr MUST create `<root>/projects/` even when no Project exists

#### Scenario: registry 记录完整 Project entity
- **WHEN** Buildr records Project `<project>` in canonical `projects/manifest.yml`
- **THEN** the Project MUST contain UUID `id`, UUID `workspaceId`, `code`, `name`, `description` and `source`
- **AND** `workspaceId` MUST equal the current Workspace identity
- **AND** the manifest map key MUST equal `code` but MUST NOT replace the domain field

#### Scenario: registry 记录 materialized path
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** `source.path` MUST locate the Project as `projects/<code>` relative to the Workspace
- **AND** Buildr MUST NOT use an absolute or escaping path

#### Scenario: registry 使用封闭 schema
- **WHEN** Buildr writes Project metadata in `projects/manifest.yml`
- **THEN** the registry MUST limit Project data to the canonical Domain fields
- **AND** Project rules, memory, business facts, OpenSpec, Skills, capabilities, Commands, verification and service metadata MUST remain outside the Project entity
- **AND** Buildr update or sync MUST remove unknown Project registry fields only after a complete successful preflight

### Requirement: project create maintains registry
Buildr 在创建或修复 Project asset root 时 MUST 通过 Project Application 更新 canonical Project Domain。

#### Scenario: 创建 workspace-managed Project
- **WHEN** Agent executes `buildr project create <code> --target <root>` without a repo URL
- **THEN** Buildr MUST create or repair `<root>/projects/<code>/` using the Project baseline
- **AND** Buildr MUST record a new UUID identity, current Workspace UUID, `code`, `name`, `description` and `source.type: workspace`
- **AND** `source.path` MUST be `projects/<code>`

#### Scenario: 创建 Git-managed Project
- **WHEN** Agent executes `buildr project create <code> --repo <git-url> --integration-branch <branch> --target <root>`
- **THEN** Buildr MUST materialize the Project asset repo at `<root>/projects/<code>/`
- **AND** Buildr MUST record `source.type: git`, path, URL, declared remote and declared integration branch
- **AND** if integration branch is omitted, Buildr MUST resolve and persist the remote default branch or fail without partial registry writes

#### Scenario: 创建 Project 时提供说明
- **WHEN** Agent executes `buildr project create <code> --name <name> --description <description> --target <root>`
- **THEN** Buildr MUST record the provided name and description
- **AND** Buildr MUST accept legacy `--title` as compatibility input but canonical help and output MUST use `--name`
- **AND** Buildr MUST NOT write the description into Project OpenSpec specs or knowledge as an authoritative project fact

#### Scenario: 既有目录由 project create 补登记
- **WHEN** Agent executes `buildr project create <code> --target <root>` and `<root>/projects/<code>/` already exists
- **THEN** Buildr MUST validate source identity before repairing baseline assets and updating the registry
- **AND** Buildr MUST preserve an existing canonical Project UUID
- **AND** Buildr MUST NOT overwrite existing Project files

### Requirement: Project repo boundaries
Buildr MUST 根据 ProjectSource 在 root Workspace repo 与独立 Project asset repos 之间保持清晰的 Git ownership boundaries。

#### Scenario: workspace source follows root Git
- **WHEN** a Project has `source.type: workspace`
- **THEN** Buildr MUST treat `source.path` as root Workspace assets
- **AND** Buildr MUST NOT add that path to root `.gitignore`

#### Scenario: Git source is ignored by root Git
- **WHEN** a Project has `source.type: git`
- **THEN** Buildr MUST ensure root `.gitignore` ignores `source.path`
- **AND** Buildr MUST NOT require the root Git repo to store the nested Project repo contents

### Requirement: Project registry remains separate from service metadata
Buildr MUST 将 Project registry metadata 与 service repo metadata 保存在独立 manifest files 中。

#### Scenario: Project registry 不记录 services
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** `projects/manifest.yml` MUST NOT record that Project's service repo list
- **AND** service repo metadata MUST remain in `projects/<project>/services/manifest.yml`

#### Scenario: service create 不改变 Project source
- **WHEN** Agent executes `buildr service create <project>/<service> <repo-ref> --target <root>`
- **THEN** Buildr MUST update `projects/<project>/services/manifest.yml`
- **AND** Buildr MUST NOT change the Project entity's `source`

### Requirement: MVP Project registry convergence
Buildr MUST 通过显式 update 或 sync 将 Project directory facts 与兼容 registry 收敛为 canonical `buildr.projects/v2`，普通读取与 app 启动 MUST 保持零写入。

#### Scenario: v1 registry compatibility read
- **WHEN** Buildr reads a valid `buildr.projects/v1` registry
- **THEN** Buildr MUST project key, `title`, `description`, `path` and `repo` into the v2 Domain view
- **AND** `repo.defaultBranch` MUST map to `source.git.integrationBranch`
- **AND** the result MUST report `migrationRequired: true` without modifying files

#### Scenario: v1 registry explicit migration
- **WHEN** Agent runs canonical update or sync for a Workspace with a valid v1 registry
- **THEN** Buildr MUST preflight all entries, generate one UUID per Project, copy the current Workspace UUID and atomically write v2
- **AND** a failed preflight MUST leave the v1 bytes unchanged
- **AND** a repeated update or sync MUST preserve generated identities

#### Scenario: 从 Project 目录补登记
- **WHEN** `<root>/projects/<code>/` is a valid Project directory but canonical registry does not declare `<code>`
- **THEN** Buildr update or sync MUST add a complete Project entity
- **AND** Buildr MUST infer source type from the actual repository boundary and resolve required Git declaration fields before writing

#### Scenario: Project registry drift
- **WHEN** the registry contains invalid identity, workspace association, code/key mismatch, unsafe path, missing required fields, unknown fields or incomplete description
- **THEN** doctor MUST report a stable warning or error with migration/repair next action
- **AND** Buildr MUST NOT silently repair the registry during ordinary read or app startup

### Requirement: Project create 验证既有 repo identity
Buildr MUST 在修复既有 Project baseline 或 registry 前验证 materialized Project 的实际 source identity 与命令和 Domain 声明一致。

#### Scenario: 相同 Git 来源幂等修复
- **WHEN** `project create --repo <git-url>` 的目标已是 Git repo，且实际 declared remote URL、命令 URL 和既有 Project source identity 一致
- **THEN** Buildr MUST allow repair of missing baseline and low-risk metadata
- **AND** Buildr MUST preserve Project `id`, `workspaceId`, `code`, path and source identity

#### Scenario: 既有 Project 来源冲突
- **WHEN** target repo remote, command URL, source type, declared URL or path conflict
- **THEN** Buildr MUST fail before any Project, registry or `.gitignore` write
- **AND** Buildr MUST NOT silently relink, replace or rewrite source identity

#### Scenario: 新 Git Project clone 失败
- **WHEN** a new Project clone or subsequent baseline preflight fails
- **THEN** Buildr MUST NOT leave a partial Project directory or registry entry

## ADDED Requirements

### Requirement: Project Git 声明与观察必须分离
Buildr MUST 将稳定 Git source 声明保存在 Project Domain，并通过 Git adapter 实时观察工作状态。

#### Scenario: 查询 Git Project 实际状态
- **WHEN** Application reads a Git Project detail
- **THEN** it MUST query repository presence, current branch, HEAD, dirty state, upstream, ahead/behind and declared remote actual URL
- **AND** it MUST NOT persist those observed fields in `projects/manifest.yml`

#### Scenario: 当前分支偏离 integration branch
- **WHEN** observed current branch differs from declared `integrationBranch`
- **THEN** doctor and UI MUST expose the drift as an explainable diagnostic
- **AND** Buildr MUST NOT automatically checkout, stash, merge or discard changes

#### Scenario: remote identity conflict
- **WHEN** the declared remote is missing or its actual URL conflicts with `source.git.url`
- **THEN** doctor MUST report an error with declared and observed identity
- **AND** Project mutations that depend on source identity MUST fail closed

#### Scenario: workspace Project follows root state
- **WHEN** a Project uses `source.type: workspace`
- **THEN** Buildr MUST NOT require a Project-level `integrationBranch`
- **AND** root checkout branch policy MUST remain a Workspace/task-finish concern

### Requirement: Project metadata update 必须受控并防止覆盖
Project Application MUST only allow low-risk metadata updates using a registry revision compare-and-swap.

#### Scenario: 修改 Project name 与 description
- **WHEN** caller submits `name` or `description` with the current registry revision
- **THEN** Application MUST validate the Domain, atomically update v2 manifest and return the new revision
- **AND** all other Project entries and fields MUST remain unchanged

#### Scenario: 拒绝 identity 或 source 修改
- **WHEN** caller submits `id`, `workspaceId`, `code`, `source`, path, Git declaration or unknown fields
- **THEN** Application MUST reject the whole mutation before write

#### Scenario: registry revision 冲突
- **WHEN** the supplied revision differs from actual manifest bytes
- **THEN** Application MUST return a stable conflict result
- **AND** MUST NOT merge or overwrite external changes
