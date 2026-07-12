## MODIFIED Requirements

### Requirement: service metadata 作为最小服务资产索引
Buildr MVP MUST 使用项目级 `services/manifest.yml` 作为 service metadata 的最小索引，记录目录结构无法表达的信息。

#### Scenario: 记录 Git 来源
- **WHEN** service repo 来源是 Git URL
- **THEN** service metadata MUST record repo kind、Git URL、remote、默认分支和 repo path in `projects/<project>/services/manifest.yml`

#### Scenario: 本地路径导入
- **WHEN** service repo 来源是 workspace 外部本地路径
- **THEN** Buildr MUST materialize the Service asset under `projects/<project>/services/<service>/`
- **AND** service metadata MUST NOT record the external local source path

#### Scenario: 记录所属 Project
- **WHEN** Buildr writes `projects/<project>/services/manifest.yml`
- **THEN** service metadata MUST record `project: <project>`
- **AND** doctor MUST warn when the recorded project differs from the manifest's containing Project directory

#### Scenario: 空服务集合
- **WHEN** Project has no services
- **THEN** Buildr MUST keep `projects/<project>/services/manifest.yml` as an empty service registry
- **AND** Buildr MUST keep `projects/<project>/services/` as the service collection directory

#### Scenario: service metadata 使用封闭 schema
- **WHEN** Buildr records Service metadata in `services/manifest.yml`
- **THEN** each Service entry MUST include title、description、type、path and repo.kind
- **AND** Buildr update or sync MUST remove unknown Service metadata fields

#### Scenario: service AGENTS.md 不进入 metadata
- **WHEN** a Service directory contains `AGENTS.md`
- **THEN** Buildr MUST treat that file as the Service's own rule asset
- **AND** `services/manifest.yml` MUST NOT record a `rules.source` pointer to it
- **AND** runtime adapters MUST expose applicable Service `AGENTS.md` files through their Agent-specific rule projection behavior

### Requirement: 共享服务通过 Project 表达
Buildr MVP MUST 使用普通 Project 表达共享、基础或平台服务，不得使用 root `shared/` 作为默认 service 命名空间。

#### Scenario: 用户未说明 service 归属
- **WHEN** 用户要求 Agent 接入 service repo 但没有说明它属于哪个项目或共享服务集合
- **THEN** Agent MUST 引导用户选择或创建一个 Project，例如 `foundation`、`platform` 或用户指定名称

#### Scenario: 共享服务 metadata
- **WHEN** service 归属共享、基础或平台服务集合
- **THEN** Buildr MUST 使用 `projects/<project>/services/manifest.yml` 维护 service metadata

#### Scenario: 共享服务默认目录
- **WHEN** Buildr 管理共享、基础或平台 service repo
- **THEN** Buildr MUST 使用 `projects/<project>/services/<service>/` 作为默认 service repo 目录

## ADDED Requirements

### Requirement: legacy service metadata convergence
Buildr MUST support converging existing `projects/<project>/services.yml` into `projects/<project>/services/manifest.yml`.

#### Scenario: 只有旧 services.yml
- **WHEN** an existing Project has `projects/<project>/services.yml` and no `projects/<project>/services/manifest.yml`
- **THEN** Buildr update or sync MUST migrate service metadata to `projects/<project>/services/manifest.yml`
- **AND** Buildr MUST keep only fields defined by the Buildr Service manifest schema
- **AND** Buildr MUST NOT migrate legacy `rules.source` fields into the new Service manifest
- **AND** Buildr MUST remove the old `projects/<project>/services.yml`

#### Scenario: 新旧 service metadata 同时存在
- **WHEN** both `projects/<project>/services.yml` and `projects/<project>/services/manifest.yml` exist with different content
- **THEN** Buildr update or sync MUST treat `services/manifest.yml` as the source of truth
- **AND** Buildr MUST remove the old `projects/<project>/services.yml`

#### Scenario: 从 Service 目录补登记
- **WHEN** `projects/<project>/services/<service>/` is a valid Service directory but `services/manifest.yml` does not declare `<service>`
- **THEN** Buildr update or sync MUST add a minimal Service registry entry
- **AND** Buildr MUST infer `repo.kind` from whether `projects/<project>/services/<service>/.git/` exists

### Requirement: Git boundary maintenance for managed repos
Buildr MUST 在最近的 parent Git repository 中维护 nested Git Project 与 Service repos 的 ignore boundaries。

#### Scenario: 独立 Project repo
- **WHEN** `<root>/projects/<project>/` is a Git repo and `<root>/` is the nearest parent Git repo
- **THEN** Buildr create, update or sync MUST ensure root `.gitignore` ignores `/projects/<project>/`

#### Scenario: 独立 Service repo under Git Project
- **WHEN** `<root>/projects/<project>/services/<service>/` is a Git repo and `<root>/projects/<project>/` is the nearest parent Git repo
- **THEN** Buildr create, update or sync MUST ensure Project `.gitignore` ignores `/services/<service>/`

#### Scenario: 独立 Service repo under non-Git Project
- **WHEN** `<root>/projects/<project>/services/<service>/` is a Git repo, `<root>/projects/<project>/` is not a Git repo and `<root>/` is the nearest parent Git repo
- **THEN** Buildr create, update or sync MUST ensure root `.gitignore` ignores `/projects/<project>/services/<service>/`

#### Scenario: Git boundary drift
- **WHEN** the nearest parent Git repo does not ignore a nested Git Project or Service repo
- **THEN** Buildr doctor MUST report a warning
