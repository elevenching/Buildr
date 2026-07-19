## MODIFIED Requirements

### Requirement: task-triage 路由任务驾驶舱
Buildr 的 task-triage Skill MUST 在理解任务意图和影响范围后判断任务驾驶舱（任务看板）是“不需要”“创建”还是“继续维护”，并 MUST 在需要看板时引导 Agent 使用独立 `task-cockpit` Skill，而不是在 task-triage 中复制完整可视化流程；创建看板前 MUST 已解析至少一个真实 OpenSpec change。

#### Scenario: 复杂任务需要任务看板
- **WHEN** task triage 发现任务跨批次、跨 change、跨服务或团队，存在交叉依赖、长期跟踪或多次用户判断
- **THEN** task triage MUST 将任务看板判定为“创建”或“继续维护”
- **AND** Agent MUST 使用 `task-cockpit` 执行创建或维护

#### Scenario: 看板需要先建立 change 锚点
- **WHEN** task triage 判定复杂任务需要创建任务看板但尚无已创建的 OpenSpec change
- **THEN** task triage MUST 先将任务路由到 change-flow 并创建、核实 change
- **AND** Agent MUST NOT 用未来 change 名称或普通计划代替真实关联

#### Scenario: task triage 输出看板状态
- **WHEN** task triage 选择创建或继续维护任务看板
- **THEN** 面向用户的路径判定 MUST 在可确认时包含 task id、看板路径、关联 change 和当前状态
- **AND** task triage MUST NOT 猜测尚未解析的 Project、change 或文件路径
