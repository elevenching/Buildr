## ADDED Requirements

### Requirement: Project knowledge 区分当前事实与任务驾驶舱
Buildr Project `openspec/knowledge/` MUST 允许在明确的 `task-cockpits/` 子目录保存 Agent 维护的 task-scoped working knowledge，同时 MUST 保持 current-state knowledge、canonical specs、active changes 和历史 archive 的既有职责边界。

#### Scenario: 记录任务驾驶舱
- **WHEN** Agent 为复杂 Project 任务维护跨阶段目标、计划、依赖、进度、风险和证据索引
- **THEN** 该 HTML MUST 保存在 `openspec/knowledge/task-cockpits/`
- **AND** 它 MUST 被标识为任务认知入口，而不是当前业务事实全集或规范性契约

#### Scenario: 驾驶舱包含未来阶段
- **WHEN** 驾驶舱展示已经确认但尚未开始的后续阶段或外部等待事项
- **THEN** 这些内容 MUST 被表达为当前任务计划或依赖状态
- **AND** knowledge 文档规则 MUST NOT 将它们误读为 Buildr 已实现能力或无条件产品承诺

#### Scenario: 读取权威事实
- **WHEN** 驾驶舱摘要与 canonical specs、active change、代码或验证证据存在冲突
- **THEN** Agent MUST 以对应权威来源核实并修正驾驶舱
- **AND** Agent MUST NOT 使用驾驶舱覆盖或回写权威事实
