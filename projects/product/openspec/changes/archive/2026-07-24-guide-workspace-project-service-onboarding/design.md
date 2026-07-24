## Context

Buildr 当前已经具备 canonical Workspace、Project、Service Domain，以及本机 Workspace Registry、独立资源目录/详情/编辑页面、prompt-only 创建抽屉、revision CAS 和 loopback/session 安全边界。现有界面更接近资源管理控制台：全局首页说明登记动作但不解释 Workspace 心智，Workspace 概览以统计和并列入口为主，Project/Service 创建表单暴露 code、source、remote、integration branch 等执行参数，导航又将 Project、Service、Change 近似平铺。

公开 README 已能说明工作资产和 Agent-first 价值，但快速开始把 runtime discovery、init 和 doctor 作为主要路径，用户完成安装后仍不知道 Buildr 可以解决什么问题、如何建立 Workspace → Project → Service 工作范围，以及下一句应对 Agent 说什么。`init --agent` 当前也主要输出下一条 Project CLI 提示，没有把成功的技术 onboarding 转换为用户可理解的第一次工作交接。

本变更面向第一次使用 Buildr 的普通用户，同时保留熟练用户、Agent、现有 Workspace 和既有深链接的兼容性。它横跨本机 Web、Application prompt、产品 Buildr Skill、CLI onboarding 输出与公开文档，因此需要一套共享语义，而不是几个孤立的文案补丁。

## Goals / Non-Goals

**Goals:**

- 让第一次打开 local app 的用户在一个页面内理解 Workspace 是什么、登记会发生什么，以及如何通过 Agent 创建或开始使用。
- 将 Workspace → Project → Service 建立为最小用户心智，同时保持三者的管理页面独立，不把完整目录和编辑表单塞进同一页面。
- 让 Workspace 首页根据真实状态给出一个最低必要的下一步：创建/选择 Project、按需接入 Service，或开始第一项任务。
- 让 Project/Service Agent Action 收集业务意图而不是要求普通用户填写完整 CLI 参数。
- 让 local app 可以生成带 canonical Workspace/Project/Service 范围的开始工作 prompt，但不连接、启动或托管 Agent 会话。
- 让不使用 local app 的用户在 `init --agent` 后由 Agent 获得同等的最小教学和渐进式引导。
- 让 README 在安装说明之前回答“Buildr 适合解决什么问题、第一次如何成功”，并与产品定义和实际 onboarding 保持一致。
- 保留现有 source authority、prompt-only、高影响动作交给 Agent、revision CAS、identity 隔离和本机安全边界。

**Non-Goals:**

- 不新增数据库、远程账户、遥测、onboarding 完成状态或第二事实源。
- 不让 local app 连接 Agent session、发送消息、执行 Project/Service 创建、clone、checkout、sync 或专业任务。
- 不改变 Workspace、Project、Service canonical schema、Git source 声明或 registry migration 规则。
- 不在本变更中重新设计 Change、Rules、Skills、Commands、Task Board 等后续能力的完整产品交互。
- 不要求每个 Project 必须存在 Service；没有代码仓或可执行资产的 Project 可以直接开始工作。
- 不创建长期加载的 `WELCOME.md`、固定新手角色或逐步遮罩式 tour。

## Decisions

### 1. 使用派生式 Getting Started read model，不持久化 onboarding 状态

Workspace 开始页通过既有 Workspace、Project 和按 Project 查询的 Service Application read model 组合一个只读 onboarding projection。projection 至少包含：

- Workspace identity、名称、说明与可用/迁移状态；
- Project 数量、可用 Project 选项与当前选择；
- 当前 Project 的 Service 数量与可用 Service 选项；
- `phase`：`project-empty`、`project-selection`、`service-empty`、`ready` 或 `degraded`；
- 一个 `primaryAction` 及其所需的 canonical entity references；
- 部分读取失败时的明确 completeness，而不是猜测完整数量。

`service-empty` 只表示当前 Project 尚未登记 Service，不表示 Workspace 未完成。页面同时提供“该 Project 暂不需要 Service，直接开始工作”的路径。熟练用户已有 Project/Service 时，开始引导自动收敛为紧凑的“当前工作范围”和“用 Agent 开始”。

选择派生 projection 而不是持久化 checklist，是因为 Project/Service 事实本身已经能决定下一步；额外状态会产生漂移、同步和 Git authority 问题。若未来需要记住 UI 展开/收起偏好，只能作为本机显示偏好单独设计，不能改变 Workspace readiness。

### 2. 首页负责认知和下一步，资源页面继续负责管理

全局根路由继续是 Workspace Registry，不复制 Workspace 详情；空 Registry 时展示：

- 一句普通语言 Workspace 定义；
- Workspace → Project → Service 最小关系；
- “添加已有工作空间”主操作；
- “让 Agent 创建工作空间”次操作；
- “只登记本机入口，不移动或修改目录”的影响说明。

进入 Workspace 后，现有 `/overview` 行为升级为“开始”页。它只展示摘要、当前范围和下一步，不嵌入完整 Project/Service 表格或编辑表单。`/projects`、`/services`、详情和编辑 URL 保持稳定；Project 目录继续提供按 Project 进入 Service 目录的入口。

备选方案是把 Project 与 Service 全部放到 Workspace 首页，或者采用模态步骤向导。前者会重新制造信息拥挤并破坏独立资源管理边界；后者难以重新进入、对已有 Workspace 不适用，而且教的是按钮而不是工作模型，因此不采用。

### 3. 用导航和上下文表达 Project → Service 层级，不破坏现有路由

Workspace shell 将“开始、项目、服务”作为核心区域，将 Change 和未来 Rules/Skills 等放入次级“更多”区域。Service 在视觉上属于 Project，并始终显示当前 Project 选择；从 Project 行进入 Service 时保留 `?project=<code>`，breadcrumb 表达 `Workspace > Project > Service`。

保留 `/projects`、`/services?project=`、现有详情/编辑路径和 API，是为了兼容已有深链接、浏览器历史与测试。不会把 Service 嵌入 Project 管理表，也不会让 Project/Service 详情页重新承担关联资源目录。

### 4. Agent Action 采用“基础意图 + 高级声明”两层输入

Project Action 默认收集：

- 名称；
- 用途或长期目标；
- 可选 code；
- 可选“已有独立 Project 资产 repo”声明。

Service Action 默认收集：

- 从当前 Workspace canonical Project 列表选择所属 Project；
- 名称和用途；
- 可选本地目录或 Git URL；
- 可选 code。

`type`、remote、integration branch 和精确 source 选项放入高级区域；用户留空时 prompt 要求 Agent 检查实际来源、提出候选并只询问必要信息。Application prompt contract 允许这些技术字段缺省，但仍拒绝未知字段、无效 canonical Project 和任意 Workspace path 注入。

选择允许部分输入，是因为 Agent Action 只生成 prompt、不会写源资产；在 prompt 阶段强制补全所有 CLI 参数不会增加确定性，反而把 Agent 应承担的理解和核对工作转嫁给用户。实际 `project create`、`service create` 的 deterministic validation 保持不变。

### 5. 新增 canonical 开始工作 prompt，用 identity 而不是 path 传递范围

新增 Workspace-scoped prompt Application/API，输入为当前 Workspace API context、`projectCode`、可选 `serviceCode` 和非空 `goal`。Application 必须：

- 从当前 Workspace registry 解析 Project，并在提供 Service 时从该 Project registry 解析 Service；
- 拒绝未知、跨 Project 或不属于当前 Workspace 的 entity；
- 生成包含用户目标、Workspace/Project/Service 可读名称与 code 的 prompt；
- 要求 Agent 先读取当前 scope 适用资产、确认歧义、推进任务并按项目政策验证；
- 明确复制 prompt 不会在 local app 内启动或完成任务。

开始工作 prompt 不接受 filesystem root、任意 source path、Agent id 或执行命令。用户把它复制到任意受支持 Agent，是 local app 和 Agent 之间的显式交接边界。

### 6. 目录选择失败转换为可操作诊断，不自动初始化

原生 directory picker 仍是唯一允许用户从 UI 选择本机路径的入口。选择后如果目录 canonical、需要迁移、未初始化、不可读或 identity 冲突，Application/API 返回结构化结果；页面根据稳定 code 展示：重新选择、让 Agent 初始化/迁移/修复，或查看只读原因。

任何失败都不写 Workspace Registry，不自动运行 init/sync，不把任意网页提交的 path 传入 Workspace-scoped API。生成恢复 prompt 时只使用 picker 已返回且通过 server 有界处理的 candidate root；prompt 仍要求 Agent 核对 Git、权限和 identity。

### 7. Agent 首次教学是条件化结果契约，不是固定对话脚本

产品 Buildr Skill 增加“首次使用交接”约束：成功完成 `init --agent` 后，Agent 读取最终 doctor 和当前 Project/Service 状态，用普通语言解释三层模型，并根据实际状态采取下一步：

- 没有 Project：询问用户要管理的业务、产品、系统或长期工作；
- 一个 Project 且无 Service：说明 Service 只在有代码仓/应用时需要，并询问是否接入或直接开始；
- 唯一 Project/Service：简短确认推断范围并邀请用户描述目标；
- 多个候选：只询问能够消除范围歧义的最少问题；
- runtime 仍需要 reload、新会话或 UI toggle：先如实说明，不宣称当前会话已经可用。

CLI 的成功输出提供稳定的 onboarding handoff 提示，不把 `project create` 命令作为面向人的默认下一步。Skill 规定结果、信息和边界，不规定逐字话术，保持 Agent 自主协作。

### 8. README 采用“问题与场景 → 第一次成功 → 最小模型 → 机制”顺序

中文 README 先形成审阅稿，再同步 canonical 中文和英文。公开入口依次回答：

1. Buildr 解决什么问题；
2. 哪些具体场景适合使用；
3. 可复制给 Agent 的第一次使用指令；
4. 使用 local app 或只使用 Agent 的两种路径；
5. Workspace → Project → Service 最小心智；
6. 完成第一项真实工作的例子；
7. Buildr 如何工作、当前能力、边界和深入文档。

Node、npm、runtime list、init、doctor、开发 checkout 和 Skill destination 等内容保留为 Agent/手动兜底信息，但不再占据普通用户快速开始的主叙事。README 不复制产品说明和 CLI Reference 的完整机制。

### 9. local app 作为人的认知与治理入口，但不改变 Agent-first 责任

产品说明新增明确边界：Agent 是理解、推理、规划和专业执行入口；local app 让人理解当前工作范围、查看真实状态、维护低风险 metadata，并把目标和 canonical scope 交给 Agent。它不会成为第二个 Agent、通用任务执行器或聊天客户端。

这项定位满足长期治理、人类可理解状态和确定性 handoff 的产品价值，同时保持“不与 Agent 抢活”。

## Risks / Trade-offs

- [引导文案与 Skill/README 漂移] → 在同一个 change 中修改 canonical specs、Buildr Skill、CLI handoff、README 和 local app，并增加静态 contract/verification 覆盖关键语义。
- [派生 onboarding 每次需要查询多个 Project 的 Service] → 复用当前有界 read model，并在 Application 聚合 completeness；单个 Project 失败不阻塞其他事实，页面显示 partial/degraded。
- [Service 可选导致用户不知道是否完成] → 开始页把 Service 解释为代码仓/应用资产，明确提供“暂不需要 Service，直接开始”，readiness 不以 Service 数量为硬门禁。
- [简化表单使执行参数不足] → prompt 明确要求 Agent解析、提议并确认缺失技术声明；真正 mutation 仍由 canonical CLI 严格校验。
- [将 Change 后置降低熟练用户效率] → Change 路由和页面保持不变，只移动到次级导航；深链接和全局 Agent Action 的高级入口继续可用。
- [恢复 prompt 暴露本机路径] → 只处理本机 loopback、session-protected、native picker 返回的 candidate；不允许普通 Workspace API 提交 path，也不发送到远程服务。
- [README 过长] → 普通用户路径保持短小，技术安装与机制放入折叠/后置章节并链接权威文档。
- [现有 UI 测试只覆盖静态和手工验收] → 为 Workspace 首次进入、Project/Service 引导、开始工作 prompt 增加可重复 browser primary-flow，仍分别报告自动浏览器、API/contract 和人工 acceptance。

## Migration Plan

1. 先实现纯 Application onboarding projection、结构化 picker result 和 prompt contracts，保持现有 API/路由行为可兼容。
2. 更新 Workspace 全局首页和开始页，再调整核心/次级导航与 Project/Service 上下文；旧 URL 不重定向到新 identity。
3. 更新 Agent Action 表单和开始工作交接；原完整字段仍作为高级输入，已有 prompt 调用方保持可用或获得明确 schema 兼容处理。
4. 更新 Buildr Skill、init handoff、bootstrap/onboarding verification 和公开文档。
5. 完成自动 browser primary-flow、窄屏和受影响验证，冻结所有自然语言与生成资产后运行最终 Candidate。

本变更没有持久化 schema migration。若 UI 发布后需要回滚，可恢复旧页面和 Skill/README 文案；Workspace、Project、Service 源资产和本机 Registry 继续兼容。

## Open Questions

无阻塞问题。实现阶段可以在不改变契约的前提下确定具体视觉文案、控件布局和高级字段的展开方式。
