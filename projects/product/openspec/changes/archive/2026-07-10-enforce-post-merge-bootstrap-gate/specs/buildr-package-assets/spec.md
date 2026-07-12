## ADDED Requirements

### Requirement: 产品验证覆盖 task worktree 隔离与证据复用
Buildr package verification MUST 防止 task-worktree guidance 回退为 change artifacts 双写、合并前污染主自举 workspace 或相同 tree 集成后重复产品 E2E。

#### Scenario: 校验 change 创建时机
- **WHEN** Buildr 验证随包 task-worktree Skill
- **THEN** 验证 MUST 确认实现型 OpenSpec change 在 propose 前创建或复用 task worktree
- **AND** 验证 MUST 确认采用 worktree 后 artifacts、实现和候选验证只有一个写入位置

#### Scenario: 校验最终候选 tree 验证契约
- **WHEN** Buildr 验证 Product Project 开发规则、task-worktree Skill 和 git-ops Skill
- **THEN** 验证 MUST 确认完整验证绑定准备集成的最终候选 Git tree
- **AND** 验证 MUST 确认相同 tree 的 commit、集成、push 和 worktree 清理复用已有验证结果
- **AND** 验证 MUST 确认 tree 改变后在集成前重新运行受影响的验证

#### Scenario: 候选验证保持主工作区干净
- **WHEN** 产品 E2E 从 task worktree checkout 验证未合并候选版本
- **THEN** 验证 MUST 使用临时 workspace 或 task worktree 目标
- **AND** 验证前后的主开发工作区 status MUST 保持不变

#### Scenario: 不要求 post-merge 重复 E2E
- **WHEN** Buildr 验证产品开发流程文本
- **THEN** 验证 MUST 确认相同候选 tree 集成后不要求在主开发分支重复产品 E2E
- **AND** 验证 MUST 区分实际 workspace update/sync 后的 doctor 与产品 E2E
