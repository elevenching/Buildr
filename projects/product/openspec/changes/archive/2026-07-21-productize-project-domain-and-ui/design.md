## Context

当前 `projects/manifest.yml` 同时承担数据结构、持久化格式和 CLI 实现约定，Project 解析、创建、Git 探测与 workspace 流程集中在旧 application 模块。Workspace 产品切片已经建立 Domain、Application、Infrastructure、Interfaces 分层以及固定 Workspace 的本地应用；Project 应沿用该分层，但不能把会变化的 Git 工作状态写进 Domain。

本设计继续以文件系统为当前存储介质。`projects/manifest.yml` 是 Project Domain 的 canonical 文件投影；未来换成数据库 repository 时，Application 与 Interfaces 不应改变。Service Domain、SaaS、远程 Workspace Query 和 Agent session connector 不在本次范围。

## Goals / Non-Goals

**Goals:**

- 建立稳定、存储无关且字段用途明确的 Project Domain。
- 让 manifest v1 安全迁移到 v2，同时保持普通读取零写入。
- 让 CLI、doctor 和本地 UI 共用 Project Application。
- 区分 Git 的声明配置与实时观察状态，支持人在 UI 中理解偏移。
- 交付 Project 查看、低风险修改与 prompt-only 新增的完整产品切片。

**Non-Goals:**

- 不建立 Service Domain 或 Service UI。
- 不引入 SQLite、SaaS、审批、多 Workspace 或远程查询。
- 不让 Buildr 自动切分支、stash、merge、rebase 或调度 Agent。
- 不允许页面直接改变 Project identity、source 或文件路径。

## Decisions

### 1. Project 使用实体字段与 ProjectSource 值对象

| 字段 | 类型 | 必填 | 用途 | 约束与文件映射 |
|---|---|---:|---|---|
| `id` | UUID string | 是 | Project 跨存储、重命名和引用时的稳定身份 | 所有实体统一 UUID；保存在 Project entry 中，不从 `code` 或 path 派生 |
| `workspaceId` | UUID string | 是 | 显式关联所属 Workspace，便于 Application 查询和未来数据库外键 | 必须等于当前 Workspace `id`；保存在每个 Project entry 中 |
| `code` | string | 是 | 人与 CLI 可读的稳定业务标识 | 使用安全 code 格式且在 Workspace 内唯一；manifest map key 只是存储索引，读取后必须与 `code` 一致 |
| `name` | string | 是 | 页面和诊断展示的短名称 | 非空；v1 `title` 迁移为该字段 |
| `description` | string | 是 | Project 的简要说明 | 必须非空；v1 缺失时兼容投影为明确 TODO，doctor 提示补全；不是业务事实正文 |
| `source` | `ProjectSource` | 是 | 描述 Project 资产当前通过何种介质落地及其声明身份 | 值对象，详见下表 |

`ProjectSource` 字段：

| 字段 | 类型 | 必填 | 用途 | 约束与文件映射 |
|---|---|---:|---|---|
| `type` | `workspace \| git` | 是 | 区分跟随 root Git 的目录与独立 Git Project | v1 `repo.kind` 迁移为该字段 |
| `path` | workspace-relative string | 是 | 让文件系统 repository 能由 Domain 定位 Project 实际目录 | 必须位于 `projects/<code>`，禁止绝对路径与越界；数据库实现仍可保留为物化位置 |
| `git.url` | string | Git 必填 | 声明独立 Project repo 的来源身份 | v1 `repo.url` 迁移；workspace source 禁止该字段 |
| `git.remote` | string | Git 必填 | 声明用于核对来源 URL 的 remote 名称 | v1 `repo.remote` 迁移，缺省迁移为 `origin` |
| `git.integrationBranch` | string | Git 必填 | 声明任务完成后应集成并保持的稳定分支 | v1 `repo.defaultBranch` 迁移；不是当前分支，也不随 checkout 改变 |

不把 timestamps、status、capabilities、commands、services 或 verification 放入 Project entity：它们分别属于审计/任务、能力需求、Command requirement、Service registry 和验证声明。

### 2. canonical manifest 升级为 `buildr.projects/v2`

v1 已公开使用，直接在同一版本下改变字段含义会让旧实现误读，因此 v2 明确表示 Domain 投影。filesystem repository 同时提供：

- v2 canonical reader/writer；
- v1 compatibility reader，将 key/`title`/`path`/`repo` 投影成内存中的 Project；
- migration plan，显式 update/sync 时一次生成 `id`、写入 `workspaceId` 并 canonicalize；
- 基于 canonical manifest bytes 的 registry revision 和 compare-and-swap。

普通 CLI 查询、doctor 和 app 启动不得迁移。Application 返回 `migrationRequired` 与 next action；修改请求在迁移前失败。这样避免“打开页面就改 Git tree”。

### 3. Git 声明状态与观察状态分离

Domain 只保存 source 声明。Git Infrastructure 在请求时读取以下 observed view：

| 字段 | 用途 |
|---|---|
| `repository` | 目标 path 是否为 Git worktree/repository |
| `currentBranch` | 当前实际分支；detached 时为空 |
| `head` | 当前 HEAD commit identity |
| `dirty` | worktree/index 是否有未提交变化 |
| `upstream` | 当前分支跟踪引用 |
| `ahead` / `behind` | 相对 upstream 的本地领先/落后数量 |
| `remoteUrl` | `source.git.remote` 对应的实际 URL |

Application 生成 declared/observed comparison。remote 缺失或 URL identity 冲突是 error；当前分支不同于 `integrationBranch`、dirty、ahead/behind 是可解释 warning/info。Buildr 不自动纠正这些状态，因为活跃任务可能合法地处于任务分支。Task Finish 后续可把 `integrationBranch` 作为默认集成目标，但仍必须进行 clean/ownership/safe-switch 检查。

### 4. Project Application 是 CLI、doctor 与 UI 的唯一用例入口

Application 提供 list/get/update metadata/create prompt/migrate-or-converge/query Git view。Domain 不导入 filesystem、YAML、Git 或 HTTP；repository port 返回 Project registry snapshot、revision、migration state；Git observer port 返回实时观察。

现有创建和 sync 流程逐步委托给 Project Application，避免一次重写所有 workspace lifecycle。架构 verifier 阻止新 interface 直接解析 manifest。

### 5. UI 修改保持最小、同步和可审计

Project 页面展示列表与详情，`id`、`workspaceId`、`code`、source、path 和 Git 状态只读；仅 `name`、`description` 可 PATCH。写请求沿用本地应用 session token、Origin、JSON、body size 与 fixed target 约束，并使用 registry revision compare-and-swap。

新增 Project 不直接写文件：页面根据 workspace/git source 表单生成完整 Agent prompt，要求 Agent 核对 source、integration branch、目标 path 与授权，调用 canonical CLI 并验证。未来接入 Agent session connector 时，可以发送同一个结构化 action，而不改变 Project Application 的 mutation 边界。

## Risks / Trade-offs

- [v2 migration 产生 UUID，首次迁移 diff 较大] → 只在显式 update/sync 中执行，使用稳定 migration plan、原子写入和测试 fixture。
- [Project `path` 与 `code` 看似重复] → path 是文件系统介质定位，code 是领域身份；二者分别保留并校验 canonical 关系。
- [分支不一致可能是正常任务状态] → UI 展示上下文，doctor 使用 warning/info，不自动切换；remote identity 冲突才阻断 mutation。
- [实时 Git 命令增加页面延迟] → Project 列表只读轻量 identity，选择详情后按 Project 查询；单次观察设超时并返回 unavailable diagnostic。
- [旧 workspace 在 app 中无法修改 Project] → 明确展示迁移提示和可复制 Agent 指令，避免隐式写入。

## Migration Plan

1. 引入 Domain、ports、v1/v2 reader 与不写入的 compatibility projection。
2. 扩展 update/sync convergence：读取 Workspace UUID，为每个 v1 entry 生成 UUID，并映射到 v2；预检全部通过后原子写入。
3. 切换 project create、doctor 与查询到 Application；保留旧命令参数兼容，canonical help 使用 `name` 与 `integrationBranch`。
4. 增加 HTTP/Web Project 产品切片和 prompt generator。
5. 更新 package baseline、自举 `projects/manifest.yml`、Buildr Skill、文档和测试。

回滚代码后，v1-only 旧版本无法理解 v2，因此发布说明必须将此标为 schema breaking；数据回滚只能从 Git 恢复迁移前 manifest。迁移不改变 Project 目录内容或 Git repo 状态。

## Open Questions

无。本次已确认 Service Domain 冻结，Task Finish 消费 `integrationBranch` 的完整策略可在 Project Domain 落地后单独迭代。
