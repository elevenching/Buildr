## Why

Codex runtime checker 正确把 `runtime.skill_visibility_incomplete` 标记为非行动型 warning，但 doctor 聚合为 `runtime.codex_warning` 时丢失 `userActionRequired: false`，导致健康 workspace 被错误报告为 `ready: false` 并生成无法执行的 repair plan。现在需要修复聚合语义，使 warning 的可见性与用户是否需要处理保持独立。

## What Changes

- doctor 聚合 runtime warnings 时保留子 findings 的 actionability；只有至少一个 actionable runtime warning 时才要求用户处理。
- 非行动型 runtime warning 继续保留在 summary/runtime diagnostics 中，但不降低 `health.ready`，不进入 `repairPlan` 或 `nextSteps`。
- 顶层 runtime warning 携带原始 warning codes、证据等级和 opaque sources，避免只有笼统提示。
- 增加非行动型、行动型和混合 runtime warning 的回归测试。
- 不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-readable-doctor`: 明确 runtime warning 聚合必须保留 actionability，并让非行动型可观测性 warning 不影响 readiness 或 repair plan。

## Impact

- 影响 `tools/cli/application/doctor/runtime-diagnostics.mjs` 的 runtime warning 聚合。
- 影响 doctor unit/fast integration fixtures 和 Agent-readable JSON 健康状态。
- 不改变 runtime projection、render/sync、warning severity 或 CLI 退出码。
