## MODIFIED Requirements

### Requirement: Task worktree 提供 change 单写入与验证证据边界
Buildr task triage 和 OpenSpec propose guidance MUST 在首次写入预计进入实现的 OpenSpec change artifacts 前完成执行位置判断，并在需要隔离开发时先创建或复用 canonical task worktree；采用 worktree 后必须保持唯一任务写入位置。worktree lifecycle 与 Git integration providers MUST 只返回各自动作产生的 candidate identity 和 transition evidence，由独立 task-verification capability 管理验证政策与 Candidate evidence。

#### Scenario: Task triage 独立判断执行形态和任务位置
- **WHEN** Agent 使用 task triage 判断修改、修复、实现或文档任务
- **THEN** task triage MUST 在语义路径之外独立判断执行形态为 implementation、metadata-only 或待确认
- **AND** it MUST 输出 worktree 创建、复用、不需要或待确认的任务位置结论及依据

#### Scenario: 实现型 change 在 propose 前创建 worktree
- **WHEN** task triage 选择 change-flow，且任务预计包含代码修改、构建、测试或长期实现上下文
- **THEN** Agent MUST 在创建 OpenSpec change artifacts 前创建或复用 canonical task worktree
- **AND** proposal、design、specs、tasks、实现和候选验证 MUST 只写入该 worktree

#### Scenario: 直接 propose 仍执行 worktree 门禁
- **WHEN** 用户意图直接命中 installed OpenSpec propose Skill
- **THEN** Buildr OpenSpec contribution MUST 在 `openspec new change` 或其他 artifact 写入前判断任务是否预计进入代码修改、构建、测试或长期开发上下文
- **AND** 需要隔离开发时 MUST 先创建或复用 canonical task worktree 并在该 checkout 中继续 propose
- **AND** 无法判断执行形态时 MUST 先澄清而不是提前创建 artifacts

#### Scenario: 纯元内容任务不创建 worktree
- **WHEN** 任务明确只维护 OpenSpec artifacts、规则、Skills、文档或模板，且不进入代码实现、构建或测试
- **THEN** Agent MAY 在当前 workspace 直接维护这些元内容
- **AND** Agent MUST 在任务升级为实现前重新执行 worktree 决策

#### Scenario: code-only 实现仍使用 worktree
- **WHEN** task triage 选择 code-only 且任务预计进入代码修改、构建、测试或长期开发上下文
- **THEN** Agent MUST 创建或复用 canonical task worktree
- **AND** Agent MUST NOT 因为不创建 OpenSpec change 而跳过任务隔离判断

#### Scenario: artifacts 任务升级为实现
- **WHEN** 未使用 worktree 的 OpenSpec 任务后来需要代码实现、构建或测试
- **THEN** Agent MUST 先创建或复用 task worktree并将 change artifacts收敛到该唯一位置
- **AND** Agent MUST 清除原工作区的重复副本并确认主工作区没有该任务的开发改动后再继续

#### Scenario: 最终候选 identity 交给验证 provider
- **WHEN** worktree 中的全部内容修改已经结束并准备验证最终候选
- **THEN** task-worktree provider MUST 提供当前 canonical checkout、repository、clean/dirty 状态和可确认的 tree identity输入
- **AND** selected task-verification provider MUST 负责建立最终 candidate identity、执行项目要求的 Candidate验证并返回绑定该 identity 的 evidence

#### Scenario: Git 集成改变候选内容
- **WHEN** rebase、冲突解决、merge、reset 或其他 Git integration操作使集成后的内容 identity 不同于输入 candidate
- **THEN** selected Git provider MUST 返回操作前后 identity和 `treeChanged` evidence
- **AND** selected Git provider MUST NOT 执行 Candidate验证或决定既有 evidence是否可复用
- **AND** selected task-verification provider or its consumer MUST 根据当前 candidate identity决定 evidence失效与重新验证

#### Scenario: Worktree provider 只报告 lifecycle transition
- **WHEN** task-worktree provider 创建、复用、切换、保留或清理 canonical checkout
- **THEN** it MUST 返回 lifecycle状态、canonical path、任务分支和由本次 checkout操作产生的 transition evidence
- **AND** it MUST NOT 监控普通编辑、判断 Git integration内容等价性或决定验证复用与重跑

#### Scenario: 上游 OpenSpec Skill 保持原文
- **WHEN** Buildr 为 OpenSpec propose 增加执行位置门禁
- **THEN** Buildr MUST 通过 Component-owned Skill contribution 组合该 guidance
- **AND** Buildr MUST NOT 修改外部 `openspec-propose` Skill 的上游正文
