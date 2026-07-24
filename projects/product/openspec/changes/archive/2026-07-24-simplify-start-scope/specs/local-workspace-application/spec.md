## MODIFIED Requirements

### Requirement: Workspace 概览必须提供真实且可解释的摘要
Buildr MUST 将 Workspace 概览呈现为“开始”页，根据真实 Workspace、全部 Project 与 Service read model 展示当前工作范围、完整性和一个明确的下一步；页面 MUST NOT 持久化第二套 onboarding 状态、Project 选择状态，或把 Service 数量作为 Workspace readiness 的硬门禁。

#### Scenario: Workspace 没有 Project
- **WHEN** Workspace 与 Project read model 可读取且 Project registry 为空
- **THEN** 开始页 MUST 用普通语言说明 Workspace 与 Project 的关系
- **AND** MUST 将“让 Agent 创建第一个 Project”作为主要下一步
- **AND** MUST NOT 优先展示 Change、Rules、Skills 或技术 identity

#### Scenario: Workspace 有多个 Project
- **WHEN** Project read model 返回多个 Project
- **THEN** 开始页 MUST 展示整个 Workspace 的 Project 数量和进入项目目录的明确入口
- **AND** MUST NOT 在开始页要求、保存或锁定当前 Project
- **AND** MUST NOT 猜测当前业务范围或把任一 Project 标记为唯一正确选择

#### Scenario: Workspace 中没有 Service
- **WHEN** 全部可读取 Project 的 Service read model 均为空
- **THEN** 开始页 MUST 解释 Service 是代码仓、应用、模块或可执行资产
- **AND** MUST 说明 Service 对开始工作是可选范围，而非 Workspace 完成门槛
- **AND** MUST NOT 将该 Workspace 显示为未完成或不可用

#### Scenario: 已有可用工作范围
- **WHEN** Workspace、Project 与可读取 Service read model 均可读取
- **THEN** 开始页 MUST 展示当前 Workspace、Project 总数和可选 Service 总数
- **AND** MUST 将“用 Agent 开始”作为主要动作
- **AND** Project 数、Service 数、identity、schema 和 revision MUST 保持为次级摘要或技术信息

#### Scenario: 开始任务时选择临时范围
- **WHEN** 用户从开始页打开“用 Agent 开始”
- **THEN** 应用 MUST 在生成 prompt 前要求用户选择本次任务的 Project，并允许选择该 Project 的 Service
- **AND** 此选择 MUST 只用于当前 prompt
- **AND** 关闭、刷新或重新打开开始页后 MUST NOT 作为 Workspace 或开始页状态恢复

#### Scenario: 部分 Service 汇总不可用
- **WHEN** 至少一个 Project 的 Service read model 无法读取或需要迁移
- **THEN** 开始页 MUST 将 Service 汇总和 onboarding completeness 标识为部分不可用
- **AND** MUST NOT 将未知数量显示为完整事实
- **AND** Workspace 与可用的 Project 信息 MUST 继续展示

#### Scenario: 存在迁移要求
- **WHEN** Workspace、Project 或 Service read model 报告 migration required
- **THEN** 开始页 MUST 展示需要 Agent 执行显式 update 或 sync 的提示和可复制 Agent Action
- **AND** 打开开始页 MUST NOT 触发任何迁移写入

#### Scenario: 旧 Project 查询参数打开开始页
- **WHEN** 用户访问带有 `project` 查询参数的开始页 URL
- **THEN** HTTP interface MUST 忽略该参数并返回 Workspace 范围的开始页 projection
- **AND** MUST NOT 将该参数保存、回显为当前 Project 或传给 Agent 工作动作
