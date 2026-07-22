## Context

当前本机应用由单个 `index.html`、`styles.css` 和 `app.js` 构成。Workspace、Project、Service 的查看、修改和 prompt-only 创建依次渲染在一个长页面中；Project 选择还隐式驱动 Service 内容。这种实现适合验证垂直切片，但没有稳定的导航、页面 URL、对象层级和未来 feature 边界。

应用仍由 `buildr app --target <workspace>` 启动，一次进程固定到一个 Workspace，只监听 loopback，并从 npm package 内提供离线静态资源。现有 HTTP API、安全控制、Domain/Application/Infrastructure 分层和 revision CAS 都已验证，本次不重写后端能力。

本阶段是渐进迁移的第一步：先交付可评审的管理应用骨架和工作空间页面。用户评审确认项目与服务不应继续共用同一兼容页面后，本 change 继续将二者拆成独立视图，但不改变后端领域与 API 契约。

## Goals / Non-Goals

**Goals:**

- 建立可扩展的 App Shell、稳定导航和可直接访问的客户端路由。
- 明确 Workspace 是当前应用上下文，将其内容拆成概览与设置。
- 在 Workspace 概览中提供真实 Project/Service 汇总和迁移状态，不制造第二事实源。
- 将“创建另一个 Workspace”收敛到统一的“交给 Agent”入口。
- 保留项目、服务当前查看、编辑、CAS、诊断和 prompt-only 行为，并提供语义清晰的独立入口。
- 保持桌面与 390px 窄屏可用，并支持浏览器前进、后退和深链接刷新。

**Non-Goals:**

- 不建立多 Workspace registry、Workspace 切换器或最近访问列表。
- 不改变项目、服务的领域模型、存储和 API 契约。
- 不改变任何 Domain entity、manifest schema、Application 用例或公开 API payload。
- 不引入 React、Vue、Preact、bundler 或远程前端依赖。
- 不让页面直接创建 Workspace、Project、Service，也不自动执行 Agent 工作。

## Decisions

### 1. Workspace 作为 App Shell 的固定上下文

顶部区域展示当前工作空间名称和本机应用身份，侧边导航只切换该工作空间内的视图。页面不提供目标路径输入或工作空间切换器。“创建新工作空间”属于全局 Agent Action，不改变当前进程目标。

替代方案是把工作空间、项目、服务做成三个平级资源列表，但这会暗示当前应用可管理多个工作空间，并削弱 `工作空间 -> 项目 -> 服务` 的父子关系，因此不采用。

“资源”在导航中是可展开/折叠的分组，不是一个模糊的单页入口。分组下固定列出“项目”和“服务”两个资源类型，分别进入独立 canonical route。展开状态属于当前页面会话 UI state，不写入工作空间源资产。

### 2. 首批路由使用 History API 与服务端 shell fallback

首批 canonical 路由为：

| 路由 | 页面 |
|---|---|
| `/` | Workspace 概览 |
| `/settings/workspace` | Workspace 设置 |
| `/projects` | 项目管理 |
| `/services` | 按所属项目组织的服务管理 |

浏览器内部导航通过 `history.pushState`，`popstate` 重新渲染。HTTP server 对这三个已知页面路由返回同一注入 session token 的 shell；未知页面和 API 继续返回 JSON 404。这样可以验证正式 URL 和刷新，而不引入 hash route。

对象详情当前保留在各自列表页的详情区域；是否增加 `/projects/:project`、`/services/:service` 等详情路由，待后续真实导航需求出现后决定。

### 3. 原生 ES modules 按应用与 feature 拆分

保留无 bundler、无运行时第三方依赖的交付方式，将前端拆为：

```text
web/
├── index.html
├── styles.css
├── app.js
├── api-client.js
├── router.js
└── features/
    ├── workspace.js
    ├── projects.js
    ├── services.js
    └── agent-actions.js
```

`index.html` 只保留 App Shell 和 view root；feature 通过 DOM API 生成自身页面。公共 API client 统一 session token、错误模型和写请求 headers。暂不引入前端框架，避免在信息架构尚待用户评审时扩大构建与发布边界。

### 4. Workspace 概览只做真实聚合

概览并行读取现有 Workspace、Projects 和各 Project 的 Services 列表，展示 Workspace 身份、Project 数、Service 数、迁移提示以及进入设置/兼容资源管理的动作。汇总是页面实时 read model，不持久化，不成为新的权威状态。

Service 汇总的单个 Project 查询失败时，页面标识部分不可用，不把未知数量显示为事实；Workspace 和 Project 信息仍保持可读。

### 5. Workspace 设置继承现有安全与 CAS 契约

设置页继续只允许修改 `name`、`description`，并展示 `id`、root path、schema、revision。迁移未完成时保持只读；revision conflict 提示刷新后重新判断。现有 `/api/v1/workspace` GET/PUT 不变。

### 6. 项目与服务使用独立视图

项目当前列表、详情、修改和创建 prompt 进入 `/projects`；服务能力进入 `/services`。服务页先展示所属项目选择，再读取该项目的服务；没有服务时只展示空状态和创建服务入口，不渲染空的服务详情。两个视图不复用同一个页面锚点，避免把相似的技术字段误认为相同资源内容。

### 7. Agent Action 使用抽屉式临时工作区

App Shell 提供“交给 Agent”按钮，打开后先选择“创建工作空间、创建项目、创建服务”。项目和服务列表标题区分别提供创建按钮，直接打开同一个抽屉的对应表单；服务入口自动携带当前选中的项目。生成结果仍需复制给 Agent，并明确复制不等于创建。页面正文不再平铺任何创建表单。

替代方案是使用独立模态框，但创建 prompt 需要容纳较长说明、来源字段和结果文本；右侧抽屉能保留当前资源上下文且更适合连续填写，因此首版统一使用抽屉。

### 8. 界面使用中文领域主称

用户可见的导航、标题、按钮、状态和说明统一使用“工作空间、项目、服务”。首次需要解释模型时可以写为“工作空间（Workspace）”“项目（Project）”“服务（Service）”；ID、Schema、Revision、Git 等技术标识可以保留英文。代码标识、API path 和 Domain 类型名不因界面语言变化而重命名。

## Risks / Trade-offs

- [原生 DOM feature 随能力增长可能再次变大] → 先建立 feature/module 边界；Task、Decision、Evidence 等高交互能力进入前再根据真实复杂度评估框架。
- [概览逐 Project 查询 Service 产生额外请求] → 当前本机规模可接受；用并行查询和部分失败状态控制体验，未来再由专用 summary Application 用例替换。
- [项目与服务详情仍在列表页内展开] → 当前规模下保留主从布局；后续对象操作增多时再引入独立详情路由。
- [History API fallback 扩大静态路径匹配] → 只允许显式页面路由，API 与未知路径不 fallback，避免掩盖错误。
- [用户可能把“交给 Agent”理解为已经执行] → 持续显示 prompt-only 说明和复制后的未创建状态。

## Migration Plan

1. 增加 shell route fallback、ES module 静态资源和路由测试。
2. 实现 App Shell、响应式导航和统一 Agent Action。
3. 实现工作空间概览与设置，并复用现有 API/CAS。
4. 将现有项目、服务能力移动到独立 feature 和路由；服务视图明确所属项目与空状态。
5. 把资源导航改为可折叠分组，把项目/服务创建迁入统一 Agent Action 抽屉，并统一中文术语。
6. 运行受影响验证并启动 task worktree 本地应用供用户评审。
7. 用户确认方向后冻结候选并执行完整验证。

回滚时恢复旧静态三文件与根路由即可；数据、manifest 和 API 没有迁移或破坏性变化。

## Open Questions

无。首批范围按用户确认的“先做一个，再迁移剩余功能”冻结为 App Shell 与 Workspace。
