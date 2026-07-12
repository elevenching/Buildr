## ADDED Requirements

### Requirement: Buildr 产品候选版本必须完成隔离验证
Buildr 产品开发 MUST 区分 Product Project、用户交付资产源、task worktree 和主自举 workspace，并在最终候选 Git tree 上完成隔离验证。

#### Scenario: 产品开发限制在 task worktree 的 Product Project
- **WHEN** 维护者在 task worktree 中实现 Buildr 产品能力或修改用户交付资产源
- **THEN** 正式产品源变更和 OpenSpec change artifacts MUST 只发生在该 task worktree 的 `projects/product/`
- **AND** 维护者 MUST NOT 通过同步或手工编辑主 workspace 根中的产品安装结果来代替修改 Product Project

#### Scenario: 从用户视角验证交付资产
- **WHEN** 变更影响 `package/targets/`、bootstrap、CLI 或 runtime adapter
- **THEN** 产品验证 MUST 覆盖新用户初始化、已有 workspace 更新和日常 Agent 使用路径中的相关部分
- **AND** 产品验证 MUST 使用临时用户 workspace 或 task worktree 自身，避免修改主自举 workspace

#### Scenario: 最终候选 tree 完成产品验证
- **WHEN** 维护者已经完成 rebase、冲突解决和本次任务的内容修改
- **THEN** 维护者 MUST 对准备集成的最终候选 Git tree 运行项目要求的完整验证
- **AND** 验证通过前 MUST NOT 将该 tree 作为已验证候选集成

#### Scenario: 相同 tree 完成后续 Git 动作
- **WHEN** commit、集成、push 或 worktree 清理没有改变已验证候选的 Git tree
- **THEN** 维护者 MUST 复用 worktree 中的验证结果
- **AND** 维护者 MUST NOT 在主开发分支重复运行相同产品 E2E

#### Scenario: 验证后的候选 tree 改变
- **WHEN** rebase、冲突解决、后续编辑或集成过程改变已验证候选的 Git tree
- **THEN** 维护者 MUST 将原验证结果视为失效
- **AND** 维护者 MUST 在集成前对新 tree 重新运行受影响的验证

#### Scenario: 实际自举 workspace 更新
- **WHEN** 维护者在集成后选择使用当前产品 checkout 更新实际自举 workspace
- **THEN** update/sync MUST 被视为独立的 workspace 状态变更，而不是第二轮产品 E2E
- **AND** 状态变更后 MUST 按 Buildr Core 运行当前 Agent doctor

## REMOVED Requirements

### Requirement: Buildr 产品候选版本必须完成自举验收
