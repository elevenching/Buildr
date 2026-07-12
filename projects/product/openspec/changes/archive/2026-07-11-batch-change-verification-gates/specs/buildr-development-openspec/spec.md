## ADDED Requirements

### Requirement: OpenSpec apply 阶段批量安排验证
Buildr 产品 OpenSpec change 的 apply 阶段 MUST 以任务组为单位安排受影响范围验证，并 MUST 仅在候选冻结后执行产品级完整验证。

#### Scenario: Apply 期间完成普通实现任务
- **WHEN** Agent 在 task worktree 中完成任务组内的普通实现任务
- **THEN** Agent MUST 更新任务进度并执行必要的最小反馈检查
- **AND** Agent MUST NOT 因单个任务完成而默认执行产品级总验证或临时 workspace E2E

#### Scenario: Apply 到达任务组边界
- **WHEN** 相互关联的实现与对应测试或断言已经完成
- **THEN** Agent MUST 对该组运行一次能够覆盖受影响面的专项验证
- **AND** 验证结果 MUST 作为继续后续任务或进入候选冻结的依据

#### Scenario: 候选冻结门禁
- **WHEN** change 的实现、文档、自然语言代码、所需 runtime 同步和 review 修订全部完成
- **THEN** Agent MUST 在最终候选 tree 上运行产品要求的完整验证入口
- **AND** Agent MUST NOT 在候选仍预期发生内容修改时提前反复运行完整验证

#### Scenario: 验证失败后恢复 Apply
- **WHEN** 完整验证发现失败并导致候选内容需要修改
- **THEN** Agent MUST 退出候选冻结状态并恢复受影响范围的实现与专项验证
- **AND** 所有修复稳定后 MUST 对新的最终候选重新运行一次完整验证

#### Scenario: 外部 OpenSpec workflow 保持上游所有权
- **WHEN** Buildr 为 apply 阶段增加分层验证编排
- **THEN** 该编排 MUST 由 Buildr-owned 项目契约或任务 Skills 承载
- **AND** Buildr MUST NOT 为此直接修改 Component 管理的外部 `openspec-apply-change` Skill
