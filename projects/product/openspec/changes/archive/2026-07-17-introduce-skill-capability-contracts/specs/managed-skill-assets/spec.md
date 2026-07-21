## MODIFIED Requirements

### Requirement: Skills manifest schemaVersion
Buildr MUST 要求 workspace/project `skills/manifest.yml` 声明 Skill manifest schema version，并 MUST 通过 `buildr.skills/v2` 表达 capability contracts、bindings、providers 和 consumers。

#### Scenario: 新建 Skills manifest
- **WHEN** Buildr creates a workspace or project `skills/manifest.yml`
- **THEN** Buildr MUST write `schemaVersion: buildr.skills/v2`
- **AND** 没有 capability composition 的 manifest MAY 省略空的 `contracts` 和 `bindings`

#### Scenario: v1 Skills manifest 升级到 v2
- **WHEN** Buildr update or sync reads a valid `buildr.skills/v1` manifest
- **THEN** Buildr MUST transactionally migrate it to `buildr.skills/v2`
- **AND** migration MUST preserve every existing Skill identity、source/path、description、enabled、required、state、reason、runtime 和远端安装信息
- **AND** migration MUST add package-declared `provides`、`requires`、contracts 和 initial default bindings only where no user binding exists and the corresponding managed builtin state permits them
- **AND** migration MUST NOT restore an uninstalled builtin provider or overwrite an explicit user provider choice

#### Scenario: 旧 Skills manifest 缺 schemaVersion
- **WHEN** an existing `skills/manifest.yml` has valid Skill entries but no `schemaVersion`
- **THEN** Buildr update or sync MUST transactionally migrate it to `buildr.skills/v2`
- **AND** Buildr doctor MUST report a warning before the file is repaired

#### Scenario: Skills manifest schemaVersion 错误
- **WHEN** `skills/manifest.yml` declares an unsupported `schemaVersion`
- **THEN** Buildr doctor MUST report an error with supported versions and executable nextActions
- **AND** Buildr MUST NOT partially render or rewrite the unsupported manifest

#### Scenario: 旧 CLI 读取 v2 manifest
- **WHEN** a Buildr CLI version that does not support `buildr.skills/v2` reads a v2 manifest
- **THEN** the CLI MUST fail explicitly rather than ignore `contracts`、`bindings`、`provides` or `requires`
- **AND** rollback MUST use a pre-migration snapshot or an explicit lossy downgrade action

## ADDED Requirements

### Requirement: Skill 生命周期保留 capability declarations
Buildr MUST 在 Skill add/remove、builtin install/uninstall/restore、update、sync 和 render 生命周期中一致维护 capability identity、dependency 和 binding 信息，并 MUST 避免普通安装或更新静默改变现有 provider 选择。

#### Scenario: 更新 managed builtin provider
- **WHEN** package update changes a managed builtin Skill that provides or requires capabilities
- **THEN** Buildr MUST reconcile package-owned declarations while preserving user-owned bindings and uninstall state
- **AND** Buildr MUST only require pre-mutation impact disclosure when the update would remove、disable or rebind a selected provider
- **AND** final doctor MUST report the resulting dependency graph

#### Scenario: 移除用户 provider
- **WHEN** Agent removes a user Skill that is selected by one or more bindings
- **THEN** Buildr MUST expose the affected required and optional consumers before mutation
- **AND** Buildr MUST preserve enough manifest evidence for doctor to explain any resulting missing or ambiguous dependency

### Requirement: Skills CLI 提供最小 capability 声明与 binding 写入口
Buildr MUST 让 Agent 通过事务化 Skills CLI 声明 provider/consumer 和显式 binding，而不要求普通用户直接编辑 `buildr.skills/v2` 嵌套结构。

#### Scenario: 添加 provider 或 consumer declarations
- **WHEN** Agent 运行 `buildr skills add` 或 replace 并提供重复的 `--provides <capability>@<version>` 或 `--requires <capability>@<version>:<required|optional>`
- **THEN** Buildr MUST 校验 contract identity、version、scope、重复声明和 dependency mode 后再写入 Skill entry
- **AND** command MUST preserve all v2 contract、binding 和 unrelated Skill data not owned by the mutation

#### Scenario: 显式绑定 provider
- **WHEN** Agent 运行 `buildr skills bind <capability>@<version> --provider <skill-id> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 校验 contract 和 provider 在该 scope 可见且 version 兼容
- **AND** Buildr MUST transactionally write only the selected scope binding and run final doctor
- **AND** command MUST NOT install the provider、uninstall builtin or claim behavior verification

#### Scenario: 删除显式 binding
- **WHEN** Agent 运行 `buildr skills unbind <capability>@<version> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 删除且只删除当前 scope 的 matching binding
- **AND** resolver MUST 根据剩余 visible providers 产生 ready、blocked 或 degraded 结果
- **AND** final doctor MUST report any resulting ambiguity or missing provider
