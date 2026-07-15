## ADDED Requirements

### Requirement: 发布 worktree 在远端候选确认后默认清理
Buildr task-worktree guidance MUST 将发布 worktree 与需要持续联调的普通开发 worktree 区分，并在发布目标完成后默认清理不再需要的本地发布环境。

#### Scenario: 推送并确认发布分支后清理本地发布环境
- **WHEN** Agent 使用临时 worktree 制作发布分支
- **AND** 远端发布分支已推送且远端 ref 与候选提交一致
- **AND** worktree 干净且没有明确的后续本地构建、部署、修复或验证动作
- **THEN** Agent MUST 删除本地发布 worktree 和已由远端安全承载的本地发布分支
- **AND** Agent MUST NOT 因普通开发任务的保守保留策略继续保留该发布 worktree
- **AND** Agent MUST NOT 自动删除远端发布分支

#### Scenario: 存在后续本地发布动作时保留
- **WHEN** 发布分支推送后仍有明确的本地构建、部署、修复或验证动作
- **THEN** Agent MUST 保留发布 worktree
- **AND** Agent MUST 向用户说明保留原因和下一项本地动作
