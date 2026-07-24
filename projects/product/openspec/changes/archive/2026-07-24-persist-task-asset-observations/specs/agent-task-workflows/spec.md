## MODIFIED Requirements

### Requirement: 内置任务资产审查与任务收尾保持分层
Buildr MUST 将持续观察、资格审查、候选分类、人工决定和去向交接交给 selected `buildr.task-asset-review/v2` provider；`task-finish` MUST 只在 cleanup 前触发 finalize 并等待 provider 结果。

#### Scenario: Task Finish 触发 finalize
- **WHEN** `task-finish` 已确认当前任务语义、候选 tree 和验证证据有效
- **THEN** `task-finish` MUST 调用 selected asset-review provider finalize
- **AND** `task-finish` MUST NOT 汇总观察信号、执行资格门禁或判断最终应沉淀什么

#### Scenario: 没有 observation
- **WHEN** provider finalize 返回 `no-observation` 或 `discarded`
- **THEN** `task-finish` MUST 继续正常收尾

#### Scenario: 等待人工决定
- **WHEN** provider finalize 返回 `awaiting-human`
- **THEN** `task-finish` MUST 在 worktree cleanup 前等待用户 accept 或 reject
- **AND** accept MUST 只创建后续新任务 handoff，不得改变原任务范围

#### Scenario: Optional provider 不可用
- **WHEN** v2 provider 未绑定、已卸载或执行失败
- **THEN** `task-finish` MUST 报告降级并继续既有收尾
- **AND** `task-finish` MUST NOT 自行实现备用资产审查

#### Scenario: 当前能力不依赖任务 Hook
- **WHEN** Buildr 执行任务资产观察和审查
- **THEN** Buildr MUST 使用 Agent 已可见节点和 Skill 内部资源
- **AND** Buildr MUST NOT 要求 runtime Hook、daemon、watcher、事件总线或完整轨迹存储

### Requirement: 内置任务 Skills 按 capability contract 协作
Buildr 内置任务 Skills MUST 依赖 capability contracts 而不是硬编码 optional Skill identity；Task Finish MUST 通过 optional `buildr.task-asset-review/v2` dependency 触发 observation finalize，并将全部审查政策保留在 provider。

#### Scenario: Task Finish 使用 optional v2 provider
- **WHEN** Buildr 声明 `task-finish` builtin
- **THEN** manifest MUST 将 `buildr.task-asset-review/v2` 声明为 optional dependency
- **AND** provider 替换后 Task Finish MUST 保持同一 finalize/result contract

#### Scenario: Optional provider 缺失
- **WHEN** v2 provider 不可用
- **THEN** Task Finish readiness MUST 保持 non-blocking degraded
- **AND** 其他 required providers MUST 不受影响
