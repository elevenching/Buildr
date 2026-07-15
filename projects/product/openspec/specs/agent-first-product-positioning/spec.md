# Agent-first 产品定位规范

## Purpose

定义 Buildr 对外的 Agent-first 用户模型、组织工作资产、共享工作环境、任务上下文责任边界与多层用户价值表达。

## Requirements

### Requirement: Buildr 采用 Agent-first 用户模型
Buildr MUST 将 Agent 视为组织工作资产的主要使用者，并 MUST 将人描述为通过 Agent 表达目标、提供业务判断和确认重要决策的一等参与者。

#### Scenario: 公开入口介绍 Buildr 用户
- **WHEN** README、产品主说明或 Buildr Skill 介绍 Buildr 的用户与协作关系
- **THEN** 文档 MUST 优先说明 Agent 如何消费组织工作资产并引导工作
- **AND** 文档 MUST 说明人无需先掌握完整内部模型或命令体系即可通过 Agent 使用 Buildr

### Requirement: Buildr 区分工作资产、共享工作环境和任务上下文
Buildr MUST 将组织长期复用的工作内容、工作能力和工作方式统一描述为组织工作资产，将这些资产经组织和 runtime 投射形成的整体使用体验描述为 Agent 的共享工作环境，并 MUST 将任务上下文限定为 Agent 根据当前任务发现、选择并加载到当前 context window 的相关内容。Rules、Skills、Commands、Specs、产品事实、Projects、Services 和协作流程等 MUST 只作为当前示例，不得被描述为封闭的长期资产枚举。

#### Scenario: 产品文档解释上下文责任
- **WHEN** 公开文档解释 Buildr 如何帮助 Agent 获得任务信息
- **THEN** 文档 MUST 说明 Buildr 组织和投射 Agent 可发现、可选择、可使用的工作资产
- **AND** 文档 MUST 说明 Agent 负责根据任务形成任务上下文
- **AND** 文档 MUST NOT 宣称 Buildr 直接提供完整 context window 或保证所有任务信息完整无缺
- **AND** 文档提及尚未实现的 MCP、hooks 或其他未来资产形态时 MUST 明确其不是当前能力事实

### Requirement: README 直接表达同一 Agent 任务的端到端工作连续性
Buildr 公开 README MUST 先用直接、简洁的语言说明 Agent 可以在同一个用户任务窗口中，从想法、方案和文档持续推进到执行、验证、集成和交付，并 MUST 将 Buildr 的作用描述为组织 Agent 在各阶段可发现和使用的工作资产。README MUST 将“同一个 Agent 窗口”限定为用户任务连续性，不得将其等同于单个模型 context window、一次加载全部资产或无条件自动完成所有工作。

#### Scenario: 首次访问者理解端到端价值
- **WHEN** 个人、团队成员或组织负责人首次阅读 README 首屏和端到端场景
- **THEN** README MUST 让读者无需先理解 Rules、Skills、Project、Service 或 runtime adapter 即可知道 Buildr 帮助 Agent 连续推进整件工作
- **AND** README MUST 说明 Agent 随任务阶段发现并使用相关事实、规则、能力、项目关系和流程
- **AND** README MUST 说明人继续提供目标、业务判断以及权限或外部审批

#### Scenario: Buildr 使用自举事实证明端到端工作
- **WHEN** README 使用 Buildr 自身作为端到端案例
- **THEN** 案例 MUST 将讨论梳理、OpenSpec 提案/设计/任务、实现测试、Git 集成、GitHub Actions 和 npm 发布限定为 Buildr 当前已经建立的工作链
- **AND** 案例 MUST NOT 宣称 Buildr 已提供通用 workflow engine、多 Agent 自动编排或全部外部工具的内置集成

### Requirement: README 按真实 workspace 与 runtime 边界解释 Buildr
Buildr 公开 README MUST 区分 Agent 在 Buildr workspace 或 Project 中直接发现和使用的长期源资产，以及由 runtime adapter 投射到 Agent 原生入口的资产。README MUST 将 Project 事实、OpenSpec、普通文档、Commands、registries 和 Service 内容保持为 workspace/Project 源资产，并 MUST 将 runtime 投射限定为 Rules、workspace/Project Skills、产品 Buildr Skill、Skill install plans 及 adapter 契约明确声明的入口。

#### Scenario: README 展示 Buildr 如何工作
- **WHEN** README 使用图示或文字解释 Buildr workspace、Agent 与 runtime adapter 的关系
- **THEN** README MUST 展示 Agent 可以直接从 workspace 或 Project 发现项目事实和 Service 内容
- **AND** README MUST 展示 runtime adapter 只投射当前 Agent 原生需要的受支持入口
- **AND** README MUST NOT 暗示普通项目说明、全部工作资产或 Service repo 都会复制或渲染进 Agent runtime

### Requirement: 公开入口表达多层用户价值
Buildr 公开 README MUST 让个人用户、团队成员和企业负责人分别理解 Buildr 对同一 Agent 窗口端到端工作、个人能力转化为长期资产、团队基于共同 Project 事实协作、工作资产复用、Agent 工具切换、多服务工作和跨岗位信息发现的价值，并 MUST 将尚未实现的企业能力与当前事实区分。README MUST 通过用户可代入的具体工作场景表达这些价值，不得仅使用抽象角色价值表或产品能力分类替代场景。

#### Scenario: 不同读者首次访问 README
- **WHEN** 个人用户、团队成员或企业负责人首次阅读 README
- **THEN** README MUST 在快速开始前提供与其工作问题相关的具体场景
- **AND** 个人价值 MUST 说明 Agent 可以在同一任务中持续推进端到端工作并复用个人工作资产
- **AND** 团队价值 MUST 说明产品岗位维护 Project 中的产品事实，设计、开发、测试等岗位的 Agent 基于同一事实工作，事实更新后后续岗位自然使用最新来源
- **AND** 企业价值 MUST 说明 Buildr 将散落在员工个人经验、工作能力和各处组织知识中的内容沉淀为可共享、可传承、可复用的组织资产
- **AND** 企业价值 MUST 表述为组织资产与协作治理基础，不得暗示当前已实现完整企业权限、云平台或数据防泄漏能力

#### Scenario: 团队基于同一项目事实协作
- **WHEN** README 以产品变更说明跨岗位协作
- **THEN** README MUST 说明产品岗位维护产品文档、PRD、Specs 和相关产品事实
- **AND** README MUST 说明设计、开发、测试等岗位的 Agent 根据当前任务发现并使用同一 Project 事实及各自领域资产
- **AND** README MUST 说明其他岗位发现产品问题后反馈产品修改事实源，后续岗位工作自然使用更新后的内容
- **AND** README MUST NOT 将该协作价值归因于固定 Team Leader 路由、固定岗位 Agent 或自动同步所有副本

### Requirement: 跨工作范围问题使用准确表述
Buildr 产品说明 MUST 将信息割裂问题描述为 Agent 往往只能感知当前工作范围内的信息、难以主动发现其他岗位或服务中与任务相关的依赖，并 MUST 将 Buildr 的作用限定为组织工作资产和提供发现基础。

#### Scenario: README 描述跨岗位协作
- **WHEN** README 解释传统文档、会议、IM 和口口相传造成的协作问题
- **THEN** README MUST 说明工作资产按岗位、仓库或工具割裂会限制 Agent 的任务视野
- **AND** README MUST NOT 绝对声称 Agent 获得 Buildr 后会自动理解所有跨岗位依赖

### Requirement: Buildr 功能优先由 Agent 执行
Buildr MUST 将 Agent 作为产品功能的默认操作入口；人通过 Agent 表达目标、授权必要变更和提供 Agent 无法代替的判断，而不需要默认代 Agent 执行 Buildr 命令。

#### Scenario: Agent 能安全完成用户目标
- **WHEN** Agent 已理解用户目标，具备完成 Buildr 动作所需的工具和权限，且已取得该动作要求的授权
- **THEN** Agent MUST 直接执行该 Buildr 动作并验证结果
- **AND** Agent MUST NOT 把命令或操作步骤作为默认交付结果要求用户代为执行

#### Scenario: 动作需要用户授权
- **WHEN** Agent 能完成 Buildr 动作但该动作需要用户确认范围、影响或写操作授权
- **THEN** Agent MUST 先说明必要影响并请求授权
- **AND** 用户确认后 Agent MUST 直接执行，而不是再次要求用户手动操作

#### Scenario: 手动操作作为兜底
- **WHEN** 用户明确选择手动方式，或 Agent 因工具不可用、权限、登录态、外部环境等原因无法完成动作
- **THEN** Agent MUST 提供准确、可执行的手动操作方式
- **AND** Agent 无法执行时 MUST 说明具体阻塞原因
