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

### Requirement: 公开入口表达多层用户价值
Buildr 公开 README MUST 让个人用户、团队负责人和企业负责人分别理解 Buildr 对个人能力转化为组织资产、工作资产复用、团队工作方式共享、Agent 工具切换、多服务协作和跨岗位信息发现的价值，并 MUST 将尚未实现的企业能力与当前事实区分。

#### Scenario: 不同读者首次访问 README
- **WHEN** 个人用户、团队负责人或企业负责人首次阅读 README
- **THEN** README MUST 在快速开始前提供与其目标相关的价值说明或典型场景
- **AND** 企业价值 MUST 说明 Buildr 将散落在员工个人经验、工作能力和各处组织知识中的内容沉淀为可共享、可传承、可复用的组织资产
- **AND** 企业价值 MUST 表述为组织资产与协作治理基础，不得暗示当前已实现完整企业权限或云平台

### Requirement: 跨工作范围问题使用准确表述
Buildr 产品说明 MUST 将信息割裂问题描述为 Agent 往往只能感知当前工作范围内的信息、难以主动发现其他岗位或服务中与任务相关的依赖，并 MUST 将 Buildr 的作用限定为组织工作资产和提供发现基础。

#### Scenario: README 描述跨岗位协作
- **WHEN** README 解释传统文档、会议、IM 和口口相传造成的协作问题
- **THEN** README MUST 说明工作资产按岗位、仓库或工具割裂会限制 Agent 的任务视野
- **AND** README MUST NOT 绝对声称 Agent 获得 Buildr 后会自动理解所有跨岗位依赖
