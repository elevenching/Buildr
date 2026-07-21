## ADDED Requirements

### Requirement: Project CLI 必须使用 canonical Domain 术语
Buildr CLI MUST expose Project creation and diagnostics using `code`, `name`, source and integration branch terminology while preserving explicit legacy input compatibility.

#### Scenario: Project create help
- **WHEN** 用户运行 `buildr project create --help`
- **THEN** help MUST document `--name`, `--description`, `--repo`, `--remote` and `--integration-branch`
- **AND** help MUST explain workspace versus Git source and MUST NOT call integration branch the current branch

#### Scenario: Legacy title input
- **WHEN** an existing automation uses `--title`
- **THEN** CLI MUST accept it as compatibility input and map it to Project `name`
- **AND** canonical output and examples MUST use `--name`

#### Scenario: App help includes Project boundary
- **WHEN** 用户运行 `buildr app --help`
- **THEN** help MUST mention Project list/detail and low-risk name/description edits
- **AND** help MUST state that Project creation is prompt-only and Git state changes are not performed by the UI

### Requirement: Project JSON 输出必须区分声明与观察
Buildr CLI and doctor JSON MUST expose canonical Project identity, declared source and observed Git state as separate objects.

#### Scenario: Canonical Project JSON
- **WHEN** Agent requests JSON diagnostics for a v2 registry
- **THEN** each Project MUST expose id, workspaceId, code, name, description and source
- **AND** observed Git fields MUST NOT appear inside source or persisted Domain fields

#### Scenario: Compatibility Project JSON
- **WHEN** Agent requests diagnostics for a readable v1 registry
- **THEN** output MUST mark migration required and expose a canonical next action
- **AND** MUST NOT claim that generated compatibility identity has been persisted
