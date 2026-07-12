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
- **AND** Buildr default commit language MUST belong to required Core so it remains independent of the Git operations Skill lifecycle
- **AND** more specific Project、Service or repository rules MUST be allowed to override the Core language default

## ADDED Requirements

### Requirement: Git Ops 生成精简提交信息
Buildr Git Ops Skill MUST 提供精简的 Conventional Commits 提交信息生成规则，并遵循 Core 和更具体的提交语言约定。

#### Scenario: 生成提交主题
- **WHEN** Agent 为已确认提交范围生成 commit message
- **THEN** subject MUST 使用 `<type>(<scope>): <subject>` 格式，其中 scope 可选
- **AND** type MUST 从 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert` 中选择
- **AND** Agent MUST 基于实际提交内容选择 type 和 scope，不得猜测不明确的 scope

#### Scenario: 补充正文或破坏性变更
- **WHEN** 变更动机、行为差异或破坏性影响需要补充说明
- **THEN** Agent MUST 使用可选正文说明动机和行为差异
- **AND** 破坏性变更 MUST 使用 `BREAKING CHANGE:` 说明
- **AND** 不需要补充信息时 MUST 保持仅一行 subject

#### Scenario: 应用提交语言约定
- **WHEN** Agent 使用 Git Ops 生成 commit message
- **THEN** Git Ops MUST 遵循 Core 的默认提交语言和当前 scope 的更具体约定
- **AND** Git Ops MUST NOT 在 Skill 正文中复制 Core 的语言约束

#### Scenario: 仓库已有明确格式
- **WHEN** 项目或仓库规则定义了比 Git Ops 默认格式更具体的提交约定
- **THEN** Agent MUST 遵循更具体的项目或仓库约定
