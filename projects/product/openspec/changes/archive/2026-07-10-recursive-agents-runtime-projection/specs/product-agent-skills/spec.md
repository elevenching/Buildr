## MODIFIED Requirements

### Requirement: Rule 与 Skill 语义边界
Buildr Skill MUST 按 asset semantics 定义 Rules 与 Skills，而不是按它们是否总会被加载定义，并且 MUST 说明 Rule manifest state 如何控制 Agent consumption。

#### Scenario: 解释 Rule 与 Skill
- **WHEN** 用户询问 Rules 与 Skills 的区别
- **THEN** Buildr Skill MUST explain that Rules control Agent values, boundaries, and constraints
- **AND** Buildr Skill MUST explain that Skills encapsulate reusable professional actions and procedures
- **AND** Buildr Skill MUST NOT define the primary distinction as whether the artifact is required or lazily loaded

#### Scenario: Agent 判断相关 Rules
- **WHEN** Agent works on a task that may touch user-managed Rules
- **THEN** Buildr Skill MUST require Agent to use Rule descriptions, user goals, files being changed, code semantics, and workspace context to judge relevant Rules
- **AND** Buildr Skill MUST NOT require users to preconfigure roles, paths, service names, or other routing tables for Rules relevance

#### Scenario: 解释 Rule manifest 状态
- **WHEN** 用户或 Agent 询问 enabled、required or state 如何影响 Rule 加载
- **THEN** Buildr Skill MUST explain that enabled、required and installed Rules are always read
- **AND** Buildr Skill MUST explain that enabled、non-required and installed Rules are semantically evaluated from description and read when relevant
- **AND** Buildr Skill MUST explain that disabled or uninstalled Rules do not participate in the current task
- **AND** Buildr Skill MUST distinguish runtime source discovery from Agent semantic relevance judgment

#### Scenario: Git 提交规则与技能边界
- **WHEN** Buildr Skill explains where Git commit guidance belongs
- **THEN** reusable Conventional Commits format、type selection and message generation procedure MUST belong to the Git operations Skill
- **AND** organization-specific commit language or acceptance constraints MUST belong to a user-managed Rule
- **AND** Buildr product defaults MUST NOT hardcode a Chinese commit-message Rule for every workspace

## ADDED Requirements

### Requirement: 任务工作流必须显式可见
Buildr task 和 OpenSpec Skills MUST 在改变 task state 前明确 workflow selection 与 task location。

#### Scenario: 使用 OpenSpec 前说明 change
- **WHEN** Agent decides to create、explore、apply、sync or archive an OpenSpec change
- **THEN** Agent MUST state that OpenSpec is being used before performing the action
- **AND** Agent MUST identify the change id、resolved change path and intended action as soon as they are known

#### Scenario: 创建或复用 task worktree 前说明位置
- **WHEN** Agent decides to create or reuse a task worktree
- **THEN** Agent MUST state whether it is creating or reusing the worktree before task edits
- **AND** Agent MUST identify the current Buildr workspace root、task id、worktree path and task branch

#### Scenario: Task worktree canonical location
- **WHEN** Agent creates a task worktree in a Buildr workspace
- **THEN** its canonical path MUST be `<workspace-root>/.worktrees/<task-id>`
- **AND** Agent MUST NOT silently fall back to `/tmp` or another arbitrary location
- **AND** the same task MUST reuse its existing worktree
- **AND** a multi-repository task MUST use repo-qualified task ids to avoid path collisions

#### Scenario: Task worktree lifecycle remains a Skill concern
- **WHEN** Buildr packages task worktree guidance
- **THEN** placement、disclosure、reuse、retention and cleanup procedures MUST remain in task Skills
- **AND** required Core Rule MUST NOT copy the worktree operation manual
