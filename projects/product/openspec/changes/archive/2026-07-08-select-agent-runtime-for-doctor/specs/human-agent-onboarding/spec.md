## ADDED Requirements

### Requirement: Agent selects runtime adapter before render
Buildr onboarding MUST 引导 Agent 在运行 runtime render、sync、skill install 或 runtime check 命令前，先识别自身 runtime，并与 Buildr supported runtime adapter list 对比。

#### Scenario: Agent discovers supported runtimes
- **WHEN** Agent 开始 Buildr onboarding 或 runtime maintenance
- **THEN** Agent MUST 在 runtime-specific Buildr commands 前运行或依赖 `buildr runtime list --json`
- **AND** Agent MUST 在运行 runtime-specific commands 前选择与自身 runtime 匹配的 adapter id

#### Scenario: Supported Agent uses matching adapter
- **WHEN** Agent 确认自己是 supported runtime
- **THEN** Agent MUST 将匹配的 `<agent>` 值传给 Buildr runtime-specific commands
- **AND** Agent MUST 在 runtime identity 已知后使用 `doctor --agent <agent>` 进行 onboarding diagnostics

#### Scenario: Agent cannot identify itself
- **WHEN** Agent 无法可靠识别自身 runtime
- **THEN** Agent MUST NOT 构造 `unknown`、`generic` 或其他 placeholder Agent id
- **AND** Agent MUST NOT 运行 runtime render、sync、skill install 或 runtime check commands
- **AND** Agent MAY 运行 `buildr doctor --target <dir> --json` 进行兼容的 source asset diagnostics
- **AND** Agent MUST 告诉用户当前 Agent runtime identity 尚未确认

#### Scenario: Unsupported Agent warns instead of rendering
- **WHEN** Agent 确认自己是 unsupported runtime
- **THEN** Agent MUST 警示用户 Buildr 暂不支持当前 Agent 的自动渲染
- **AND** Agent MUST NOT 使用猜测的 adapter id 执行 render、sync、skill install 或 runtime check
- **AND** Agent MUST NOT 使用 supported fallback adapter 代替
- **AND** Agent MUST 告诉用户联系 Buildr 作者反馈该 Agent

### Requirement: Buildr guidance names runtime render assets
Buildr onboarding guidance MUST 说明哪些 Buildr assets 参与 Agent runtime render，哪些仍保持为 source assets。

#### Scenario: Runtime render explanation
- **WHEN** Buildr Skill、bootstrap guide、README、init output 或 doctor unsupported-Agent guidance 描述 runtime render
- **THEN** guidance MUST 将 rules entry or bridge、product Buildr Skill、workspace/project Skills、Skill install plans 和 runtime check 说明为 adapter render capabilities
- **AND** guidance MUST 说明 Commands、Project registry、Service registry、OpenSpec、knowledge、practices 和 docs 保持为 Buildr source assets，除非未来 adapter 明确支持 render 它们

### Requirement: Buildr Skill uses runtime discovery in its main loop
Buildr product Skill MUST 将 runtime adapter discovery 作为主执行循环的一部分。

#### Scenario: Buildr Skill runtime selection
- **WHEN** Agent 使用 Buildr product Skill 维护 Buildr workspace
- **THEN** Skill MUST 要求 Agent 在 runtime-specific commands 前检查 `buildr runtime list --json`
- **AND** Skill MUST 要求 Agent 在 Agent identity 已知后使用 `buildr doctor --agent <agent> --target <dir> --json`
- **AND** Skill MUST 要求 Agent 不为 unsupported Agent runtime 使用 fallback adapters

### Requirement: CLI help is useful and safe for Agent exploration
Buildr CLI help MUST 对 Agent exploration 有用且安全，并且 MUST NOT 执行 state-changing actions。

#### Scenario: All supported commands expose help
- **WHEN** Agent runs `--help` for any supported Buildr command or nested subcommand
- **THEN** Buildr MUST output non-empty help that names the requested command or subcommand
- **AND** Buildr MUST exit successfully
- **AND** Buildr MUST NOT perform state-changing actions

#### Scenario: Subcommand help has no side effects
- **WHEN** Agent runs `buildr init --help`
- **THEN** Buildr MUST output help for `init`
- **AND** Buildr MUST NOT initialize the target directory
- **AND** Buildr MUST exit successfully

#### Scenario: Nested subcommand help has no side effects
- **WHEN** Agent runs `buildr project create --help`
- **THEN** Buildr MUST output help for `project create`
- **AND** Buildr MUST NOT create or repair any Project
- **AND** Buildr MUST exit successfully

#### Scenario: Runtime list help has no side effects
- **WHEN** Agent runs `buildr runtime list --help`
- **THEN** Buildr MUST output help for `runtime list`
- **AND** Buildr MUST NOT require a Buildr workspace
- **AND** Buildr MUST exit successfully
