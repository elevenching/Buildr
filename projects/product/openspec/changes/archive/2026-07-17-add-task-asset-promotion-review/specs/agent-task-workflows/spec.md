## ADDED Requirements

### Requirement: 内置任务资产审查与任务收尾保持分层
Buildr MUST 通过独立场景化 Skill 提供任务执行质量反思和资产沉淀审查，并 MUST 由 `task-finish` 在轻量资格判断命中后，在不改变现有收尾成功条件和授权边界的前提下非阻塞调用该能力。

#### Scenario: 用户要求复盘或沉淀任务成果
- **WHEN** 用户要求复盘任务执行质量或把可复用成果沉淀为 Rule 或 Skill
- **THEN** Buildr MUST 通过 `task-asset-review` Skill 指导 Agent 审查可观察任务节点和最终证据
- **AND** `task-triage`、`task-worktree` 和 `task-finish` MUST 继续分别负责语义分流、任务环境和完整收尾

#### Scenario: Task Finish 先检查当前任务语义完整性
- **WHEN** `task-finish` 准备完成一个包含 OpenSpec change 的任务
- **THEN** `task-finish` MUST 对照用户已确认目标和决策、change artifacts、最终实现及验证结果检查当前任务语义完整性
- **AND** 任务范围内的语义缺失或实现偏差 MUST 在资产审查门控前停止收尾并回到修正流程

#### Scenario: Task Finish 复用 OpenSpec contract sidebar
- **WHEN** 当前任务的语义完成检查通过且包含 active OpenSpec change
- **THEN** `task-finish` MUST 继续使用 proposal、pre-sync 和 post-sync contract checks 验证已记录契约、baseline、canonical specs、active conflict 和同步结果
- **AND** `task-asset-review` MUST NOT 重复承担当前 change 完整性或契约一致性判断

#### Scenario: Task Finish 先执行轻量资格判断
- **WHEN** `task-finish` 已确认当前任务候选 tree 和最终验证证据有效
- **THEN** `task-finish` MUST 先根据当前上下文检查工作边界纠正、假设被推翻、有效失败根因、无效重复、token 浪费、新长期约束、可复用流程或明确 Rule/Skill 候选等强信号
- **AND** 该资格判断 MUST NOT 调用工具、重新读取任务文件或加载完整 `task-asset-review`

#### Scenario: 轻量资格判断未命中
- **WHEN** `task-finish` 没有发现任何完整审查强信号
- **THEN** `task-finish` MUST 跳过 `task-asset-review` 并继续正常收尾
- **AND** 最终报告 MUST NOT 为形式完整增加任务复盘

#### Scenario: 轻量资格判断命中
- **WHEN** `task-finish` 发现至少一个完整审查强信号，且任务上下文与 worktree 证据仍可访问
- **THEN** `task-finish` MUST 调用 `task-asset-review` 或复用当前候选 tree 的有效审查结果
- **AND** 审查 MUST 在归档、提交、集成和清理的既有边界内保持只读和非阻塞

#### Scenario: 条件审查没有候选
- **WHEN** `task-finish` 的资格判断命中并执行任务资产审查，但没有重要质量发现或合格沉淀候选
- **THEN** `task-finish` MUST 继续正常收尾
- **AND** 最终报告 MAY 不增加形式化复盘内容

#### Scenario: 条件审查不可用或失败
- **WHEN** 资格判断命中，但 `task-asset-review` 已被用户卸载、当前 runtime 无法发现该 Skill，或审查执行失败
- **THEN** `task-finish` MUST 报告跳过或降级原因并继续正常收尾
- **AND** Buildr MUST NOT 将审查成功作为归档、提交、集成、推送或清理的新增前置条件

#### Scenario: 条件审查发现沉淀候选
- **WHEN** `task-finish` 的任务审查发现合格沉淀候选
- **THEN** `task-finish` MUST 在最终收尾报告中说明候选摘要、证据、目标资产和 scope
- **AND** `task-finish` MUST NOT 中断收尾等待确认、直接写入组织资产或把“收尾”解释为写入授权

#### Scenario: 当前能力不依赖任务 Hook
- **WHEN** Buildr 执行或描述任务资产审查
- **THEN** Buildr MUST 将当前 session 可访问的节点和最终证据作为输入
- **AND** Buildr MUST NOT 要求或规划 runtime Hook、daemon、watcher、事件总线或完整轨迹存储
