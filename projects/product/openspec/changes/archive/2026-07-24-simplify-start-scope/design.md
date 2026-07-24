## Context

当前开始页的 `getWorkspaceGettingStarted` 接受 `projectCode`，在多个项目时返回 `project-selection`，并在 Web 页面把该选择再次写入 URL 查询参数。选择成功后页面只展示该项目的服务，主操作直接将这个 Project 预填给“开始工作”抽屉。这把“为一项任务选择范围”和“查看整个工作空间”混成同一状态：用户不能自然返回全局视图，也看不到选择对长期事实产生了什么作用。

Project 和 Service 的 canonical 关系已由各自 registry 维护；开始页不应新增或保存另一份“当前项目”事实。现有“开始工作”抽屉已经能在生成 prompt 前选择 Project、按该选择加载可选 Service，因此适合承担任务级范围交接。

## Goals / Non-Goals

**Goals:**

- 将开始页稳定为整个 Workspace 的只读概览，无需选择或锁定 Project。
- 聚合展示所有可读取 Project 的 Service 数量与完整性，并让用户可进入项目目录。
- 让“用 Agent 开始”每次在抽屉内临时选择 Project 和可选 Service，再生成范围明确的 prompt。
- 删除开始页 `project` 查询参数及其后端 projection 输入，避免 URL 成为隐式选择状态。

**Non-Goals:**

- 不修改 Project、Service 的 canonical registry、详情路由、编辑能力或创建 prompt。
- 不创建 Workspace 级的“默认项目”或“最近项目”偏好。
- 不让页面启动、连接或托管 Agent 会话。

## Decisions

### 1. 开始页按 Workspace 聚合，而不是派生 selectedProject

`getWorkspaceGettingStarted` 只接收空输入，读取全部 Project；逐个读取其 Service registry 并生成汇总。可读取的服务形成总数，任一 registry 无法读取或要求迁移时将完整性标为 `partial`，但仍返回已知 Project 和服务事实。

这样页面的范围与 Workspace 的真实边界一致。备选方案是在开始页上增加“重新选择项目”控件；它修复了不可切换的表象，却仍让本不持久的任务选择主导 Workspace 概览，因此不采用。

### 2. 任务范围只在 Agent Action 中临时选择

开始页点击“用 Agent 开始”不传入 `projectCode`。抽屉每次读取 Project 列表，用户选择 Project 后加载对应 Service，随后调用既有 `generateStartWorkPrompt`。prompt 仍要求明确 Project 和目标；表单关闭、刷新开始页或再次打开抽屉都不保留该选择。

这保留了 prompt 的精确范围，同时避免用户误以为页面选择改变了 Workspace 或 Project 的事实。备选方案是允许无 Project 的全 Workspace prompt；这会把本应明确的任务归属交给 Agent 猜测，不采用。

### 3. 入口表达资源管理，不把摘要做成筛选器

开始页在存在 Project 时展示总项目数、总服务数/部分不可用状态，并提供“查看项目”链接；不再渲染 Project `<select>`。Project 详情和服务目录仍是查看及管理具体资源的唯一稳定上下文。

## Risks / Trade-offs

- [逐项目读取 Service 会比只读一个 Project 多] → registry 已是本地文件 read model；沿用现有可恢复错误处理，任一失败只降级汇总，不阻塞页面。
- [用户可能希望快速从开始页进入特定项目] → 保留明确的项目目录入口及既有独立详情 URL，而不是重新引入隐藏筛选状态。
- [旧书签含 `?project=`] → HTTP 接口不再将该参数传入 projection，页面安全地忽略它并显示 Workspace 概览。

## Migration Plan

部署后无需数据迁移：Project/Service registry 和 URL 主路径保持不变。旧开始页链接中的 `project` 查询参数被忽略；若出现回归，可回退 Web 与 projection 改动，未改变任何用户数据。
