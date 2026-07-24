## MODIFIED Requirements

### Requirement: service create 支持本地路径和 Git URL
Buildr MUST 使用一个 `service create` 命令接入本地路径或 Git URL，并将结果写成 canonical Service Domain。

#### Scenario: 接入本地路径
- **WHEN** Agent 调用 `buildr service create <project>/<service> <local-path>`
- **THEN** Buildr MUST 校验本地路径可访问性和 Git 仓库状态，将内容物化到 canonical Service path
- **AND** Buildr MUST NOT 在 Domain 中保存 workspace 外部来源路径

#### Scenario: 接入 Git URL
- **WHEN** Agent 调用 `buildr service create <project>/<service> <git-url>`
- **THEN** Buildr MUST clone 或幂等核对该 Git repo，并写入 Service source 声明

### Requirement: Git URL 默认使用远端 HEAD
Buildr MUST 在 Git URL 未指定 integration branch 时使用远端 HEAD 作为 clone 目标和稳定 integration branch 声明。

#### Scenario: 用户未指定分支
- **WHEN** `service create` 接收到 Git URL 且用户没有指定 `--integration-branch` 或兼容 `--branch`
- **THEN** Buildr MUST 解析远端 HEAD 对应分支完成 clone
- **AND** Buildr MUST 将该分支记录为 `source.git.integrationBranch`

#### Scenario: 用户指定分支
- **WHEN** 用户或 Agent 明确指定 integration branch
- **THEN** Buildr MUST 使用指定分支完成 clone 或核对既有 checkout
- **AND** Buildr MUST 将其作为稳定声明而非当前分支快照

### Requirement: service metadata 作为最小服务资产索引
Buildr MUST 使用项目级 `services/manifest.yml` 作为 Service Domain 的文件系统投影，并以 `buildr.services/v2` 作为 canonical schema。

#### Scenario: Service entity 字段完整
- **WHEN** Buildr 写入 canonical Service entry
- **THEN** entry MUST 包含 UUID `id`、`workspaceId`、`projectId`、`code`、`name`、`description`、`type` 与 `source`
- **AND** manifest map key MUST 等于 `code`

#### Scenario: 文件系统定位
- **WHEN** Service 通过文件系统 repository 持久化
- **THEN** `source.path` MUST 等于 `projects/<projectCode>/services/<serviceCode>`
- **AND** Application MUST 能通过该 path 定位实际资产

#### Scenario: Git 来源
- **WHEN** Service source 类型是 Git
- **THEN** source MUST 记录 `url`、`remote` 和 `integrationBranch`
- **AND** current branch、HEAD、dirty、upstream、ahead 与 behind MUST NOT 写入 Domain

#### Scenario: 父实体关联
- **WHEN** repository 读取 Project 下的 Service registry
- **THEN** 每个 Service 的 `workspaceId` 与 `projectId` MUST 分别匹配当前 Workspace 与 Project
- **AND** 顶层 `projectId` MUST 匹配当前 Project

#### Scenario: 空服务集合
- **WHEN** Project 没有 Service
- **THEN** Buildr MUST 保留 canonical 空 Service registry 和 Service collection directory

#### Scenario: 封闭 schema 与规则边界
- **WHEN** Buildr 写入 Service metadata
- **THEN** repository MUST 移除未知字段
- **AND** Service Rules MUST 继续从 Service 目录的 `AGENTS.md` 发现，不得写入 registry

### Requirement: legacy service metadata convergence
Buildr MUST 兼容读取旧 `services.yml` 与 `buildr.services/v1`，并只在显式 update/sync 中收敛为 `buildr.services/v2`。

#### Scenario: 普通读取旧 registry
- **WHEN** CLI、doctor 或 app 读取 legacy Service metadata
- **THEN** Buildr MUST 产生不写盘的兼容 Domain projection
- **AND** MUST 返回 `migrationRequired` 与明确 next action

#### Scenario: 显式迁移 v1
- **WHEN** Agent 运行 canonical update/sync 且 v1 registry 通过预检
- **THEN** Buildr MUST 从 Workspace 与 Project 获取父 UUID，为每个 Service 生成 UUID 并原子写入 v2
- **AND** v1 `title` MUST 迁移为 `name`
- **AND** v1 `repo.branch` MUST 优先迁移为 `source.git.integrationBranch`，缺失时回退到 `repo.defaultBranch`

#### Scenario: 旧 services.yml 与 manifest 同时存在
- **WHEN** 两者同时存在
- **THEN** `services/manifest.yml` MUST 是 source of truth
- **AND** 显式收敛 MUST 删除旧 `services.yml`

#### Scenario: 迁移失败
- **WHEN** 任一父关联、Git identity 或字段校验失败
- **THEN** Buildr MUST 保持 registry、Service 文件和 Git boundary 零写入

## ADDED Requirements

### Requirement: Service Git 声明与观察必须分离
Buildr MUST 从 Service Domain 的稳定 Git 声明生成实时 observed view，不得把观察结果持久化回 Domain。

#### Scenario: 读取 Git Service 详情
- **WHEN** Application 读取 Git Service 详情
- **THEN** 返回值 MUST 分离 `service.source.git` 与 `observed`
- **AND** MUST 对 remote identity、current branch、dirty 与 upstream drift 生成结构化 comparison

#### Scenario: 当前分支偏离 integration branch
- **WHEN** 当前分支不同于 `source.git.integrationBranch`
- **THEN** doctor 和 UI MUST 展示可解释诊断
- **AND** Buildr MUST NOT 自动 checkout、stash、merge 或 rebase

### Requirement: Service metadata update 必须受控并防止覆盖
Buildr MUST 只允许通过 Application 修改 Service 的 `name`、`description` 和 `type`，并使用 registry revision 防止覆盖外部变化。

#### Scenario: 修改允许字段
- **WHEN** 请求携带当前 revision 并修改允许字段
- **THEN** Buildr MUST 原子写入 canonical registry 并返回新 revision

#### Scenario: revision 已变化
- **WHEN** 请求 revision 不等于当前文件 revision
- **THEN** Buildr MUST 返回 conflict 且零写入

#### Scenario: 修改稳定身份或 source
- **WHEN** 请求尝试修改 id、父 UUID、code、source 或 path
- **THEN** Buildr MUST 拒绝整次请求
