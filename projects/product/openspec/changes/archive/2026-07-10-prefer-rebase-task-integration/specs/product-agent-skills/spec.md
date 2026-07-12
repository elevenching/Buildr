## ADDED Requirements

### Requirement: Git Ops 默认保持线性任务历史
Buildr Git Ops Skill MUST 对任务分支采用 rebase-first、fast-forward-only 的默认集成策略，并保留 Git 写操作授权边界。

#### Scenario: 本地未推送任务分支发生分叉
- **WHEN** 任务分支包含本地未推送提交且目标分支出现新提交
- **THEN** Agent MUST 先 fetch 最新目标分支
- **AND** Agent MUST 默认将任务分支 rebase 到最新目标分支
- **AND** Agent MUST 在 rebase 后重新运行相关验证

#### Scenario: 集成任务分支到目标分支
- **WHEN** Agent 已获当前轮次的合并授权并准备把任务分支集成到目标分支
- **THEN** Agent MUST 默认使用 fast-forward-only 集成
- **AND** Agent MUST NOT 自动创建 merge commit

#### Scenario: 用户明确要求 merge commit
- **WHEN** 用户当前轮次明确要求 merge commit，或项目规则明确要求 non-fast-forward merge
- **THEN** Agent MAY 使用 merge commit
- **AND** Agent MUST 在执行前报告目标分支和集成方式

#### Scenario: 已推送或共享任务分支
- **WHEN** 任务分支提交已经推送或被多人共享
- **THEN** Agent MUST NOT 自动 rebase 或 force push
- **AND** Agent MUST 等待用户明确授权历史改写或选择其他集成方式

#### Scenario: Rebase 冲突需要语义决策
- **WHEN** rebase 冲突无法通过保持双方既有语义机械解决
- **THEN** Agent MUST 停止并报告冲突
- **AND** Agent MUST 等待用户确认后继续
