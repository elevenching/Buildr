## MODIFIED Requirements

### Requirement: Buildr 提供任务资产沉淀审查 Skill
Buildr MUST 提供 optional 内置 `task-asset-review` Skill，指导 Agent 从非简单 Workspace 任务开始后的可观察节点持续收集轻量信号，在任务结束时审查执行质量，并识别值得进入独立任务的资产候选。

#### Scenario: 非简单 Workspace 任务开始
- **WHEN** Agent 开始探索、设计、诊断、实现或验证一个非简单 Workspace 任务
- **THEN** Agent MUST 使用 `task-asset-review` 判断是否需要创建或更新轻量 observation
- **AND** Agent MUST NOT 为简单问答机械创建 observation

#### Scenario: 用户明确要求复盘或沉淀任务成果
- **WHEN** 用户要求 Agent 复盘任务执行、总结可沉淀资产或保留可复用工作方法
- **THEN** Agent MUST 使用 `task-asset-review` 完成当前 observation 的审查
- **AND** Agent MUST NOT 假设每个任务都必须产生新资产

#### Scenario: Workspace 不需要该能力
- **WHEN** 用户卸载 optional `task-asset-review` builtin 并重新同步 runtime
- **THEN** Buildr MUST 删除该 Skill 的 workspace 源和 runtime 投射
- **AND** 其他任务工作流 MUST 继续并明确 observation 能力不可用

### Requirement: 候选只映射到 Rule 或 Skill
Agent MUST 将合格候选限制为 Rule、Skill、capability Contract 或 product follow-up，并 MUST NOT 由资产审查直接修改这些目标。

#### Scenario: 长期约束
- **WHEN** 候选回答 Agent 必须遵守什么
- **THEN** Agent MUST 将其映射为 Rule 候选

#### Scenario: 可复用专业动作
- **WHEN** 候选回答同类任务如何执行
- **THEN** Agent MUST 将其映射为 Skill 候选

#### Scenario: 可替换能力接口
- **WHEN** 候选改变 consumer/provider 的 guarantees、effects、authorization 或 result evidence
- **THEN** Agent MUST 将其映射为 capability Contract 候选

#### Scenario: 产品能力问题
- **WHEN** 候选属于产品行为、API、数据模型或用户体验变化
- **THEN** Agent MUST 将其映射为 product follow-up
- **AND** 后续 MUST 重新使用 `task-triage` 和 OpenSpec，不得复制一套产品维护历史

#### Scenario: Command 或 Component 线索
- **WHEN** observation 涉及 Command、Component 或普通文档
- **THEN** Agent MUST NOT 将其作为直接资产审查候选
- **AND** 只有其背后的 Rule、Skill、capability Contract 或 product follow-up 语义通过门槛时才可继续

### Requirement: 写入前必须取得用户确认
Agent MUST 在当前任务结束时向用户提交审查结论，并取得 accept 或 reject；accept 只授权创建新的维护任务，不授权在原任务写入目标资产。

#### Scenario: 用户接受候选
- **WHEN** 用户明确接受一个候选
- **THEN** Agent MUST 保存 handoff 并重新进入 `task-triage`
- **AND** 原任务 MUST 保持结束

#### Scenario: 用户拒绝候选
- **WHEN** 用户拒绝候选或判断其没有价值
- **THEN** Agent MUST 删除 observation
- **AND** 未确认内容 MUST NOT 形成 Git history

### Requirement: 确认后的写回使用现有生命周期
用户接受候选后，Agent MUST 在新的 task-triage 环境中使用目标资产的维护、授权和验证流程。

#### Scenario: 新任务写入资产
- **WHEN** 新任务实际修改 Rule、Skill 或 capability Contract
- **THEN** Agent MUST 同时维护对应 tracked asset-maintenance record
- **AND** 只有集成成功后才能删除 observation

#### Scenario: 新任务未形成资产修改
- **WHEN** 新任务核验后不修改资产
- **THEN** Agent MUST 删除 observation 且不保留维护日志
