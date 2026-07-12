## MODIFIED Requirements

### Requirement: onboarding supports Project registry and Project asset repos
Buildr onboarding MUST 引导 Agent 和用户完成 Project registry maintenance 与 independent Project asset repo creation。

#### Scenario: Agent creates a Project
- **WHEN** user asks Agent to create a Project in a Buildr workspace
- **THEN** Agent MUST use `buildr project create <project>`
- **AND** Agent MUST expect the command to maintain both `projects/<project>/` and `projects/manifest.yml`

#### Scenario: Agent records concise Project identity
- **WHEN** Agent creates a Project and the user provides a human-readable title or short description
- **THEN** Agent MUST pass that information through Project creation or registry repair
- **AND** Agent MUST NOT treat the registry description as a replacement for Project OpenSpec knowledge or specs

#### Scenario: 用户提供 Project 资产 Git repo
- **WHEN** user provides a Git repo intended to store Project memory, rules, OpenSpec, Skills or docs
- **THEN** Agent MUST treat it as a Project asset repo rather than a service repo
- **AND** Agent MUST use `buildr project create <project> --repo <git-url>`

#### Scenario: 用户提供本地 Project 资产目录
- **WHEN** user provides a local directory intended to become a Project asset repo
- **THEN** Agent MUST NOT register that directory as an external Project link
- **AND** Agent MUST guide the user to materialize the Project assets under `projects/<project>/`

#### Scenario: Agent uses doctor after Project changes
- **WHEN** Agent creates or repairs a Project
- **THEN** Agent MUST run or rely on `buildr doctor --agent <agent> --json` after runtime identity is known to inspect Project registry, Project baseline and Project repo state

### Requirement: Buildr guidance names runtime render assets
Buildr onboarding guidance MUST 说明哪些 Buildr assets 参与 Agent runtime render，哪些仍保持为 source assets。

#### Scenario: Runtime render explanation
- **WHEN** Buildr Skill、bootstrap guide、README、init output 或 doctor unsupported-Agent guidance 描述 runtime render
- **THEN** guidance MUST 将 rules entry or bridge、product Buildr Skill、workspace/project Skills、Skill install plans 和 runtime check 说明为 adapter render capabilities
- **AND** guidance MUST 说明 Commands、Project registry、Service registry、OpenSpec、knowledge 和 docs 保持为 Buildr source assets，除非未来 adapter 明确支持 render 它们
- **AND** guidance MUST NOT 将 Practices 表示为 Buildr source asset
