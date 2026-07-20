## MODIFIED Requirements

### Requirement: Task worktree 提供 change 单写入与验证证据边界
Buildr task-worktree 和 git-ops guidance MUST 在创建预计进入实现的 OpenSpec change 前完成 worktree 决策，并在采用 worktree 后保持唯一任务写入位置；worktree lifecycle 与 Git integration providers MUST 只返回各自动作产生的 candidate identity 和 transition evidence，由独立 task-verification capability 管理验证政策与 Candidate evidence。

#### Scenario: 实现型 change 在 propose 前创建 worktree
- **WHEN** task triage 选择 change-flow，且任务预计包含代码修改、构建、测试或长期实现上下文
- **THEN** Agent MUST 在创建 OpenSpec change artifacts 前创建或复用 canonical task worktree
- **AND** proposal、design、specs、tasks、实现和候选验证 MUST 只写入该 worktree

#### Scenario: 纯元内容任务不创建 worktree
- **WHEN** 任务明确只维护 OpenSpec artifacts、规则、Skills、文档或模板，且不进入代码实现、构建或测试
- **THEN** Agent MAY 在当前 workspace 直接维护这些元内容
- **AND** Agent MUST 在任务升级为实现前重新执行 worktree 决策

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

### Requirement: 内置任务 Skills 按 capability contract 协作
Buildr 内置任务 Skills MUST 依赖 capability contracts而不是硬编码其他 optional Skill identity，并 MUST 将验证、Git integration和worktree lifecycle provider policy分别保留在对应provider中；跨 provider协作只传递consumer安全继续所需的最小candidate identity、transition和result evidence。

#### Scenario: Task Finish 依赖三项 required 能力
- **WHEN** Buildr声明 `task-finish` builtin
- **THEN** its manifest entry MUST require `buildr.task-verification/v1`、`buildr.git-task-integration/v1` 和 `buildr.task-worktree-lifecycle/v1` with `mode: required`
- **AND** `task-finish` source MUST NOT复制selected providers的验证命令选择、Git integration或worktree placement/cleanup policy

#### Scenario: Task Worktree 只拥有生命周期能力
- **WHEN** `task-worktree`创建、检查或清理Git worktree
- **THEN** it MUST own worktree placement、retention和cleanup through `buildr.task-worktree-lifecycle/v1`
- **AND** it MUST只提供checkout边界与lifecycle transition evidence，不提供或复制 `buildr.task-verification/v1` 的验证、复用和重跑policy
- **AND** it MUST remain independent of `git-ops` and the selected task-verification provider identity

#### Scenario: Git provider 只拥有集成效果
- **WHEN** selected `buildr.git-task-integration/v1` provider提交、rebase、merge、fast-forward或push任务候选
- **THEN** it MUST own Git授权、安全策略、refs影响和操作前后content identity evidence
- **AND** it MUST NOT执行项目Candidate验证或把tree等价性信号表述为最终evidence有效性决策

#### Scenario: 替换默认 Verification provider
- **WHEN** workspace或Project binds an internal provider for `buildr.task-verification/v1`
- **THEN** product routing和 `task-finish` MUST使用该provider without requiring the `task-verification` Skill id
- **AND** uninstalling `task-verification` MUST NOT break Task Finish while the replacement binding remains ready

#### Scenario: 替换默认 Git provider
- **WHEN** workspace binds compatible internal providers for the Git capabilities consumed by task workflows
- **THEN** `task-finish` MUST cooperate with the task-integration provider without requiring the `git-ops` Skill id
- **AND** `task-worktree` MUST remain independent of `git-ops`
- **AND** uninstalling `git-ops` MUST NOT break those consumers while Task Finish 的 required bindings remain compatible and ready

#### Scenario: 替换默认 Worktree provider
- **WHEN** workspace或Project binds an internal provider for `buildr.task-worktree-lifecycle/v1`
- **THEN** product routing和 `task-finish` MUST使用该provider without requiring the `task-worktree` Skill id
- **AND** uninstalling `task-worktree` MUST NOT break Task Finish while the replacement binding remains ready
