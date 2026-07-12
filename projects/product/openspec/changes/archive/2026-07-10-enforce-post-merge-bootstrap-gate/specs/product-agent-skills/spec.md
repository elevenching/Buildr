## ADDED Requirements

### Requirement: Task worktree 提供 change 单写入与验证证据边界
Buildr task-worktree 和 git-ops guidance MUST 在创建预计进入实现的 OpenSpec change 前完成 worktree 决策，并在采用 worktree 后保持唯一任务写入位置与可复用的最终候选 tree 验证证据。

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

#### Scenario: 最终候选 tree 已完成验证
- **WHEN** worktree 中准备集成的最终候选 Git tree 已完成项目要求的完整验证
- **THEN** 后续 commit、保持相同 tree 的集成、push 和 worktree 清理 MUST 复用该验证证据
- **AND** Agent MUST NOT 仅因 checkout 切换到主开发分支而重复运行相同产品 E2E

#### Scenario: 集成前候选 tree 发生变化
- **WHEN** rebase、冲突解决、后续编辑或其他操作使准备集成的 Git tree 不同于已验证 tree
- **THEN** 原验证证据 MUST 失效
- **AND** Agent MUST 在集成前对新 tree 重新运行受影响的验证
