## ADDED Requirements

### Requirement: onboarding supports Project registry and Project asset repos
Buildr onboarding MUST 引导 Agent 和用户完成 Project registry 维护及独立 Project asset repo 创建。

#### Scenario: Agent creates a Project
- **WHEN** user asks Agent to create a Project in a Buildr workspace
- **THEN** Agent MUST use `buildr project create <project>`
- **AND** Agent MUST expect the command to maintain both `projects/<project>/` and `projects.yml`

#### Scenario: Agent records concise Project identity
- **WHEN** Agent creates a Project and the user provides a human-readable title or short description
- **THEN** Agent MUST pass that information through Project creation or registry repair
- **AND** Agent MUST NOT treat the registry description as a replacement for Project OpenSpec knowledge or specs

#### Scenario: 用户提供 Project 资产 Git repo
- **WHEN** user provides a Git repo intended to store Project memory, rules, OpenSpec, practices or Skills
- **THEN** Agent MUST treat it as a Project asset repo rather than a service repo
- **AND** Agent MUST use `buildr project create <project> --repo <git-url>`

#### Scenario: 用户提供本地 Project 资产目录
- **WHEN** user provides a local directory intended to become a Project asset repo
- **THEN** Agent MUST NOT register that directory as an external Project link
- **AND** Agent MUST guide the user to materialize the Project assets under `projects/<project>/`

#### Scenario: Agent uses doctor after Project changes
- **WHEN** Agent creates or repairs a Project
- **THEN** Agent MUST run or rely on `buildr doctor --json` to inspect Project registry, Project baseline and Project repo state
