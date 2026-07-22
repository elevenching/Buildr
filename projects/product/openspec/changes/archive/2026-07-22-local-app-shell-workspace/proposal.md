## Why

Buildr 本机应用已经完成 Workspace、Project 和 Service 三个产品切片，但当前把查看、编辑、详情与 Agent 创建动作纵向堆叠在同一页面，难以形成清晰的对象层级，也无法承载后续工作资产管理能力。现在先建立可扩展的应用外壳并迁移 Workspace，使维护者能够在不一次重做全部页面的前提下验证新的管理系统方向。

## What Changes

- 为固定单工作空间（Workspace）的本机应用增加 App Shell、主导航、客户端路由和可直接访问的页面 URL。
- 将“资源”设计为可展开/折叠的导航分组，在分组下明确列出项目（Project）和服务（Service）。
- 将 Workspace 能力拆分为“概览”和“Workspace 设置”：概览展示身份、Project/Service 汇总与诊断入口，设置继续承担受控 metadata 修改和只读技术事实。
- 将项目、服务拆为独立管理视图；服务视图明确所属项目上下文，避免与项目内容混淆，同时保持现有 API、写入和 Agent prompt 契约。
- 将工作空间、项目和服务的创建动作统一为按钮触发的“交给 Agent”抽屉，并保持 prompt-only，不声称页面已经完成创建。
- 界面领域名词统一使用中文主称“工作空间、项目、服务”，英文只在首次解释或技术语境中辅助出现。
- 保持应用进程固定目标、loopback、离线资源、session token、Origin、JSON、body size、revision CAS 和迁移只读边界不变。
- 不在本阶段引入多 Workspace registry、前端框架或新的高影响直接写操作。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 增加 App Shell、路由、Workspace 概览/设置页面、项目/服务独立视图和统一 Agent Action 入口契约。

## Impact

- Web interface：`src/interfaces/local-app/web/` 的 HTML、CSS、JavaScript 将拆分为应用外壳、路由、共享能力，以及工作空间、项目、服务 feature。
- HTTP interface：静态页面 fallback 和深链接处理可能调整；现有 `/api/v1/workspace`、Project、Service 与 prompt API 保持兼容。
- 产品契约：更新 `local-workspace-application`，明确 Workspace 是当前应用上下文而不是可在页面中切换的资源列表。
- 验证：增加路由直达、前进后退、Workspace 概览/设置、项目/服务独立入口、Agent Action 与窄屏导航测试；保留现有安全和 CAS 验证。
