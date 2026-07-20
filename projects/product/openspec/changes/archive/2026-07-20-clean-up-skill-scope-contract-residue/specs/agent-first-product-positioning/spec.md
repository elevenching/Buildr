## MODIFIED Requirements

### Requirement: README 按真实 workspace 与 runtime 边界解释 Buildr
Buildr 公开 README MUST 区分 Agent 在 Buildr workspace 或 Project 中直接发现和使用的长期源资产，以及由 runtime adapter 投射到 Agent 原生入口的资产。README MUST 将 Project 事实、OpenSpec、普通文档、Commands、registries 和 Service 内容保持为 workspace/Project 源资产，并 MUST 将 Skills 描述为 workspace source，经 user/workspace destination 投射；Project 只提供 capability/applicability context。

#### Scenario: README 展示 Buildr 如何工作
- **WHEN** README 使用图示或文字解释 Buildr workspace、Project、Agent 与 runtime adapter 的关系
- **THEN** README MUST 展示 Agent 可以直接从 workspace 或 Project 发现项目事实和 Service 内容
- **AND** README MUST 展示 runtime adapter 只投射当前 Agent 原生需要的 Rules、workspace Skills、产品 Buildr Skill、Skill install plans 及 adapter 契约明确声明的入口
- **AND** README MUST NOT 暗示 Project Skill source、普通项目说明、全部工作资产或 Service repo 会复制或渲染进 Agent runtime
