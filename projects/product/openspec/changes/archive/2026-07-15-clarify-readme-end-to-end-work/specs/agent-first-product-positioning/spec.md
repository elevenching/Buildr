## ADDED Requirements

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

## MODIFIED Requirements

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
