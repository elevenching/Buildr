## Context

Local App 已经通过 Application read model 呈现 Workspace、Project、Service 和 Change，也已有 Project 与 Change 的可刷新详情 URL。Service 详情仍嵌在目录页下方，使选择、编辑、返回和分享都依赖同一个列表页面；页面同时大量使用大卡片、宽松留白和中英重复标签，削弱了本地工具应有的直接性。

该改造仅位于 Interfaces 的离线 Web shell 和其 shell 路由白名单。所有读取继续使用既有 HTTP API；Workspace、Project、Service metadata 的白名单和 revision CAS 继续由 Application 与 HTTP 安全边界执行；新建资源继续只生成 Agent prompt。

## Goals / Non-Goals

**Goals:**

- 建立“全局工作空间目录 → 单一工作空间上下文 → 资源列表 → 独立详情”的稳定导航模型。
- 为 Service 建立可分享、可刷新、可返回的详情 URL，并将编辑从目录页移出。
- 以紧凑、可读、响应式的离线控制台界面呈现真实状态、技术事实和 prompt-only 动作。
- 用浏览器测试覆盖详情深链、列表跳转、Service 保存和窄屏可用性。

**Non-Goals:**

- 不改变 Domain、Application、HTTP API 字段或 Git observation 的事实边界。
- 不让页面直接创建 Project、Service、Change 或替 Agent 执行专业工作。
- 不增加远程字体、CDN、图表、营销指标或新的前端框架。

## Decisions

### 使用资源特定的稳定详情路由

Service 采用 `/services/:projectCode/:serviceCode`，与已有 `/projects/:projectCode` 和 `/changes/:projectCode/:changeRef` 同处于工作空间 URL 前缀下。列表操作与项目详情中的关联 Service 均链接到该路由；详情页是唯一承载 Service 编辑表单的位置。

备选方案是在 `/services?project=...` 下保留展开式详情。它不能提供可分享 URL、历史导航或清晰的编辑上下文，且继续把目录与编辑耦合，因此不采用。

### 把导航状态与资源层级分开

应用 shell 只维护全局/工作空间上下文、紧凑侧边栏和真实面包屑；各资源页面提供自己的目录工具栏与详情页头。面包屑从当前 Workspace 名称、资源类型和已读取的资源名称构成，不把技术 ID 混入主标题。

备选方案是由 CSS 或路由标签拼接固定文案。它无法反映 Project/Service 等真实层级，因此不采用。

### 用有限的内容承载样式替代全页面卡片

列表、工具栏、表格和编辑表单直接处于页面内容流；仅概览摘要、技术侧栏、提示和关联资源使用浅边框表面。视觉 token 使用 8px spacing scale、较小圆角和低阴影，深绿只用作品牌与主操作锚点。

备选方案是保持每段内容都有 panel。它会降低目录密度并放大页面层级噪声，因此不采用。

### 以 CSS grid 和无横向页面溢出保证响应式

工作空间卡片在宽屏为 2–3 列、约 1024px 为 2 列、390px 为单列；资源表格在必要时只让表格容器横向滚动，页面主体不溢出。移动端将固定侧栏收敛为底部导航，详情、表单和 Agent Action 都保持单列可操作。

## Risks / Trade-offs

- [新增 URL 与静态 shell 白名单不同步] → 同时更新 router、server 路由正则和浏览器深链测试。
- [样式收紧导致窄屏按钮或表格不可用] → 在 390px 浏览器测试中检查 `scrollWidth` 与主要操作可见性。
- [详情页重构误改写入行为] → 继续调用原有 Service GET/PUT API，并为成功保存添加浏览器断言。
- [技术事实被隐藏过度] → 用可访问的 `<details>` 技术信息区保留 source、revision、路径和 Git observation。

## Migration Plan

静态资源随 npm package 一起发布；旧 `/services?project=...` 保持为过滤后的目录 URL，不需数据迁移。已有 API 路径和 Workspace manifest 均不变。若出现回归，可恢复前端路由与样式；没有持久化数据需要回滚。
