## Context

Buildr 已具备组织（Organization/Root）、Project、Service、Rules、Skills、Commands、Components 和 Agent runtime 投射等产品模型，但当前公开入口先解释内部模型和命令，读者需要自行推导它们如何解决个人经验难以沉淀为组织资产、团队工作方式难以共享、Agent 客户端切换成本、多服务协作和跨岗位信息发现等问题。

本次变更服务三类读者：希望复用个人工作方式的个人用户，希望统一团队协作基础的团队负责人，以及希望降低工具锁定和跨岗位协调成本的企业负责人。Agent 是 Buildr 工作资产的主要消费者；人仍是一等参与者，但主要通过 Agent 表达目标、提供业务判断并确认重要决策。

## Goals / Non-Goals

**Goals:**

- 建立清晰、有记忆点且与当前能力一致的 Agent-first 产品定位。
- 使用“共享工作环境”解释 Buildr 的整体价值，使用可扩展的“组织工作资产”解释具体受管内容，不让当前资产类型枚举变成长期产品边界。
- 为核心英文品牌表达提供稳定、自然且语义一致的中文对应文本。
- 消除“Buildr 提供完整上下文”可能暗示直接构造 context window 的歧义。
- 让中英文 README 先回答为什么需要 Buildr、为谁创造什么价值，再解释模型、能力和命令。
- 保持 README、产品主说明、Buildr Skill、Buildr Core 和 OpenSpec 契约语义一致。

**Non-Goals:**

- 不新增工作资产类型、角色路由、上下文检索引擎或自动 context window 装载能力。
- 不改变 CLI、manifest、runtime adapter、render 或 sync 行为。
- 不宣称当前具备完整企业权限、云服务、审计平台或支持所有 Agent runtime。
- 不把 README 扩写为完整实现事实、CLI reference 或 Roadmap。

## Decisions

### 使用直接产品定义与独立简介

README 首屏直接说明 Buildr 是以 Agent 为主要用户的组织工作资产管理系统，再解释 Buildr 如何沉淀组织资产、帮助 Agent 完成端到端工作，以及人如何通过 Agent 参与。首屏不再叠加 slogan，让产品定义本身承担首次理解。

GitHub About 使用 `Buildr turns how your organization works into shared work assets for AI agents, portable across Agent runtimes.`，中文对应为“Buildr 将组织的工作方式沉淀为 Agent 可用的共享工作资产，并让这些资产适配不同 Agent runtime。”。核心心智 `Organize work in Buildr. Work through Agents.` 的中文对应为“在 Buildr 中组织工作，通过 Agent 开展工作。”，放在工作方式说明之后收束产品机制。首屏功能描述必须说明 Buildr 组织工作资产、让资产可在不同 Agent runtime 中使用，以及 Agent 如何使用这些资产。

GitHub About、README 产品定义和核心心智各自用于仓库摘要、首次理解和机制收束，不在首屏重复堆叠。当前能力章节必须继续列出实际支持的 runtime，避免把跨 runtime 的产品方向误读为现状。

### 将“共享工作环境”作为对外抽象

“共享工作环境”不是新的 Buildr 资产类型，而是组织工作资产经过治理并按 runtime 投射后，对 Agent 呈现的整体使用体验。Rules、Skills、Commands、Specs、Projects 和 Services 等是当前工作资产示例，不是封闭枚举；未来新增 MCP、hooks 或其他形态时，仍需通过独立 change 明确其模型、生命周期与安全边界，不能只凭 README 文案视为已支持。

相比“上下文平台”，“共享工作环境”还能包含行为边界、专业动作和工具能力，不会把 Buildr 缩减为信息检索或 prompt 拼装产品。

### 将任务上下文与工作资产分开，但不重复拆分 context window

产品语言只保留两个责任层次：

1. Buildr 组织和治理 Agent 可发现、可选择、可使用的工作资产，并将必要入口投射到 Agent runtime。
2. Agent 根据当前任务从工作资产和 workspace 中发现、选择相关内容，形成当前 context window 中的任务上下文。

不再把“从资产中选出的任务信息”和“context window 内容”描述为两个独立产品概念。Buildr 不承诺自动构造当前任务所需的全部 context window 内容，而是帮助 Agent 获得建立相关且充分任务上下文所需的组织化资产。

### 用跨工作范围的信息依赖描述协作问题

README 不使用“Agent 只能在残缺信息中工作”这种绝对表述。问题应描述为：当项目内容按岗位、仓库和工具割裂时，Agent 往往只能感知当前工作范围内的信息，难以主动发现其他岗位或服务中与任务相关的依赖。Buildr 通过统一组织项目工作资产，为 Agent 发现这些关联提供基础，但不宣称自动理解所有跨岗位依赖。

泛化描述 Agent 端到端工作范围时使用“跨领域”；只有明确指产品、设计、开发、测试等角色分工及其信息交接时使用“跨岗位”。英文分别使用 `cross-domain` / `across domains` 和 `cross-role`，不得把两种场景混为同一概念。

### 将个人能力沉淀为组织资产

企业价值不以“从个人客户端解耦”为主叙事。客户端只是资产散落的载体之一，真正的问题是规则、经验、专业能力和组织知识依附于个体员工，难以在成员之间持续复用，并可能随岗位变化或人员流动而损失。

README 应说明 Buildr 把散落在员工个人经验、工作能力、文档、仓库和工具中的内容统一组织为组织工作资产，使个人探索能够转化为可共享、可传承、可持续演进的组织价值。Agent 工具切换成本仍是结果层价值，不是最高层产品目的。

### README 先价值、后模型、再操作

中英文 README 使用一致的信息顺序：首屏定位、问题、工作方式、典型场景、分角色价值、核心模型、快速开始、当前能力与边界、文档导航、自举 workspace 说明。快速开始先区分 registry package 和开发 checkout 两种 Buildr 来源，再汇合到相同的 runtime discovery 与 init 流程；在正式稳定版发布前继续保留 release candidate 和已知限制说明。

末尾自举 workspace 章节不再重复 clone 和安装步骤，只解释本仓同时是 Buildr 产品源仓和 Buildr Organization/Root 实例、哪些目录是产品源、哪些是消费状态，以及开发者为何必须使用当前 checkout 的 CLI。这样快速开始负责“如何开始”，自举章节负责“如何理解本仓”，职责保持内聚。

产品主说明承载更完整的产品理解；Buildr Skill 只保留 Agent 执行需要的定位、责任边界和操作地图，避免复制 README 的营销结构。

## Risks / Trade-offs

- [Risk] Agent-first 被误解为排斥人类用户 → 明确人负责目标、判断和关键决策，个人、团队与企业价值均以人通过 Agent 工作为主线。
- [Risk] “共享工作环境”被误解为 Buildr 管理本机依赖、登录态或二进制 → 在核心模型和边界中继续说明 Buildr 不保存或安装这些内容。
- [Risk] 开放的工作资产概念被误解为当前已经支持 MCP、hooks 等所有形态 → 对外用“例如”说明当前形式，并在当前能力章节只列已实现事实；新增受管形态仍要求独立契约。
- [Risk] 跨岗位价值超过当前实现 → 使用“组织资产、提供发现基础”，不宣称自动角色路由或依赖推理。
- [Trade-off] README 会比当前版本更长 → 通过价值优先、技术细节下沉到链接和保持章节层次，换取首次理解成本下降。
- [Risk] 根 README 位于 Product Project 目录之外 → 其产品所有权由现有 OpenSpec 明确规定；变更仍以 Product change、双语一致性和产品验证作为门禁，不把根 README 视为独立事实源。

## Migration Plan

1. 先建立产品定位、用户模型和上下文责任边界的 delta specs 与契约基线。
2. 重写中文 README，并以相同结构和语义维护英文翻译。
3. 同步产品主说明、Buildr Skill 和 Buildr Core 的定位用语。
4. 运行 OpenSpec、README 结构、文档一致性和 Buildr 产品相关验证。
5. change 集成到主 checkout 后，从该 checkout 运行 `projects/product/buildr sync codex --target .`，将新版 Buildr Core 与 Buildr Skill 同步到当前自举 workspace，再运行 `projects/product/buildr doctor --agent codex --target . --json`。不得从未合并 task worktree 执行这一步。
6. 如需回滚，整体恢复本 change 修改的自然语言资产；CLI 和 runtime 数据不需要迁移。

## Open Questions

- 无。产品主张、上下文边界和 README 目标读者已由用户确认。
