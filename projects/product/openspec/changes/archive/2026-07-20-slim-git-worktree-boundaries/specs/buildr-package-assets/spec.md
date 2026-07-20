## MODIFIED Requirements

### Requirement: 产品验证覆盖 task worktree 隔离与证据复用
Buildr package verification MUST 防止 task-worktree guidance回退为change artifacts双写、合并前污染主自举workspace，或让Git/worktree providers重新拥有Candidate验证政策与evidence复用决策。

#### Scenario: 校验 change 创建时机
- **WHEN** Buildr验证随包task-worktree Skill
- **THEN** 验证 MUST确认实现型OpenSpec change在propose前创建或复用task worktree
- **AND** 验证 MUST确认采用worktree后artifacts、实现和候选验证只有一个写入位置

#### Scenario: 校验 provider 只交接候选事实
- **WHEN** Buildr验证Product Project开发规则、task-worktree Skill和git-ops Skill
- **THEN** 验证 MUST确认task-worktree只提供canonical checkout、clean/dirty状态和lifecycle transition evidence
- **AND** 验证 MUST确认git-ops只提供Git策略、refs影响、操作前后content identity和tree等价性信号
- **AND** 验证 MUST确认Candidate验证执行、evidence有效性、复用和重跑决策只由selected task-verification provider或其consumer负责

#### Scenario: 校验 Skill 文本没有重复职责
- **WHEN** Buildr执行package静态验证和任务能力专项测试
- **THEN** verifier MUST拒绝task-worktree中的重复自举sync/CLI入口段落
- **AND** verifier MUST拒绝git-ops或task-worktree重新声明Candidate验证命令、验证级别或最终evidence复用决策
- **AND** verifier MUST确认现有capability identity、version、provider和binding拓扑保持不变

#### Scenario: 候选验证保持主工作区干净
- **WHEN** 产品E2E从task worktree checkout验证未合并候选版本
- **THEN** 验证 MUST使用临时workspace或task worktree目标
- **AND** 验证前后的主开发工作区status MUST保持不变

#### Scenario: 不要求 post-merge 重复 E2E
- **WHEN** Buildr验证产品开发流程文本
- **THEN** 验证 MUST确认相同candidate identity集成后不要求在主开发分支重复产品E2E
- **AND** 验证 MUST区分实际workspace update/sync后的doctor与产品E2E
