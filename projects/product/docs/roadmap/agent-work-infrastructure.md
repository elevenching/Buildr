# Agent 时代的工作基础设施

> Roadmap：尚未实现。本文记录 Buildr 的长期产品方向，以及 Buildr、Agent、企业协作平台和 Agent 生态项目之间的责任边界。它不是当前产品事实、行为契约、Rule、Skill 或 Agent runtime 资产。文中未来能力进入实现前仍需创建独立 OpenSpec change。

## 产品定位

Buildr 的上位愿景是：

> **Buildr 是 Agent 时代的工作基础设施。**

仅有这句话过于宽泛。面向当前能力与后续演进，更具体的产品定义是：

> **Buildr 把个人和组织的工作事实、工作方法与需要持续保留的共享工作状态，组织成可治理、可迁移、可供不同 Agent 使用的工作资产。**

边界用一句大白话表达：

> **Buildr 提供，不替 Agent 选择；Buildr 治理，不替 Agent 理解；Buildr 保存，不替 Agent 推进。**

Agent 可以更换，交互入口也可以更换，个人或组织不应因此重新积累全部工作。

## 最稳定的产品边界

Buildr 与 Agent 的边界不应由“Agent 当前还不会什么”决定。Agent 的理解、工具使用、任务拆解、subagent 编排和专业执行能力会持续增长，任何基于能力上限划出的边界都会后退。

更稳定的判断是：

- Buildr 管理需要跨会话、跨人员、跨 Agent 持续存在的工作资产和共享语义状态。
- Agent 管理当前任务如何理解、如何形成上下文、如何计划、如何编排能力并推进到结果。
- 外部系统继续拥有它们原生内容的 authority；Buildr 可以登记、关联和治理这些来源，不必复制全部内容。
- 确定性的进程、队列、租约、超时和并发限制可以由 Agent runtime 或可替换执行设施提供，不自动形成 Buildr 与 Agent 之间的第三个产品层。

“Buildr 管静态、Agent 管动态”可以作为直觉，但更准确的分类是：

| 状态 | 默认责任主体 | 例子 |
|---|---|---|
| 长期工作资产 | Buildr | Specs、Rules、Skills、项目事实、工作方法、外部文档引用 |
| 共享语义状态 | Buildr 提供持久化和治理，Agent 维护语义 | 已接受目标、Decision、Risk、Approval、Evidence、可接续的 Task State |
| 单次执行状态 | Agent / Agent runtime | 当前计划、context window、Tool 调用、subagent、会话压缩、Run 进度 |
| 人际交互事件 | 飞书等协作平台 | 消息、群聊、@、通知、会议、人工反馈 |

### Agent 可替换测试

每设计一项能力，都应询问：

> 如果明天从 ChatGPT 或 Codex 切换到 Claude Code，这项内容是否仍应被个人或组织保留并继续使用？

如果答案是“是”，它就不应只存在于某个 Agent 的私有会话、memory 或 runtime 中。典型内容包括：

- Workspace、Project、Service 的稳定身份与关系。
- 已接受的目标、约束、决策、风险与完成标准。
- 组织认可的工作事实、Rules、Skills 和 Commands。
- 产物、来源、变更、验证和交付证据。
- 下一个 Agent 继续工作所需的 Task State 与资产引用。

不需要迁移的通常是 Agent 内部机制：

- context window、prompt cache 和压缩策略。
- 隐藏推理、临时草稿和 Tool 选择过程。
- subagent 的具体实现与模型路由。
- 当前 Agent 的浏览器、终端和编辑工具实现。

Buildr 不复制 Agent 的内部状态，而是保证组织需要的工作连续性不依附于某个 Agent。

## Agent-centered 的运行模型

Buildr 不是任务语义路由器。它不先替 Agent 判断需要哪些 Workspace 或资产，再把组装好的上下文交给 Agent。

已经可以确认的未来职责关系是：

```text
                       Agent
                         │
             理解目标、判断范围、规划和执行
                         │
             ┌───────────┴───────────┐
             ▼                       ▼
      Buildr Skill / API          其他工具
             │                 浏览器、终端、MCP、
             ▼                 飞书、编码工具等
   Buildr Application Core
             │
             ▼
          Enterprise
             │
      ┌──────┼───────────┐
      ▼      ▼           ▼
 Workspace A Workspace B Workspace C
      │      │           │
      ▼      ▼           ▼
 文件/Git   飞书文档      数据库/其他来源
```

这是未来领域方向，不表示当前 Buildr 已经实现 Enterprise、多 Workspace 或远程数据源模型。

这里的 Agent-centered 指任务理解、范围选择和专业执行由 Agent 负责，不预设飞书等交互入口究竟直接连接 Agent，还是先进入 Buildr 再由 Buildr 调起 Agent。入口接入、会话承载与 Agent 启动方式仍是待验证的产品选择。

### Agent 的职责

Agent 根据用户目标和入口上下文：

1. 理解任务。
2. 判断可能涉及哪些 Workspace。
3. 通过 Buildr Application Core 查询 Enterprise 与 Workspace catalog。
4. 在相关 Workspace 中检索工作事实、工作方法和共享状态。
5. 判断哪些内容与任务相关并解决可能的冲突。
6. 形成自己的任务上下文。
7. 加载适用 Rules、Skills、工具和其他能力。
8. 规划、编排并执行工作。
9. 产生可返回交互入口的结果。
10. 对需要长期保留的结果，通过 Buildr 更新或提出工作资产候选。

### Buildr Application Core 的职责

Buildr 可以提供：

- Enterprise、Workspace、Project、Service 和工作资产 catalog。
- 按 identity、类型、scope、来源和关系查询。
- 全文、索引或其他确定性检索原语。
- 内容读取、来源追踪、版本、权限和完整性信息。
- 跨 Workspace 引用与稳定 identity。
- 工作资产生命周期、冲突保护、诊断和 runtime 投射。
- Agent 维护的 Task、Decision、Risk、Approval 和 Evidence 的持久化与可读投影。

Buildr 不负责：

- 判断用户真正想做什么。
- 自动决定任务需要哪些 Workspace。
- 替 Agent 判断检索结果的语义相关性。
- 组装 Agent 的 context window。
- 规划、选择 Tool、编排 subagent 或完成专业工作。

即使 Buildr 提供搜索与索引，也是 Agent 选择何时查询、查询什么以及如何使用结果。

## Enterprise 与多个 Workspace

未来完整产品可以把 Enterprise 建模为拥有多个相互隔离、可按权限访问的 Workspace：

```text
Enterprise
├── Workspace：产品研发
├── Workspace：业务经营
├── Workspace：品牌市场
├── Workspace：组织管理
└── Workspace：个人工作
```

一个任务可以跨多个 Workspace。Agent 可以从当前界面获得初始 Workspace hint，再根据任务判断是否扩大范围。Buildr 只提供 catalog、稳定 identity、访问控制、数据定位和跨 Workspace 引用，不维护固定业务路由表。

如果需要长期记录“本任务使用了哪些 Workspace”，该关系应由 Agent 得出并写入 Task State；Buildr 验证引用和权限，但不替 Agent作出语义选择。

## 三种界面的用户价值

飞书、Agent 原生界面和 Buildr 界面分别提供不同的用户体验，但这不等于已经确定它们之间的调用顺序。

### 飞书等企业协作界面：沟通优先

适合从消息、群聊、会议、文档和审批中发起工作，触达人、请求判断并反馈结果。

### Agent 原生界面：执行优先

适合长时间、多轮、工具密集的研究、编码、调试和专业执行。

### Buildr 界面：工作空间优先

适合浏览 Enterprise、Workspace、Project、资产、Task、Decision、Risk 和 Evidence，并从当前工作对象发起 Agent Action。

Buildr 界面可以把当前打开的 Workspace、Project、Task 或资产作为显式 hint，但仍由 Agent 判断是否还需要其他范围。受控 metadata 编辑可以直接调用 Application Core；需要理解和专业执行的工作继续交给 Agent。

目前不在本文中确定飞书应该直接接入 Agent，还是接入 Buildr 后由 Buildr 调起 Agent。两种方案都必须保持同一语义边界：Buildr 提供工作资产与确定性能力，Agent 判断任务范围、选择 Workspace 和资产并推进工作。

## 飞书等平台的双重关系

飞书、Slack、Teams 等平台首先是围绕人的交互和组织协作表面：它们拥有用户、群、消息、通知、会议、文档和原生审批等事实。

它们在 Buildr 架构中可以同时扮演两个角色。

### 角色一：人的交互入口

消息、@、群聊和会议为工作提供人与组织的交互上下文。该入口由 Agent 直接承载，还是由 Buildr 承载并调起 Agent，仍需结合身份映射、权限、会话接续、多 Agent 切换和部署复杂度继续验证。

### 角色二：工作资产的数据源

飞书文档、Wiki、多维表格或会议纪要可以被登记为某个 Workspace 的工作资产来源：

```text
Buildr Application Core
          │
          ▼
      Source Adapter
          │
          ▼
飞书文档 / Wiki / 多维表格 / 会议纪要
```

Buildr 不必复制全部内容。外部平台可以继续作为正文 authority；Buildr 管理稳定引用、Workspace 归属、来源、类型、权限、版本或漂移状态，并提供 Agent 可发现和读取的稳定入口。飞书作为交互界面和飞书文档作为工作资产来源是两个独立角色，不要求据此预设一条固定调用链。

前者是交互事件，后者是工作资产来源。

聊天内容也不自动成为正式工作资产。Agent 可以从讨论中提炼 Requirement、Decision、Rule 或 Task 候选；只有经过适用的确认、验证或治理流程，才升级为长期资产。

## Agent 没有固定职业身份

Buildr 不应把产品经理、开发、测试、设计或运营建模为固定 Agent 身份。Agent 的专业能力由当前任务动态形成：

```text
用户目标
+ Workspace 工作事实
+ 适用 Rules
+ 适用 Skills
+ 可用 Commands / Tools
+ 当前 Task State
= 当次 Agent 能力与工作身份
```

同一个 Agent 在一个任务中可以先分析产品问题，再修改代码、运行测试并准备发布；也可以为另一个任务研究市场并制作演示文稿。岗位名称可以作为人类可理解的能力视图或预设，但不是固定 runtime、固定权限路由或永久 Agent 实体。

安全审计仍可能需要记录具体 Agent runtime、模型、会话或执行者 identity。这里需要区分：

- **执行 identity**：用于权限、审计、Run 关联和故障诊断，可以稳定记录。
- **职业 identity**：产品经理、前端、测试等固定岗位身份，不作为 Agent 的本体。

历史 `agent-roles/` 文档只应作为专业职责和能力拆解素材，后续优先沉淀为可动态加载的 Rules、Skills、Packages 或 capability bindings。

## Agent 编排属于 Agent 的成长方向

Agent 编排不应默认成为 Buildr core 的 Planner、Scheduler 或固定角色路由。

未来 Agent 很可能自己完成：

- 将目标拆成 Task DAG。
- 判断依赖和并行机会。
- 为节点加载不同 Rules 与 Skills。
- 创建 subagent 或选择其他 Agent runtime。
- 聚合结果、处理冲突并决定下一步。
- 根据失败重新规划。

Buildr 可以支持这种自编排：

- 提供可查询的工作资产、能力 catalog 和 capability contracts。
- 持久化 Agent 已接受或需要跨会话接续的 Task DAG 与 Task State。
- 展示目标、决策、风险、依赖和证据。
- 验证资产 identity、scope、权限、来源和完整性。
- 为不同 Agent runtime 投射 Rules、Skills 和入口。

Buildr 不替 Agent 生成 DAG、分配职业角色或判断哪个节点需要哪个 Skill。

单次执行的 queue、claim、lease、heartbeat、timeout、retry、cancel 和并发限制属于 Execution Run 设施。它们可以由 Agent runtime、OpenHands、Multica 或其他可替换 provider 承担；只有真实异步、多机器或无人值守需求出现后，才需要独立评估，不先假设 Buildr 与 Agent 之间必须存在一个新产品。

## 生态项目如何解构

截至 2026-07-22，下面的分类基于各项目公开的一手文档，用于理解责任，不等于完整代码或安全审计。

| 项目 | 主要形态 | 对 Buildr 的关系 |
|---|---|---|
| Claude Code、Codex、OpenCode、Pi | Agent runtime / Agent 产品 | 理解、编排和执行工作；通过 Buildr Skill、标准资产或未来 API 使用 Buildr |
| OpenHands | Agent SDK、runtime platform 与 Agent server | 可以作为 Agent runtime 或 Execution Run provider；ACP 提供标准连接启发 |
| Multica | 人与 Agent 的任务协作和执行协调平台 | 语义工作资产可由 Buildr 承担，执行队列与 runtime 协调可以保持为外部 provider |
| OpenClacky | 本地 Agent workbench / runtime | 会话、记忆、Skills、工具和模型优化中的 runtime 部分属于 Agent；长期组织资产进入 Buildr 治理 |
| 飞书、Slack、Teams | 人与组织的交互协作平台 | 可作为工作入口和 Buildr 工作资产的数据源；入口具体接入 Buildr 还是 Agent 待验证 |

### OpenHands 与 ACP

OpenHands 的 Agent SDK 负责 reasoning-action loop、工具、会话和 workspace 执行；这些属于 Agent/runtime。它的 `ACPAgent` 可以把兼容 ACP 的 Agent 作为后端，OpenHands 自己也可以作为 ACP server。

ACP 对 Buildr 的价值是标准化 Agent 连接、session、stream、resume/close 和 permission request。它不改变责任边界：即使 Buildr 界面通过 ACP 连接 Agent，仍然是 Agent 调用 Buildr Application Core 查询资产并形成上下文，不是 Buildr 先替 Agent 组装上下文。

ACP 也不是完整治理或调度协议。接入方仍需决定权限、资产 authority、Task State、预算和证据边界。

### Multica

Multica 当前把 issue、成员、Agent definition、task queue、runtime daemon 和运行状态组合在一个产品中。按 Buildr 方向可拆为：

| Multica 能力 | 适合归属 |
|---|---|
| Workspace/Project 的企业工作含义 | Buildr |
| Issue 的目标、约束、Decision、Risk、Evidence | Agent 维护语义，Buildr 持久化和治理 |
| 组织 Rules、Skills、Agent instructions | Buildr 作为 source authority，Agent 使用 |
| 任务拆解、优先级、阻塞判断和换 Agent 建议 | Agent |
| queue、claim、lease、heartbeat、timeout、retry、cancel | Agent runtime 或可选 Execution Run provider |
| daemon、机器、进程和 runtime 健康 | Execution Run provider |
| 实时运行消息 | Agent 产生，协作平台或 provider 传输；重要决策和证据按需进入 Buildr |

Multica 不必成为 Buildr 与 Agent 的必经中间层。已经使用 Multica 的组织可以让它承担 Execution Run 与团队协作；Buildr 提供跨 Agent 的工作资产和共享语义状态。简单交互则可以由 Agent 直接使用 Buildr。

### OpenClacky

OpenClacky 把本地 Agent、Web/CLI 会话、Tools、长期 memory、Skills、定时任务和多模型能力组合在一个 workbench 中。按责任可拆为：

| OpenClacky 能力 | 适合归属 |
|---|---|
| 模型调用、Tool loop、浏览器、终端、缓存和压缩 | Agent/runtime |
| session history、context window 和私有 memory | Agent/runtime |
| 自动发现值得沉淀的知识 | Agent 产生候选 |
| 自动创建、测试和改进 Skill | Agent 产生和验证候选 |
| 组织 Skill 的正式版本、来源、作用域和完整性 | Buildr |
| 项目规则、正式决策和长期业务事实 | Buildr 或其登记的外部 source authority |
| 定时工作的语义、授权和完成标准 | Agent 维护，Buildr 按需持久化为工作资产 |
| 定时触发、进程和实际执行 | Agent/runtime 或 Execution Run provider |
| parser/script 自修复 | Agent 修复；需要共享时通过 Buildr 候选流程升级 |

OpenClacky 证明 Agent 可以持续演进自身能力，但“Agent 自动生成”不等于“组织正式采用”。Buildr 的价值在于把候选经过来源、diff、验证、审阅和作用域治理后，升级为其他 Agent 也能继续使用的工作资产。

## 不需要固定的第三层产品

核心逻辑只有两个主体：

```text
Buildr：个人或组织掌握的工作基础设施
Agent：理解、编排和执行工作的智能主体
```

两者可以通过 Buildr Skill、CLI、API、runtime adapter、ACP 或其他协议连接。Execution Run provider、企业协作平台和数据源都是可选设施或接口，不自动成为新的工作 authority。

产品形态可以不同：

- Buildr 作为独立基础设施，供多个 Agent 使用。
- Agent 产品内置 Buildr-compatible 工作资产能力。
- Buildr 界面通过 ACP 等方式内置或连接多个 Agent，形成完整工作平台。
- 飞书等协作平台通过待验证的接入方式使用同一套 Buildr 工作资产与 Agent 能力。

不论产品如何打包，都应保持一个不变量：企业工作资产和共享语义状态不能成为某个 Agent runtime、某个会话或某个协作平台的私有实现细节。

## Buildr 的上下文价值

Buildr 不管理模型的 context window，而是提供个人或组织的上下文供应基础：

- 工作事实和工作方法的来源、scope、版本和关系。
- Enterprise、Workspace、Project 与 Service 的结构。
- 外部数据源的稳定引用和访问边界。
- 跨 Agent 可接续的 Task、Decision、Risk 和 Evidence。
- Rules、Skills 与 Commands 的治理和 runtime 投射。

Agent 负责从这些内容中发现和选择相关信息，形成当前任务的 context window。Buildr 的目标不是替 Agent 做相关性判断，而是让 Agent 有可靠、可发现、可治理的材料进行判断。

## 演进原则

1. 先稳定 Enterprise、Workspace、工作资产、Source 与查询契约，再扩展数据源数量。
2. 保持 Agent-centered：Agent 选择 Workspace、资产、Rules、Skills、Tools 和其他 Agent。
3. 将固定岗位 Agent 继续拆成动态能力资产，不建设角色路由表。
4. 区分共享语义状态与 Execution Run 状态；只有需要接续和治理的部分进入 Buildr。
5. 验证飞书、Agent 原生界面和 Buildr 界面的接入、会话承载与身份映射方案，并保证不同入口可以共享同一 Application Core，而不是互相替代。
6. 研究 ACP 单 session 接入时，验证 Agent 回调 Buildr API、权限请求、取消、恢复和事件映射，不把 ACP 当成上下文编排器。
7. 允许 Agent 从任务中提出新的工作事实、方法和 Skill 候选；正式采用继续经过 Buildr 的来源、验证和治理边界。
8. 只有真实异步、多机器或无人值守需求出现后，再评估 Execution Run provider；优先保持可替换，不预设必须内建 Multica。

## 不进入 Buildr core 的内容

- 通用 Agent reasoning loop、Planner、Tool Scheduler 和 context window 管理。
- 固定产品、开发、测试、设计或运营 Agent 身份与路由表。
- 自动判断任务需要哪些 Workspace、资产、Rules 或 Skills。
- 复制 Claude Code、Codex、OpenHands 或 OpenClacky 的完整会话与工具执行能力。
- 把飞书、Slack 或 Teams 的全部消息和文档无差别复制为 Buildr 资产。
- 让 Agent 自动写入的 memory、Skill 或完成结论未经来源、验证和授权就成为组织正式资产。
- 因为接入 ACP 就默认自动批准权限或绕过现有安全边界。

## 参考资料

- [Agent Client Protocol：Architecture](https://agentclientprotocol.com/get-started/architecture)
- [OpenHands：ACP Agent](https://docs.openhands.dev/sdk/guides/agent-acp)
- [OpenHands：SDK Architecture](https://docs.openhands.dev/sdk/arch/overview)
- [Multica：How Multica works](https://multica.ai/docs/how-multica-works)
- [Multica：Tasks](https://multica.ai/docs/tasks)
- [Multica：Agents](https://multica.ai/docs/agents)
- [OpenClacky：What is OpenClacky?](https://www.openclacky.com/docs/what-is-openclacky)
- [OpenClacky：Harness Engineering](https://www.openclacky.com/docs/tech-deep-dive)
- [OpenClacky：Memory System](https://www.openclacky.com/docs/memory-system)
