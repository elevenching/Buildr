## ADDED Requirements

### Requirement: doctor 诊断递归 AGENTS runtime 投射
Buildr doctor and runtime check MUST diagnose the canonical scope's ancestor Rules chain and recursively discovered `AGENTS.md` subtree using the selected adapter's projection behavior.

#### Scenario: Codex recursive Rules diagnostics
- **WHEN** Agent runs Codex runtime diagnostics for a Project or Service canonical scope
- **THEN** diagnostics MUST report every applicable and recursively discovered `AGENTS.md` as a native Rules source
- **AND** diagnostics MUST NOT report missing Codex bridge files

#### Scenario: Rendered adapter recursive diagnostics
- **WHEN** Agent runs runtime diagnostics for an adapter whose `rules-entry` is rendered
- **THEN** diagnostics MUST compare every discovered `AGENTS.md` with its expected same-directory runtime bridge
- **AND** diagnostics MUST report missing、stale、conflict and orphan managed bridge states

#### Scenario: Canonical repair commands
- **WHEN** diagnostics report a Rules projection finding for a Service or deeper scope
- **THEN** every suggested repair command MUST use the canonical workspace-relative scope
- **AND** repair commands MUST NOT use the legacy Service scope shorthand

#### Scenario: Doctor deduplicates recursive findings
- **WHEN** doctor aggregates workspace and Project diagnostics that discover the same Rules source or target
- **THEN** doctor MUST emit one finding per adapter、canonical source and target identity
- **AND** summary counts and next steps MUST NOT duplicate that finding

#### Scenario: Recursive scope boundary finding
- **WHEN** discovery encounters an unregistered nested Git repo or excluded runtime/dependency/build directory
- **THEN** diagnostics MUST NOT treat skipped descendant `AGENTS.md` as missing runtime sources
- **AND** verbose or structured diagnostic metadata MUST make the applied discovery boundary identifiable
