## MODIFIED Requirements

### Requirement: Task worktree 提供 change 单写入与验证证据边界
Buildr task-worktree 和 git-ops guidance MUST 在创建预计进入实现的 OpenSpec change 前完成 worktree 决策，并在采用 worktree 后保持唯一任务写入位置，将最终候选 identity 与内容变化交给独立 task-verification capability 管理验证证据。

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
- **THEN** Agent MUST 先创建或复用 task worktree 并将 change artifacts 收敛到该唯一位置
- **AND** Agent MUST 清除原工作区的重复副本并确认主工作区没有该任务的开发改动后再继续

#### Scenario: 最终候选 identity 交给验证 provider
- **WHEN** worktree 中的全部内容修改已经结束并准备验证最终候选
- **THEN** task-worktree provider MUST 提供当前 canonical checkout、repository 和可确认的 tree identity
- **AND** selected task-verification provider MUST 负责执行项目要求的 Candidate 验证并返回绑定该 identity 的 evidence

#### Scenario: 集成前候选 tree 发生变化
- **WHEN** rebase、冲突解决、后续编辑或其他操作使准备集成的 Git tree 不同于已验证 tree
- **THEN** task-worktree provider MUST 报告 `treeChanged`
- **AND** 原验证 evidence MUST 失效并由 selected task-verification provider 在集成前对新 tree 重新验证

### Requirement: Task Finish 自动编排已验证任务收尾
Buildr MUST 提供实现 `buildr.task-finish/v1` 的 `task-finish` 默认 workspace Skill，将用户当前轮次明确的“收尾”意图作为受限的一次性授权，并通过绑定的 `buildr.task-verification/v1`、`buildr.task-worktree-lifecycle/v1` 和 `buildr.git-task-integration/v1` providers 自动完成可安全确定的剩余任务动作。

#### Scenario: 收尾前置检查
- **WHEN** 用户在 canonical task worktree 中要求收尾
- **THEN** Agent MUST 解析当前 task/change、仓库边界、目标分支、远端、工作区改动、已知验证 evidence 和三个 required providers
- **AND** Agent MUST 在 Git 写操作前披露 selected provider identities、实际验证/集成/清理策略、提交范围、目标分支、远端和清理范围
- **AND** 存在无关 dirty changes、多个无法消歧的 change/目标分支、required provider readiness 为 `blocked` 或不可信验证状态时，Agent MUST 在破坏性动作前停止

#### Scenario: 收尾复用可信 Candidate evidence
- **WHEN** 当前候选已有 selected verification provider 产生或核对的成功 Candidate evidence，且候选 identity 未改变
- **THEN** Task Finish MUST 复用该 evidence
- **AND** Task Finish MUST NOT 重复运行相同 Candidate 验证
- **AND** provider evidence inspection MUST NOT 被计作 verification execution，`taskVerificationExecuteCalls` 和 `candidateExecutorCalls` MUST 均为 `0`

#### Scenario: 收尾补齐验证 evidence
- **WHEN** Candidate evidence 缺失、级别不足、不可读、不可复用或与当前候选 identity 不匹配
- **THEN** Task Finish MUST 调用 selected task-verification provider 对当前最终候选执行项目要求的验证
- **AND** 新验证失败或仍不完整时 MUST 停止 integrate、push 和 cleanup

#### Scenario: Closeout metadata 改变 delivery tree
- **WHEN** delivery tree 与 implementation Candidate identity 的差异完全来自可归因的 OpenSpec sync/archive、归档格式规范或 Project 明确定义的 closeout-only artifacts
- **THEN** Task Finish MUST 将 transition 标记为 `closeout-metadata-only`，保留原 implementation Candidate evidence，并运行 closeout workflow 已要求的 focused checks
- **AND** Task Finish MUST NOT 调用 task-verification `execute` 或 Candidate executor，两个 execute count MUST 均为 `0`
- **AND** 最终报告 MUST 分别说明 implementation Candidate evidence、delivery tree identity 和 closeout delta checks，不得声称原 Candidate 覆盖 delivery tree

#### Scenario: 实现内容改变时重新验证
- **WHEN** provider integration、冲突解决、生成资产更新或其他步骤改变 implementation content，或差异无法完全证明属于 closeout-only scope
- **THEN** Task Finish MUST 将 transition 标记为 `implementation-changed`，使原 Candidate evidence 失效，并在集成前调用 selected task-verification provider `execute` 生成新 Candidate evidence
- **AND** 新验证失败时 MUST 停止尚未执行的 integrate、push 和 cleanup
- **AND** 成功路径的 `taskVerificationExecuteCalls` 和 `candidateExecutorCalls` MUST 均为 `1`

#### Scenario: 完成 OpenSpec 归档
- **WHEN** 当前任务包含 artifacts 和 tasks 均完成的 active OpenSpec change
- **THEN** Task Finish MUST 默认同步 delta specs 并归档 change
- **AND** Task Finish MUST 通过外部可用的 OpenSpec CLI/Skills 完成该步骤，不修改外部 `openspec-*` Skill 源
- **AND** OpenSpec strict、contract guard 和 `git diff --check` MUST 作为 closeout workflow checks 记录，不得计作 Candidate executor invocation

#### Scenario: 归档后规范 EOF 空白行
- **WHEN** OpenSpec archive 或 specs sync 后 `git diff --check` 仅报告本次修改的 OpenSpec Markdown 文件存在 `new blank line at EOF`
- **THEN** Task Finish MUST 将这些文件规范为恰好一个结尾换行
- **AND** Task Finish MUST 重新运行 `git diff --check` 和 OpenSpec strict validation

#### Scenario: 归档后存在其他格式问题
- **WHEN** `git diff --check` 报告非 EOF 空白行、非 OpenSpec 文件或无法确认来源的问题
- **THEN** Task Finish MUST 停止自动修复
- **AND** Agent MUST 报告问题并等待用户决定

#### Scenario: 收尾授权覆盖 provider 声明的常规动作
- **WHEN** 前置检查、所需验证和归档相关检查通过
- **THEN** 用户的“收尾” MUST 授权提交当前任务范围、调用已绑定 task-integration provider 完成其 contract 与执行前披露中声明的常规集成动作、推送已确认目标分支，以及删除已安全合入的本地 worktree 和本地任务分支
- **AND** Task Finish MUST 遵循 provider contracts 的前置条件、授权类别、tree-change semantics、结果证据和失败行为
- **AND** Task Finish MUST NOT 复制或覆盖 verification、Git integration 或 worktree lifecycle provider 的内部 policy

#### Scenario: 默认 Git provider 保持现有集成策略
- **WHEN** `git-ops` 是已绑定的 `buildr.git-task-integration/v1` provider
- **THEN** 默认 task integration MUST 继续使用无语义冲突的必要 rebase 和 fast-forward-only 集成
- **AND** 默认 provider MUST NOT 创建 merge commit，除非用户对该具体动作另行明确授权

#### Scenario: 默认收尾授权的固定排除项
- **WHEN** 收尾需要 force push、删除远端任务分支、丢弃改动、改写共享分支历史或解决语义冲突
- **THEN** “收尾” MUST NOT 授权这些动作
- **AND** Agent MUST 停止并取得用户对具体动作的明确授权或决策
- **AND** merge commit 是否属于常规动作 MUST 由已绑定 provider contract 和执行前披露决定，不得由 Task Finish 全局固定

#### Scenario: Optional 资产审查 provider 缺失
- **WHEN** `buildr.task-asset-review/v1` optional dependency 未绑定
- **THEN** Task Finish MUST 跳过资产审查阶段并明确记录该降级
- **AND** 收尾的其他 required 阶段 MUST 继续执行

#### Scenario: 安全清理 task worktree
- **WHEN** 目标分支已包含任务提交、远端目标分支已推送且 task worktree 干净
- **THEN** Task Finish MUST 调用已绑定 worktree-lifecycle provider 确认 cleanup preconditions 和本机入口迁移要求
- **AND** Task Finish MUST 按 provider contract 从保留的 workspace 执行本地 worktree 和本地任务分支清理
- **AND** Task Finish MUST 检查清理后的 worktree 列表和仓库状态

### Requirement: Task Finish 必须报告可信的完整验证 timing 证据
Buildr `task-finish` MUST 消费 selected task-verification provider 返回的最终 Candidate evidence，并将验证状态和 timing 作为收尾 Result Evidence 的一部分。

#### Scenario: 最终 Candidate 验证成功
- **WHEN** `task-finish` 使用当前候选 identity 的成功 Candidate evidence
- **THEN** `task-finish` MUST 核对 evidence status、level、candidate identity 和 timing source
- **AND** 最终收尾报告 MUST 说明验证范围、总耗时、最慢检查、失败项、跳过项和 evidence reference

#### Scenario: Buildr Product 提供 verifier summary
- **WHEN** 当前 Project 是 Buildr Product 且 Candidate 输出 `buildr.verification-timing/v1` summary
- **THEN** `task-finish` MUST 使用产品专项 verifier 核对 summary status、run kind、source identity 和 candidate fingerprint
- **AND** 核对通过后 MUST 将 timing source 记录为 `verifier-reported`

#### Scenario: timing evidence 不可信
- **WHEN** evidence 缺失、不可读、已被其他 run 覆盖或 candidate identity 无法匹配当前候选
- **THEN** `task-finish` MUST NOT 引用其他 run 的耗时或根据并行检查耗时推算整体 wall-clock
- **AND** 在仍可安全重跑时 MUST 调用 selected task-verification provider 重新生成可信 Candidate evidence
- **AND** 无法重跑时 MUST 将验证缺口作为剩余风险如实报告并停止把任务描述为完整收尾

#### Scenario: 收尾消费后清理 transient evidence
- **WHEN** 最终 Candidate evidence 标记为 transient，验证摘要已捕获、集成与推送完成且没有后续 consumer
- **THEN** Task Finish MUST 请求 selected task-verification provider 清理该 evidence
- **AND** 最终报告 MUST 说明 cleanup status；清理失败时报告保留路径与原因，不回滚已完成交付

#### Scenario: 只有较低级别 timing
- **WHEN** 当前任务只有 `minimal` 或 `affected` timing 而没有可信 Candidate evidence
- **THEN** `task-finish` MUST NOT 将其表述为完整 Candidate 验证耗时

### Requirement: 实现任务采用分层验证门禁
Buildr 任务流程 MUST 由 selected task-verification provider 将实现期间的验证分为单任务最小反馈、任务组受影响范围验证和最终候选完整验证，并 MUST 防止同一候选状态重复执行已被上层入口覆盖的检查。

#### Scenario: 单任务只做最小反馈检查
- **WHEN** Agent 完成任务组内的一个实现任务且没有跨越高风险边界
- **THEN** selected provider MUST 只运行语法、类型或与该任务直接相关的小范围检查
- **AND** provider MUST NOT 默认运行当前 workspace 或 Project 定义的完整验证入口

#### Scenario: 任务组集中运行受影响验证
- **WHEN** 共享实现区域、验证入口或失败影响面的任务组全部完成
- **THEN** selected provider MUST 集中运行一次受影响范围验证
- **AND** provider MUST NOT 为组内每项任务机械重复同一专项检查

#### Scenario: Workspace 定义具体验证入口
- **WHEN** Buildr 将任务流程 Skills 交付到用户 workspace
- **THEN** task-verification Skill MUST 使用通用的最小反馈、受影响范围和完整验证语义
- **AND** 具体检查命令 MUST 由当前 workspace 或 Project 的规则、OpenSpec 或开发文档定义
- **AND** Skill MUST NOT 将 Buildr 产品仓的 package check、临时 workspace E2E 或产品总验证命令规定为所有项目的固定入口

#### Scenario: 最终候选完成全部修订
- **WHEN** 全部实现、自然语言资产、生成资产同步和 review 修订已经完成
- **THEN** selected provider MUST 冻结候选并运行一次项目要求的完整验证
- **AND** Agent MUST NOT 使用较早候选的验证结果声称当前实现完成

### Requirement: 内置任务 Skills 按 capability contract 协作
Buildr 内置任务 Skills MUST 依赖 capability contracts 而不是硬编码其他 optional Skill identity，并 MUST 将验证、Git integration 和 worktree lifecycle provider policy 分别保留在对应 provider 中。

#### Scenario: Task Finish 依赖三项 required 能力
- **WHEN** Buildr 声明 `task-finish` builtin
- **THEN** its manifest entry MUST require `buildr.task-verification/v1`、`buildr.git-task-integration/v1` 和 `buildr.task-worktree-lifecycle/v1` with `mode: required`
- **AND** `task-finish` source MUST NOT 复制 selected providers 的验证命令选择、Git integration 或 worktree placement/cleanup policy

#### Scenario: Task Worktree 只拥有生命周期能力
- **WHEN** `task-worktree` 创建、检查或清理 Git worktree
- **THEN** it MUST own worktree placement、retention 和 cleanup through `buildr.task-worktree-lifecycle/v1`
- **AND** it MUST direct Candidate verification to `buildr.task-verification/v1` without providing that capability
- **AND** it MUST remain independent of `git-ops` and the selected task-verification provider identity

#### Scenario: 替换默认 Verification provider
- **WHEN** workspace or Project binds an internal provider for `buildr.task-verification/v1`
- **THEN** product routing and `task-finish` MUST use that provider without requiring the `task-verification` Skill id
- **AND** uninstalling `task-verification` MUST NOT break Task Finish while the replacement binding remains ready

#### Scenario: 替换默认 Git provider
- **WHEN** workspace binds compatible internal providers for the Git capabilities consumed by task workflows
- **THEN** `task-finish` MUST cooperate with the task-integration provider without requiring the `git-ops` Skill id
- **AND** `task-worktree` MUST remain independent of `git-ops`
- **AND** uninstalling `git-ops` MUST NOT break those consumers while Task Finish 的 required bindings remain compatible and ready

#### Scenario: 替换默认 Worktree provider
- **WHEN** workspace or Project binds an internal provider for `buildr.task-worktree-lifecycle/v1`
- **THEN** product routing and `task-finish` MUST use that provider without requiring the `task-worktree` Skill id
- **AND** uninstalling `task-worktree` MUST NOT break Task Finish while the replacement binding remains ready
