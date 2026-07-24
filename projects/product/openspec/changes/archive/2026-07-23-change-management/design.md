## Context

本机应用目前通过与 CLI 相同的 Application 用例展示工作空间、项目和服务，但项目中的 OpenSpec change 只以文件存在，项目详情中的 OpenSpec 区域仍是占位信息。Change 同时包含 active 与 archive 两种生命周期位置，artifact 可能部分完成，任务进度来自 `tasks.md`，因此需要独立的只读投影，而不能让页面自行拼接目录事实。

## Goals / Non-Goals

**Goals:**

- 为所有已登记 Project 提供统一、安全、确定性的 Change 列表与详情 read model。
- 在 PC 管理系统中使用表格、过滤和明确操作栏展示 Change，并从项目详情稳定进入所属 Change。
- 让用户通过 Agent prompt 创建或推进 Change，保持 Agent-first 和 OpenSpec 生命周期边界。
- 对越界路径、非法 change identity 和不可读取 artifact fail closed。

**Non-Goals:**

- 不在页面中实现 OpenSpec 编辑器、任务勾选器或归档执行器。
- 不引入数据库、缓存、文件 watcher 或 OpenSpec CLI 子进程。
- 不把 change 投影升级为新的持久化事实源，也不实现跨 Workspace 聚合。
- 首版不展示结构化 Requirement diff 或验证历史聚合。

## Decisions

### 1. Change 是 Project 所有的只读工作事实投影

Application 从 `projects/<project>/openspec/changes/` 和其 `archive/` 子目录读取 change。active identity 使用目录名；archive identity 同时保留 archive entry 与从日期前缀解析的 change code。列表返回稳定字段，详情按需返回 artifact 内容。

相比让 Web 层直接读取文件，这一设计让 CLI、HTTP 和未来其他 interface 可以复用同一安全边界。相比调用外部 OpenSpec CLI，直接读取受约束的 canonical 文件避免启动子进程、版本输出漂移和页面读取副作用。

### 2. 生命周期与完成度分开表达

`lifecycle` 只表达 `active` 或 `archived`；任务进度独立记录 complete、total 和是否存在任务文件。active change 不因任务全部勾选就伪装成 archived，archived change 也不因历史任务缺失被标记为 active。

列表状态使用生命周期和任务事实生成中文展示标签，但 API 保留机器可读字段。artifact availability 与 tasks progress 均来自文件现状，不猜测 proposal/design/specs 的业务含义。

### 3. 详情采用独立页面，不使用叠加二级抽屉

Change 表格的“详情”进入 `/changes/<projectCode>/<changeRef>` 独立路由。详情页展示基本信息、任务进度和 proposal/design/specs/tasks 内容；长文本使用分区和预格式化容器。操作栏提供“交给 Agent”行为。

独立页面适合可链接、可刷新和较长 artifact 内容；抽屉只继续用于短表单或 prompt，不承担嵌套的完整 Change 信息架构。

### 4. 所有生命周期写操作保持 prompt-only

“创建变更”“继续处理”“审阅变更”调用 Application prompt builder，返回包含 Project、Change、目标和安全边界的完整 prompt。HTTP POST 仍使用 loopback、Origin 和 JSON content-type 写安全检查；生成 prompt 不写 change 文件。

相比页面直接创建或归档，这一方案保留 Agent 对用户意图、change scope、worktree、OpenSpec action 和授权的判断，不让 Buildr 与 Agent 抢任务理解和执行。

### 5. 导航与过滤以 PC 管理系统模式实现

“资源”下增加“变更”。Change 表格提供项目和生命周期过滤，操作栏显式包含详情与 Agent 行为；表格行本身不作为唯一入口。项目详情显示 Change 数量和有限列表，并链接到带 `project` 查询参数的 Change 表格。

## Risks / Trade-offs

- [Risk] 历史 archive 目录命名不完全一致 → 保留原始 archive entry，只有符合日期前缀时才解析 change code，无法解析时仍可安全展示。
- [Risk] artifact 内容较长导致详情页面过重 → 列表不返回正文，详情按单个 Change 读取，并使用折叠分区。
- [Risk] 部分 change artifact 格式损坏 → 返回可诊断错误或 artifact availability，不用页面内容覆盖文件事实。
- [Trade-off] 首版不依赖 OpenSpec CLI，因此不复现其全部 schema 推断 → read model 只承诺目录、标准 artifact 和任务 checkbox 等稳定事实。

## Migration Plan

1. 增加 Change application/read model 与测试，不改变既有 Workspace、Project、Service API。
2. 增加 HTTP 只读与 prompt endpoints，再接入 Web 路由和导航。
3. 更新项目详情入口和文档事实，运行 affected 与 Candidate 验证。
4. 若出现问题，可移除新增路由与页面；原 OpenSpec 文件完全未被迁移或改写。

## Open Questions

无。结构化 Requirement diff、验证证据聚合和直接打开本地文件等能力留待后续独立 change。
