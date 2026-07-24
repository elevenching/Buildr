## Context

本机应用已经提供 `/projects` 和 `/services` 独立页面，但项目仍以列表旁的编辑表单呈现，没有稳定的项目详情 URL。服务虽然属于项目，用户必须跳到全局服务页才能理解所属关系。当前后端已经提供 Project detail 与按 Project 查询 Services 的真实 read model，本阶段可以在不改变 Domain、存储或 API payload 的情况下形成完整导航闭环。

## Goals / Non-Goals

**Goals:**

- 提供 `/projects/:projectCode` canonical route，支持直达、刷新和历史导航。
- 将项目详情组织为项目概览、技术状态、所属服务和后续资产入口。
- 所有数量和状态来自现有 API；项目不存在、服务为空或观察失败时给出明确状态。
- 保留 `/projects` 的目录与创建入口，以 PC 表格和显式操作进入项目详情或按项目过滤的服务管理。

**Non-Goals:**

- 不新增 Project 或 Service Domain 字段，不建立前端持久化状态。
- 不在本阶段实现规则、OpenSpec、验证或命令的编辑页面。
- 不把项目详情变成 Agent 执行器，不自动 checkout、sync、迁移或修改服务。
- 不新增独立聚合 API；前端组合现有 Project detail 与 Service list。

## Decisions

### 1. 项目目录与项目详情分离

`/projects` 保留目录和创建入口，PC 端使用标准表格展示名称、代码、来源和服务数，并通过“详情”“服务”操作进入对应任务。表格整行不作为默认入口；详情页承担项目上下文和下游资源导航，避免列表页继续膨胀。替代方案是在列表页内展开更多 tab，但无法形成可分享、可刷新和可恢复的项目上下文，因此不采用。

### 2. 参数化路由必须显式匹配

客户端 router 增加 route matcher，并将解析后的 `projectCode` 作为 route params 传给 feature。HTTP server 只对符合 Project code 约束的 `/projects/:projectCode` 返回 App Shell；更深或非法路径仍返回 404，避免通配 fallback 掩盖错误。

### 3. 首版在前端组合现有 read model

详情页并行读取 `/api/v1/projects/:code` 和 `/api/v1/projects/:code/services`。Project detail 负责领域与 Git 观察，Service list 负责所属服务；页面不缓存或写入摘要。若任一查询失败，按区域降级，不把未知状态显示为完整事实。

### 4. 所属服务是项目详情的第一类内容

详情页显示服务数量、服务摘要和创建服务按钮。服务为空时只展示空状态；“管理服务”进入 `/services?project=:projectCode`。`/services` 使用表格承载服务管理，项目选择器作为过滤条件，“详情”操作显式打开现有服务详情与 metadata 保存区域，整行不作为入口；服务独立 canonical 详情路由留待下一阶段。创建服务继续打开统一 Agent Action 抽屉并预填当前项目。

### 5. 后续资产入口不伪造能力

OpenSpec、规则、验证和命令以“后续阶段”卡片展示其领域位置和边界，不展示未经 read model 证明的数量、健康度或可编辑状态。后续每个资产能力按独立垂直切片替换占位入口。

### 6. 当前只以 PC 管理为主，窄屏保持基本可用

当前本机应用监听 `127.0.0.1`，主要服务于电脑上的用户与 Agent 协作，不建设独立移动端信息架构。项目与服务表格在窄屏允许横向滚动，详情区域改为单列并保持按钮可操作；不因移动端取消 PC 操作栏，也不把整行点击作为 PC 默认行为。

## Risks / Trade-offs

- [详情页需要两个请求] → 本机规模下并行请求可接受；未来出现真实性能问题再增加 Application 聚合用例。
- [服务入口暂时回到全局服务页] → 携带项目查询参数保持上下文，独立服务详情在下一阶段补齐。
- [参数化 fallback 可能扩大页面路由范围] → 使用与 Project code 相同的严格正则，只允许单层详情路径。
- [后续资产卡片被误解为已实现] → 明确标记“后续阶段”，不显示动作按钮和虚构状态。
- [表格在窄屏信息密度过高] → 使用可访问的横向滚动容器并保留明确操作，当前不投入独立移动端卡片流程。
