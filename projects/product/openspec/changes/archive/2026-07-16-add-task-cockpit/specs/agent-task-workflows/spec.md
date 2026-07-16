## ADDED Requirements

### Requirement: task-triage 路由任务驾驶舱
Buildr 的 task-triage Skill MUST 在理解任务意图和影响范围后判断任务驾驶舱是“不需要”“创建”还是“继续维护”，并 MUST 在需要驾驶舱时引导 Agent 使用独立 `task-cockpit` Skill，而不是在 task-triage 中复制完整可视化流程。

#### Scenario: 复杂任务需要驾驶舱
- **WHEN** task triage 发现任务跨阶段、跨 change、跨服务或团队，存在交叉依赖、长期跟踪或多次用户判断
- **THEN** task triage MUST 将任务驾驶舱判定为“创建”或“继续维护”
- **AND** Agent MUST 使用 `task-cockpit` 执行创建或维护

#### Scenario: task triage 输出驾驶舱状态
- **WHEN** task triage 选择创建或继续维护驾驶舱
- **THEN** 面向用户的路径判定 MUST 在可确认时包含 task id、驾驶舱路径和当前状态
- **AND** task triage MUST NOT 猜测尚未解析的 Project 或文件路径

### Requirement: 任务进展回复保持驾驶舱可发现
Buildr task workflow guidance MUST 要求 Agent 在驾驶舱首次创建、实质更新、用户询问进度、任务暂停或完成时提供驾驶舱入口，并 MUST 避免在没有状态变化的每条短暂中间消息中机械重复链接。

#### Scenario: 实质状态变化后回复
- **WHEN** 驾驶舱对应任务的阶段、目标、方案、完成项、阻塞或验证结论发生实质变化
- **THEN** Agent MUST 先更新驾驶舱再汇报进展
- **AND** 回复 MUST 包含驾驶舱入口

#### Scenario: 短暂中间动作
- **WHEN** Agent 仅执行没有改变任务认知的短暂命令或检查
- **THEN** Agent MAY 省略驾驶舱链接
- **AND** 驾驶舱 MUST 在下一次实质状态回复中继续可发现
