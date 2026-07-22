## Context

当前 `projects/<project>/services/manifest.yml` 同时承担数据结构、持久化格式和 CLI 实现约定，Service 解析、创建、Git 探测与 workspace 流程集中在旧 application 模块。Workspace、Project 产品切片已经建立 Domain、Application、Infrastructure、Interfaces 分层；Service 应沿用该分层，并通过父实体 UUID 建立稳定关联。

本设计继续以文件系统为当前存储介质。每个 Project 下的 `services/manifest.yml` 是 Service Domain 的 canonical 文件投影；未来换成数据库 repository 时，Application 与 Interfaces 不应改变。SaaS、远程 Workspace Query 和 Agent session connector 不在本次范围。

## Goals / Non-Goals

**Goals:**

- 建立稳定、存储无关且字段用途明确的 Service Domain。
- 通过 `workspaceId`、`projectId` 表达父实体关联，同时保留文件系统定位所需的 `source.path`。
- 让 manifest v1 安全迁移到 v2，保持普通读取零写入。
- 让 CLI、doctor 和本地 UI 共用 Service Application。
- 区分 Git 的声明配置与实时观察状态，交付 Service 查看、低风险修改与 prompt-only 新增的完整产品切片。

**Non-Goals:**

- 不引入 SQLite、SaaS、审批、多 Workspace 或远程查询。
- 不让 Buildr 自动切分支、stash、merge、rebase 或调度 Agent。
- 不允许页面直接改变 Service identity、父实体、source 或文件路径。
- 不把 Service Rules、任务状态、验证结果或 runtime 投射意图塞进 Service entity。

## Decisions

### 1. Service 使用实体字段与 ServiceSource 值对象

| 字段 | 类型 | 必填 | 用途 | 约束与文件映射 |
|---|---|---:|---|---|
| `id` | UUID string | 是 | Service 跨存储、重命名和引用时的稳定身份 | 所有实体统一 UUID；保存在 Service entry 中，不从 `code` 或 path 派生 |
| `workspaceId` | UUID string | 是 | 显式关联所属 Workspace，方便跨 Project 查询和未来数据库外键 | 必须等于当前 Workspace `id`；保存在每个 Service entry 中 |
| `projectId` | UUID string | 是 | 显式关联直接所属 Project | 必须等于承载该 registry 的 Project `id`；保存在每个 Service entry 中 |
| `code` | string | 是 | 人、Agent 与 CLI 可读的稳定业务标识 | 使用安全 code 格式且在 Project 内唯一；manifest map key 必须与 `code` 一致 |
| `name` | string | 是 | 页面和诊断展示的短名称 | 非空；v1 `title` 迁移为该字段 |
| `description` | string | 是 | Service 的简要用途说明 | 必须非空；v1 缺失时兼容投影为明确 TODO，doctor 提示补全 |
| `type` | string | 是 | 表达 backend、frontend、mobile、library、infra 等服务语义 | 非空、开放词表；不与 `source.type` 混用 |
| `source` | `ServiceSource` | 是 | 描述 Service 当前通过何种介质落地及其声明身份 | 值对象，详见下表 |

`ServiceSource` 字段：

| 字段 | 类型 | 必填 | 用途 | 约束与文件映射 |
|---|---|---:|---|---|
| `type` | `workspace \| git` | 是 | 区分跟随父级 Git 的目录与独立 Git Service | v1 `repo.kind` 迁移为该字段 |
| `path` | workspace-relative string | 是 | 让文件系统 repository 能由 Domain 定位 Service 实际目录 | 必须等于 `projects/<projectCode>/services/<code>`，禁止绝对路径与越界 |
| `git.url` | string | Git 必填 | 声明独立 Service repo 的来源身份 | v1 `repo.url` 迁移；workspace source 禁止该字段 |
| `git.remote` | string | Git 必填 | 声明用于核对来源 URL 的 remote 名称 | v1 `repo.remote` 迁移，缺省为 `origin` |
| `git.integrationBranch` | string | Git 必填 | 声明任务完成后应集成并保持的稳定分支 | 优先迁移 v1 `repo.branch`，否则迁移 `repo.defaultBranch`；不是当前 checkout 状态 |

`workspaceId` 是有意保留的冗余父关联：应用层查询 Service 时无需先按 `projectId` 回查 Workspace，同时 repository 必须校验两层关系一致，避免冗余产生歧义。

### 2. canonical manifest 升级为 `buildr.services/v2`

每个 Project 继续拥有独立 Service registry。v2 顶层记录 `projectId`，entry 保存完整 Service entity；filesystem repository 同时提供 v2 canonical reader/writer、v1 compatibility projection、显式 migration plan 和基于 manifest bytes 的 revision。

普通 CLI 查询、doctor 和 app 启动不得迁移。Application 返回 `migrationRequired` 与 next action；修改请求在迁移前失败。显式 update/sync 从 Workspace/Project Domain 获取父 UUID，为每个 v1 entry 生成 UUID，并一次原子写入 v2。

### 3. Git 声明状态与观察状态分离

Service Domain 只保存 source 声明。Git Infrastructure 复用有界 observer，在请求时读取 `repository`、`currentBranch`、`head`、`dirty`、`upstream`、`ahead`、`behind` 与 `remoteUrl`。Application 对比声明与实际：remote 缺失或 URL 冲突为 error；branch drift、dirty 和 upstream drift 为 warning/info。Buildr 不自动纠正，因为活跃任务可能合法地处于任务分支。

### 4. Service Application 是 CLI、doctor 与 UI 的唯一用例入口

Application 提供按 Project list/get/update metadata/create prompt/migrate/query Git view。它先通过 Project Application 解析父实体，再访问 Service repository；Domain 不导入 filesystem、YAML、Git 或 HTTP。现有 create 和 sync 流程逐步委托给 Service Application，架构验证阻止新 interface 直接解析 manifest。

### 5. UI 修改保持最小、同步和可审计

Service 页面先选择 Project，再展示列表与详情。`id`、`workspaceId`、`projectId`、`code`、source、path 和 Git 状态只读；仅 `name`、`description`、`type` 可 PATCH。写请求复用本地应用 session token、Origin、JSON、body size、fixed target 和 registry revision compare-and-swap。

新增 Service 不直接写文件：页面根据本地路径或 Git URL 表单生成完整 Agent prompt，要求 Agent 核对父 Project、source、integration branch、目标 path 与授权，调用 canonical CLI 并验证。未来接入 Agent session connector 时可发送同一个结构化 action。

## Risks / Trade-offs

- [v2 migration 为每个 Service 生成 UUID，首次迁移 diff 较大] → 只在显式 update/sync 中执行，使用稳定 migration plan、原子写入和 fixture 测试。
- [entry 同时保存 `workspaceId` 与 `projectId` 存在冗余] → repository 每次读取都校验父实体一致性，以换取应用查询便利。
- [`source.path` 包含 Project code，Project code 未来变化会影响物化路径] → 当前 Project code 和 source 均不可由页面修改；重命名必须作为独立受控迁移。
- [旧 `repo.branch` 与 `repo.defaultBranch` 可能不同] → 将更明确的 `repo.branch` 作为 integration branch，缺失时才回退到 default branch，并在 migration preview/测试中固定规则。
- [分支不一致可能是正常任务状态] → UI 展示上下文，doctor 诊断但不自动切换；remote identity 冲突才阻断 mutation。

## Migration Plan

1. 引入 Service Domain、v1/v2 repository 与不写入的 compatibility projection。
2. 扩展 update/sync convergence：从 Workspace、Project 获取 UUID，为 v1 entry 生成 Service UUID，预检通过后原子写入。
3. 切换 service create、doctor 与查询到 Service Application；保留旧参数兼容，canonical help 使用 `name`、`description` 与 `integrationBranch`。
4. 增加 HTTP/Web Service 产品切片和 prompt generator。
5. 更新 package baseline、自举 Service registry、Buildr Skill、文档、任务看板和测试。

回滚代码后，v1-only 旧版本无法理解 v2；数据回滚只能从 Git 恢复迁移前 manifest。迁移不改变 Service 目录内容或 Git repo 状态。

## Open Questions

无。`type` 当前保留开放词表；如果未来需要类型治理，应另建词表或 taxonomy capability，不在本次硬编码枚举。
