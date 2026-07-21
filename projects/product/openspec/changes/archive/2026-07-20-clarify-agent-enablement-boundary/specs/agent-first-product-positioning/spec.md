## MODIFIED Requirements

### Requirement: Buildr 采用 Agent-first 用户模型
Buildr MUST 将 Agent 视为组织工作资产的主要使用者，并 MUST 将人描述为通过 Agent 表达目标、提供业务判断和确认重要决策的一等参与者。Buildr MUST 将组织持续维护的工作资产作为成员进入组织后通过 Agent 开展工作的共同基础，并 MUST 在公开入口用直接语言表达“任何人进入组织都可以从一句自然语言指令开始，由 Agent 准备工作环境并进入任务”。

#### Scenario: 公开入口介绍 Buildr 用户
- **WHEN** README、产品主说明或 Buildr Skill 介绍 Buildr 的用户与协作关系
- **THEN** 文档 MUST 优先说明 Agent 如何消费组织工作资产并引导工作
- **AND** 文档 MUST 说明人无需先掌握完整内部模型或命令体系即可通过 Agent 使用 Buildr

#### Scenario: 组织成员从自然语言指令进入任务
- **WHEN** README 或产品主说明介绍组织成员如何基于已有工作资产开始工作
- **THEN** 文档 MUST 直接表达任何人进入组织都可以从一句自然语言指令开始，由 Agent 准备工作环境并进入任务
- **AND** 具体初始化、同步、权限与环境前置条件 MUST 留在相应使用说明和行为契约中，不得堆叠进该产品承诺

### Requirement: Buildr 区分工作资产、共享工作环境和任务上下文
Buildr MUST 将组织长期复用的工作事实和工作方法统一描述为组织工作资产，将这些资产经组织和 runtime 投射形成的整体使用体验描述为 Agent 的共享工作环境，并 MUST 将任务上下文限定为 Agent 根据当前任务发现、选择并加载到当前 context window 的相关内容。工作事实描述“干的是什么”，工作方法描述“怎么干”；专业能力 MUST 作为工作方法可承载的内容，不得与工作事实、工作方法并列为第三个公开顶层分类。Rules、Skills、Commands、Specs、产品事实、Projects、Services 和协作流程等 MUST 只作为当前示例，不得被描述为封闭的长期资产枚举。

#### Scenario: 产品文档解释上下文责任
- **WHEN** 公开文档解释 Buildr 如何帮助 Agent 获得任务信息
- **THEN** 文档 MUST 说明 Buildr 组织和投射 Agent 可发现、可选择、可使用的工作资产
- **AND** 文档 MUST 说明 Agent 负责根据任务形成任务上下文
- **AND** 文档 MUST NOT 宣称 Buildr 直接提供完整 context window 或保证所有任务信息完整无缺
- **AND** 文档提及尚未实现的 MCP、hooks 或其他未来资产形态时 MUST 明确其不是当前能力事实

#### Scenario: 公开入口解释工作资产
- **WHEN** README、产品主说明、Buildr Skill 或 Buildr Core 概括工作资产的内容
- **THEN** 文档 MUST 使用“工作事实”和“工作方法”作为公开顶层解释
- **AND** 文档 MAY 使用 Rules、Skills、Commands、Specs、Projects、Services 或专业能力作为两类内容的示例
- **AND** 文档 MUST NOT 将该二分法描述为受管资产类型的封闭枚举

## ADDED Requirements

### Requirement: Buildr 不复制 Agent 的通用工作能力
Buildr MUST NOT 将自身定位或设计为另一个 Agent，也 MUST NOT 接管 Agent 的通用理解、推理、规划、对话和专业任务执行职责。Buildr 产品核心 MUST 聚焦组织工作资产治理、Agent 可发现入口、runtime 投射、确定性状态变更、完整性保护和诊断；可复用专业动作 MUST 由 Buildr 作为工作方法治理并交给 Agent 使用，而不是实现为 Buildr 自身的推理或执行主体。

#### Scenario: 评审新增产品能力
- **WHEN** 维护者评审一项拟进入 Buildr 的产品能力
- **THEN** 设计 MUST 说明该能力提供的长期治理、跨 Agent 复用、确定性约束或可验证诊断价值
- **AND** 如果该能力只是在 Buildr 内复制 Agent 已有的通用理解、推理、规划、对话或专业任务执行能力，设计 MUST 将其保留给 Agent，不得加入 Buildr 产品核心
- **AND** 如果该能力代表需要复用和治理的专业动作，设计 MUST 优先将其表达为 Agent 使用的 Skill 或其他工作方法资产

#### Scenario: 产品说明解释 Buildr 与 Agent 的关系
- **WHEN** README、产品主说明或开发规则解释 Buildr 与 Agent 的职责边界
- **THEN** 文档 MUST 说明 Buildr 不成为另一个 Agent，而是为 Agent 组织和准备开展工作所需的资产、入口与确定性边界
- **AND** 文档 MUST 保留 Agent 发现相关内容、形成任务上下文、推理并推进任务的责任
