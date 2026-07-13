## Why

Buildr 当前公开定位准确描述了工作资产与 runtime 投射机制，但将人、Agent 和组织并列为用户，未能突出 Agent 是组织工作资产的主要消费者，也没有让个人用户、团队负责人和企业负责人快速理解 Buildr 如何降低资产传播、Agent 工具切换、多服务协作和跨岗位信息发现的成本。现有文档还容易把 Buildr 管理的工作资产、Agent 为任务选择的信息和 context window 混称为“上下文”，需要建立更准确且一致的产品语言。

## What Changes

- 将 Buildr 的正式产品定位调整为 Agent-first：组织沉淀工作方式与工作资产，Agent 是主要使用者，人通过 Agent 表达目标、提供判断并参与关键决策。
- 将“共享工作环境”作为对外解释 Buildr 价值的主要概念，将“组织工作资产”定义为可扩展的产品概念；Rules、Skills、Commands、Specs、Projects 和 Services 等只用于说明当前形态，不穷举未来资产边界。
- 明确 Buildr 不创建或填充 context window；Buildr 组织并投射 Agent 可发现的工作资产，由 Agent 根据当前任务发现和选择相关内容，形成任务上下文。
- 为核心英文产品表达提供稳定的中文对应文本，并重构中英文 README 的首屏、问题陈述、工作方式、典型场景和分角色价值，使个人用户、团队负责人和企业负责人都能快速理解 Buildr 的用途与边界。
- 将企业价值从“脱离个人客户端”调整为“从个人员工中沉淀为组织资产”：统一治理散落在员工个人经验、工作能力和各处组织知识中的工作内容，使其成为可传承、可复用的组织价值。
- 在 README 快速开始中同时提供 registry package 和开发 checkout 两种 Buildr 来源；末尾自举 workspace 章节只解释本仓的产品源、消费状态和开发边界，避免重复 onboarding。
- 更新产品主说明、Buildr Skill 与基础 Rule 中的定位和术语，避免公开入口、Agent 使用入口和长期产品事实发生漂移。
- 保留当前 CLI、资产模型和 runtime adapter 行为，不包含破坏性变更。

## Capabilities

### New Capabilities

- `agent-first-product-positioning`: 定义 Agent-first 用户模型、共享工作环境、开放的组织工作资产概念与任务上下文的产品语言，以及公开入口面向不同读者必须表达的价值。

### Modified Capabilities

- `human-agent-onboarding`: 明确 Agent 是 Buildr 工作资产的主要使用者，人优先通过 Agent 使用 Buildr，并要求 onboarding 体现这种协作关系。
- `workspace-first-runtime-projection`: 明确 runtime render 只投射 Agent 可读的工作资产入口，不替 Agent 选择任务信息或直接构造 context window。
- `open-source-release-governance`: 调整双语 README 的必备产品入口结构，使定位、价值、工作方式、快速开始、当前能力和文档导航保持语义对齐。

## Impact

- 规范：新增 `agent-first-product-positioning`，修改 `human-agent-onboarding`、`workspace-first-runtime-projection` 和 `open-source-release-governance`。
- 产品文档：`docs/buildr-product.md`。
- Agent 与产品治理入口：`AGENTS.md`、`package/targets/runtime/skills/buildr/SKILL.md`、`package/targets/workspace/rules/buildr/core.md`。
- 公开入口：根 `README.md` 与 `README.en.md`。
- 验证：双语 README 结构检查、OpenSpec strict validation、文档一致性与 EOF 检查。
- 不修改 CLI 命令、数据格式、runtime adapter 实现或外部依赖。
