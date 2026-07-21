## REMOVED Requirements

### Requirement: task-triage 路由任务驾驶舱
**Reason**: 当前任务可视化入口改为 `task-board`。
**Migration**: 使用新的“task-triage 路由任务看板” Requirement。

### Requirement: 任务进展回复保持驾驶舱可发现
**Reason**: 当前进展回复统一提供任务看板入口。
**Migration**: 使用新的“任务进展回复保持任务看板可发现” Requirement。

## ADDED Requirements

### Requirement: task-triage 路由任务看板
Buildr 的 task-triage Skill MUST 在理解任务意图和影响范围后判断任务看板是“不需要”“创建”还是“继续维护”，并 MUST 在需要看板时引导 Agent 使用独立 `task-board` Skill，而不是在 task-triage 中复制完整可视化流程；创建看板前 MUST 已解析至少一个真实 OpenSpec change。

#### Scenario: 复杂任务需要任务看板
- **WHEN** task triage 发现任务跨批次、跨 change、跨服务或团队，存在交叉依赖、长期跟踪或多次用户判断
- **THEN** task triage MUST 将任务看板判定为“创建”或“继续维护”
- **AND** Agent MUST 使用 `task-board` 执行创建或维护

#### Scenario: 看板需要先建立 change 锚点
- **WHEN** task triage 判定复杂任务需要创建任务看板但尚无已创建的 OpenSpec change
- **THEN** task triage MUST 先将任务路由到 change-flow 并创建、核实 change
- **AND** Agent MUST NOT 用未来 change 名称或普通计划代替真实关联

#### Scenario: task triage 输出看板状态
- **WHEN** task triage 选择创建或继续维护任务看板
- **THEN** 面向用户的路径判定 MUST 在可确认时包含 task id、看板路径、关联 change 和当前状态
- **AND** task triage MUST NOT 猜测尚未解析的 Project、change 或文件路径

### Requirement: 任务进展回复保持任务看板可发现
Buildr task workflow guidance MUST 要求 Agent 在任务看板首次创建、迁移、实质更新、用户询问进度、任务暂停或完成时提供任务看板入口，并 MUST 避免在没有状态变化的每条短暂中间消息中机械重复链接。

#### Scenario: 实质状态变化后回复
- **WHEN** 任务看板对应任务的批次、目标、方案、完成项、阻塞或验证结论发生实质变化
- **THEN** Agent MUST 先更新任务看板再汇报进展
- **AND** 回复 MUST 包含任务看板入口

#### Scenario: 短暂中间动作
- **WHEN** Agent 仅执行没有改变任务认知的短暂命令或检查
- **THEN** Agent MAY 省略任务看板链接
- **AND** 任务看板 MUST 在下一次实质状态回复中继续可发现
