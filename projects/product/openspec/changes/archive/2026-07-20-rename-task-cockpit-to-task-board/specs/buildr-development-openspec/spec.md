## REMOVED Requirements

### Requirement: Project knowledge 区分当前事实与任务驾驶舱
**Reason**: 当前 task-scoped working knowledge 的 canonical 名称和目录迁移为任务看板与 `task-boards/`。
**Migration**: 使用新的“Project knowledge 区分当前事实与任务看板” Requirement；既有 `task-cockpits/` 页面原地保留。

## ADDED Requirements

### Requirement: Project knowledge 区分当前事实与任务看板
Buildr Project `openspec/knowledge/` MUST 允许在明确的 `task-boards/` 子目录保存新创建的 Agent-maintained task-scoped working knowledge，同时 MUST 保持 current-state knowledge、canonical specs、active changes 和历史 archive 的既有职责边界；既有 `task-cockpits/` 页面 MUST 原地保留且不得因产品升级被改写。

#### Scenario: 记录任务看板
- **WHEN** Agent 为复杂 Project 任务维护跨批次目标、计划、依赖、进度、风险和证据索引
- **THEN** 该 HTML MUST 保存在 `openspec/knowledge/task-boards/`
- **AND** 它 MUST 被标识为任务认知入口，而不是当前业务事实全集或规范性契约

#### Scenario: 任务看板包含未来批次
- **WHEN** 任务看板展示已经确认但尚未开始的后续批次或外部等待事项
- **THEN** 这些内容 MUST 被表达为当前任务计划或依赖状态
- **AND** knowledge 文档规则 MUST NOT 将它们误读为 Buildr 已实现能力或无条件产品承诺

#### Scenario: 读取权威事实
- **WHEN** 任务看板摘要与 canonical specs、active change、代码或验证证据存在冲突
- **THEN** Agent MUST 以对应权威来源核实并修正任务看板
- **AND** Agent MUST NOT 使用任务看板覆盖或回写权威事实

#### Scenario: 旧路径保留历史页面
- **WHEN** Project 在升级前已经包含 `task-cockpits/*.html`
- **THEN** Buildr update、sync 和 Agent MUST 保留这些文件的路径与内容
- **AND** 这些历史页面 MUST NOT 被批量转换为 `task-boards/` 页面或兼容跳转文件
