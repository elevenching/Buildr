## ADDED Requirements

### Requirement: Runtime 投射不得替代 Agent 构建任务上下文
Buildr runtime render MUST 只投射 supported Agent 使用组织工作资产所需的规则入口、Skills 和安装计划等 runtime 资产，并 MUST 保留由 Agent 根据当前任务判断相关性和形成任务上下文的责任边界。

#### Scenario: Agent 从投射后的工作环境开始任务
- **WHEN** Agent 在完成 Buildr runtime render 的 workspace 中处理一项任务
- **THEN** Buildr MUST 提供已受管工作资产的 Agent 可读入口
- **AND** Agent MUST 根据用户目标、修改范围、项目结构、资产语义和已有 workspace 信息选择任务相关内容
- **AND** Buildr MUST NOT 将 render 结果描述为已经构造完成的 context window

#### Scenario: 任务依赖其他岗位或服务信息
- **WHEN** 当前任务可能依赖其他岗位沉淀的规范、产品事实、专业流程或其他 Service 的信息
- **THEN** Agent MUST 能从 Buildr 组织的 workspace 与 Project 资产中发现和选择相关内容
- **AND** Buildr runtime adapter MUST NOT 使用固定岗位路由替 Agent 判断这些内容的语义相关性
