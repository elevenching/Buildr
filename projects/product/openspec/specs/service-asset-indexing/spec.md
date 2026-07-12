# service 资产索引规范

## Purpose

定义 Buildr MVP 中 service create、service metadata、共享/基础服务 Project、服务语义和规则入口的资产索引行为。
## Requirements
### Requirement: service create 支持本地路径和 Git URL
Buildr MVP MUST 使用一个 `service create` 命令接入本地路径或 Git URL，并根据 repo-ref 类型自动选择处理方式。

#### Scenario: 接入本地路径
- **WHEN** Agent 调用 `buildr service create <project>/<service> <local-path>`
- **THEN** Buildr MUST 校验本地路径可访问性和 Git 仓库状态，并维护 service 引用关系

#### Scenario: 接入 Git URL
- **WHEN** Agent 调用 `buildr service create <project>/<service> <git-url>`
- **THEN** Buildr MUST 默认 clone 该 Git repo 到项目下的 service 目录，并维护 service 引用关系

### Requirement: Git URL 默认使用远端 HEAD
Buildr MVP MUST 在 Git URL 未指定分支时使用远端 HEAD 作为默认 clone 目标。

#### Scenario: 用户未指定分支
- **WHEN** `service create` 接收到 Git URL 且用户没有指定分支
- **THEN** Buildr MUST 使用远端 HEAD 对应分支完成 clone

#### Scenario: 用户指定分支
- **WHEN** 用户或 Agent 明确指定 service repo 分支
- **THEN** Buildr MUST 使用指定分支完成 clone 或记录该分支意图

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

### Requirement: service metadata 支持跨用户补全 repo
Buildr MVP MUST 允许 Agent 根据 service metadata 识别缺失 service repo，并引导用户决定是否自动 clone 或补全。

#### Scenario: 共享 workspace 后缺失 service repo
- **WHEN** 新用户或另一个 Agent 打开共享的 Buildr workspace 且某个 metadata 声明的 Git service repo 不存在于本地
- **THEN** Buildr MUST 能提供足够信息让 Agent 询问用户是否自动 clone 该 repo

#### Scenario: 不要求用户手动查找 Git URL
- **WHEN** service metadata 已记录 Git URL
- **THEN** Agent MUST NOT 要求用户打开 Git 页面复制该 URL 才能补全 repo

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

### Requirement: service metadata 表达服务语义和规则入口
Buildr MVP MUST allow service metadata to record Service type, while Service-level Rules MUST be discovered from the Service directory's `AGENTS.md` convention rather than from a rule-source pointer in metadata.

#### Scenario: 记录服务类型
- **WHEN** Agent 或用户指定 Service 类型
- **THEN** Buildr MUST 能在 Service metadata 中记录 backend、frontend、mobile、library 或 infra 等服务语义

#### Scenario: Service 规则入口使用目录约定
- **WHEN** `projects/<project>/services/<service>/AGENTS.md` 存在
- **THEN** Buildr MUST treat that file as the Service-level rule source
- **AND** runtime adapters MUST discover it through canonical scope and recursive `AGENTS.md` projection
- **AND** `services/manifest.yml` MUST NOT record `rules.source`、`rules` or an equivalent rule-source pointer

#### Scenario: Service manifest 保持封闭 schema
- **WHEN** Buildr creates、updates or migrates `services/manifest.yml`
- **THEN** Buildr MUST keep Service rule-source fields outside the manifest schema
- **AND** Buildr MUST NOT migrate legacy `rules.source` into the manifest

#### Scenario: 不记录 Service repo runtime 投射意图
- **WHEN** Buildr 写入 Service metadata
- **THEN** Service metadata MUST NOT 要求或默认记录向 Service repo 投射 Agent runtime 的意图

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

### Requirement: service create 验证既有 repo identity
Buildr MUST 在写入 Service metadata 前验证 materialized Service repo 的实际 identity 与命令和既有 metadata 一致。

#### Scenario: 相同 Git 来源重复创建
- **WHEN** `service create <project>/<service> <git-url>` 的目标已是 Git repo，且实际 remote、命令 URL 和 metadata identity 一致
- **THEN** Buildr MUST 允许幂等修复 metadata 和 Git boundary
- **AND** Buildr MUST NOT 重新 clone 或覆盖 Service 文件

#### Scenario: 既有 Service Git 来源冲突
- **WHEN** 目标 remote、命令 Git URL 或既有 metadata URL 不一致
- **THEN** Buildr MUST 在 metadata 和 `.gitignore` 写入前失败
- **AND** Buildr MUST 报告实际与期望来源并要求显式解决

#### Scenario: 本地来源目标已存在
- **WHEN** `service create` 使用本地路径且目标 Service 目录已存在
- **THEN** Buildr MUST 保持既有拒绝语义
- **AND** Buildr MUST NOT 删除、合并或覆盖目标目录

#### Scenario: 新 Service materialization 失败
- **WHEN** clone、copy 或 source transaction 任一步骤失败
- **THEN** Buildr MUST NOT 留下半完成 Service 目录、metadata entry 或 Git boundary 变更
