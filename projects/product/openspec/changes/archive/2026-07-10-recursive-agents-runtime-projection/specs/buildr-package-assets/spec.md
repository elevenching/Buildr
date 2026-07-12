## ADDED Requirements

### Requirement: 产品验证覆盖递归 AGENTS runtime 投射
Buildr package check 和 product MVP verification MUST 覆盖 recursive `AGENTS.md` discovery、canonical scope resolution、adapter projection 与 safe reconciliation boundaries。

#### Scenario: Root Project Service 深层规则链
- **WHEN** Buildr runs product verification in a temporary workspace
- **THEN** verification MUST create `AGENTS.md` at Root、Project、Service and a deeper Service module
- **AND** verification MUST confirm the discovery order is broader-to-more-specific
- **AND** verification MUST confirm a Service scope excludes sibling Service subtree rules

#### Scenario: Claude Code recursive bridges
- **WHEN** product verification renders Claude Code rules for Project、Service and root scopes
- **THEN** verification MUST confirm every discovered source has a same-directory managed `CLAUDE.md` bridge
- **AND** verification MUST confirm root sync reconciles all managed workspace rule sources

#### Scenario: Codex native recursive rules
- **WHEN** product verification renders or checks Codex for the same scopes
- **THEN** verification MUST confirm every discovered `AGENTS.md` is reported as native
- **AND** verification MUST confirm Rules projection writes no Codex bridge files

#### Scenario: Canonical and legacy scope behavior
- **WHEN** product verification exercises canonical and legacy Service scope inputs
- **THEN** verification MUST confirm canonical paths resolve to their literal workspace directories
- **AND** verification MUST confirm an unambiguous legacy Service shorthand resolves with a migration warning
- **AND** verification MUST confirm ambiguous or escaping scopes fail without runtime writes

#### Scenario: Recursive reconcile safety
- **WHEN** product verification encounters excluded directories、unregistered nested Git repos、directory symlinks、orphan managed bridges or non-Buildr-managed target conflicts
- **THEN** verification MUST confirm excluded and opaque boundaries are not traversed
- **AND** verification MUST confirm orphan managed bridges are removed
- **AND** verification MUST confirm a conflict prevents all planned Rules writes and preserves user content

#### Scenario: Task worktree container boundary
- **WHEN** Buildr initializes or validates a workspace package baseline
- **THEN** root `.gitignore` MUST ignore `/.worktrees/`
- **AND** recursive Rules discovery MUST treat `.worktrees/` as an excluded directory
- **AND** package verification MUST confirm `AGENTS.md` inside `.worktrees/` is not discovered or projected

#### Scenario: Task workflow Skill contract
- **WHEN** Buildr validates packaged task and OpenSpec Skills
- **THEN** task-worktree guidance MUST require `<workspace-root>/.worktrees/<task-id>` and pre-action path/branch disclosure
- **AND** OpenSpec workflow guidance MUST require pre-action change disclosure

#### Scenario: Runtime capability metadata
- **WHEN** product verification runs `buildr runtime list --json`
- **THEN** verification MUST confirm each supported adapter reports canonical scope syntax、recursive Rules discovery、ancestor inclusion、projection mode and writes-files behavior
- **AND** rendered adapters MUST report their target pattern

### Requirement: Required Core 暴露 Rule 消费协议
Buildr package assets MUST 将 Rule manifest consumption protocol 保留在 required Buildr Core 中，同时将 task-triggered procedures 保留在 Skills 中。

#### Scenario: Package Core 声明 Rule 状态语义
- **WHEN** Buildr packages or validates `rules/buildr/core.md`
- **THEN** required Core MUST state that enabled、required and installed Rules are always read
- **AND** required Core MUST state that enabled optional installed Rules are selected semantically from description and task context
- **AND** required Core MUST state that disabled or uninstalled Rules do not participate in the task

#### Scenario: Package Core 不承载操作手册
- **WHEN** Buildr packages Rule consumption guidance
- **THEN** required Core MUST NOT copy task-specific Git、OpenSpec、worktree or other operational procedures
- **AND** reusable task procedures MUST remain available through the corresponding Skills

#### Scenario: Package 默认不硬编码组织提交语言
- **WHEN** Buildr packages the default Git operations capability
- **THEN** Conventional Commits generation guidance MAY be provided by the Git operations Skill
- **AND** the default package MUST NOT install an organization-specific Chinese commit-message Rule
