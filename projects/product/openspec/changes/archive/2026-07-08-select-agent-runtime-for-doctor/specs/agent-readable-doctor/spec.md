## ADDED Requirements

### Requirement: doctor filters runtime checks by Agent
Buildr doctor MUST 支持 Agent-readable 诊断按当前 Agent runtime 过滤 runtime checks。

#### Scenario: Supported Agent-specific doctor
- **WHEN** Agent 运行 `buildr doctor --target <root> --agent codex --json`
- **THEN** doctor MUST 对适用 scopes 运行 Codex runtime diagnostics
- **AND** doctor MUST NOT 在 top-level findings 或 nextSteps 中报告 Claude Code runtime missing、stale、warning 或 conflict findings

#### Scenario: Another supported Agent-specific doctor
- **WHEN** Agent 运行 `buildr doctor --target <root> --agent claude-code --json`
- **THEN** doctor MUST 对适用 scopes 运行 Claude Code runtime diagnostics
- **AND** doctor MUST NOT 在 top-level findings 或 nextSteps 中报告 Codex runtime missing、stale、warning 或 conflict findings

#### Scenario: Doctor reports selected Agent
- **WHEN** Agent 运行 `buildr doctor --target <root> --agent <agent> --json`
- **THEN** doctor JSON MUST 包含 requested Agent runtime id
- **AND** doctor JSON MUST 包含 requested Agent runtime 是否 supported
- **AND** runtime findings MUST 能归因到 selected Agent runtime

#### Scenario: Agent filter does not change scope discovery
- **WHEN** Agent 运行 `buildr doctor --target <root> --agent <agent> --json` 且不传 `--scope`
- **THEN** doctor MUST 保持现有 workspace root 和已发现 Project scopes 的 scope discovery 行为
- **AND** `--agent` MUST 只过滤 diagnostics 使用的 runtime adapter

#### Scenario: Scoped runtime repair command
- **WHEN** doctor 针对某个 Buildr scope 报告 runtime render finding
- **THEN** repair commands MUST 包含修复该 finding 所需的 scope
- **AND** Project scope finding MUST NOT 通过只 render workspace root scope 的命令修复

### Requirement: doctor handles unsupported Agent runtimes
Buildr doctor MUST 将 unsupported Agent runtime 视为 unsupported adapter，而不是缺失 runtime 文件。

#### Scenario: Unsupported Agent-specific doctor
- **WHEN** Agent 运行 `buildr doctor --target <root> --agent unsupported-agent --json`
- **THEN** doctor MUST NOT 运行任何 concrete runtime adapter checker
- **AND** doctor MUST 输出 finding 说明 Buildr 不支持 `unsupported-agent`
- **AND** 该 finding MUST 具有 warning severity，并递增 warning summary
- **AND** 该 finding MUST 设置 `userActionRequired` 为 true
- **AND** 该 finding MUST 包含 `mustNotUseFallbackAdapter: true`
- **AND** 该 finding MUST 告诉用户联系 Buildr 作者反馈该 Agent
- **AND** doctor MUST 继续检查不依赖 runtime adapter 的 workspace source assets
- **AND** 除非发现非 runtime-check 的 source asset error，doctor MUST 成功退出

#### Scenario: Unsupported Agent does not create adapter missing noise
- **WHEN** doctor 收到 unsupported Agent runtime id
- **THEN** doctor MUST NOT 仅因为该 Agent 没有 adapter 而报告 `.claude/`、`.agents/`、`CLAUDE.md` 或其他 adapter-specific 文件缺失
- **AND** doctor MUST NOT 为该 unsupported Agent render 或 export bootstrap files

### Requirement: doctor validates Agent id format
Buildr doctor MUST 在 runtime adapter selection 前拒绝非法 Agent id。

#### Scenario: Invalid Agent id
- **WHEN** Agent 运行 `buildr doctor --agent "Cursor Agent" --target <root> --json`
- **THEN** doctor MUST 拒绝该参数
- **AND** error MUST 说明 Agent ids 只能包含 letters、digits、dots、underscores 或 dashes

#### Scenario: Case-sensitive unsupported Agent id
- **WHEN** Agent 运行 `buildr doctor --agent Codex --target <root> --json`
- **THEN** doctor MUST 将 `Codex` 视为 unsupported
- **AND** doctor MUST NOT 将它归一化为 `codex`

### Requirement: doctor remains backward compatible without Agent filter
Buildr doctor MUST 保持未传 Agent runtime filter 的调用兼容性。

#### Scenario: Doctor without Agent filter
- **WHEN** Agent 运行 `buildr doctor --target <root> --json` 且不传 `--agent`
- **THEN** doctor MAY 继续报告所有已实现 runtime adapter diagnostics
- **AND** Buildr onboarding guidance MUST 在 Agent identity 已知后优先传入 `--agent <agent>`
