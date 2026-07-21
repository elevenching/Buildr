## ADDED Requirements

### Requirement: Buildr Skill 必须引导 Agent 使用 Project Domain
Buildr Product Skill MUST explain the canonical Project fields, source boundary, migration path and declared/observed Git distinction when Project intent is in scope.

#### Scenario: Agent 创建 Project
- **WHEN** 用户要求创建 workspace or Git Project
- **THEN** Skill MUST guide Agent to collect code, name, description and source declarations required by that source type
- **AND** Agent MUST validate target Workspace, materialized path and Git identity before invoking canonical CLI

#### Scenario: Agent 处理 Project migration
- **WHEN** doctor or app reports v1 Project registry migration required
- **THEN** Skill MUST direct Agent to inspect the plan and use canonical update or sync
- **AND** MUST NOT recommend hand-editing generated UUIDs or silently rewriting from the UI

#### Scenario: Agent 处理分支漂移
- **WHEN** observed current branch differs from declared integration branch
- **THEN** Skill MUST treat it as task context to investigate rather than proof of corruption
- **AND** MUST require clean/ownership/task checks before any switch and MUST NOT blindly checkout or stash
