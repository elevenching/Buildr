## Why

当前 runtime adapter 契约把一次性真实产品 smoke、adapter 兼容证据和当前 workspace 投射状态混在一起：WorkBuddy 的历史 smoke 快照被固化为持续产品事实，TRAE Work 的 smoke 缺口又被无条件提升为当前用户必须处理的 warning；同时未指定 `--agent` 的 doctor 会把全部 supported adapters 当成 workspace 必装 runtime，制造与当前 Agent 无关的 stale 和 `ready=false`。需要暂时下线整套 Agent runtime marker smoke，收拢到可重复的 contract/parity 验证，并让 doctor 只按选中或实际受管 runtime 诊断。

## What Changes

- 暂时移除 Agent runtime marker smoke 的 generator、Candidate step、descriptor `verified/pending` 状态和 WorkBuddy 历史 smoke 快照；保留可重复的 descriptor、plan、projection、完整 Skill inventory、checker 和 cleanup 验证。
- 移除 TRAE Work 因未完成 smoke 而无条件产生的 `runtime.trae_work_rules_import_unverified` prerequisite；Buildr 不再把产品证据债务伪装成当前 workspace 故障。
- `doctor --agent <agent>` 继续只诊断当前选中 runtime，并仅由该 runtime 的 actionable findings 影响 readiness。
- 未指定 `--agent` 的 doctor 只发现并诊断当前 workspace 中有 Buildr managed marker 或 receipt 证据的实际 runtime；supported 但不存在的 adapter 不产生 missing/stale noise，未选中的 inventory drift 不降低通用 workspace readiness。
- 保留 `runtime list` 的完整 supported adapter registry；supported、present 和 selected runtime 成为明确分离的概念。
- 无公开命令删除；Agent runtime marker smoke 以后作为独立整体能力重新设计，不在本 change 中保留品牌特例。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-readable-doctor`: 默认 doctor 改为实际受管 runtime inventory 诊断，只有显式 selected runtime 参与当前 readiness。
- `human-agent-onboarding`: adapter 权威文档只声明兼容证据来源和自动验证边界，不再维护 smoke 等级或品牌通过状态。
- `workspace-first-runtime-projection`: 移除 adapter smoke 分层状态、WorkBuddy 特例和 TRAE Work smoke prerequisite，保留独立兼容证据与可重复投射契约。
- `product-verification-quality`: Candidate 下线 Agent runtime smoke workspace generator，仅保留 contract/parity owner。

## Impact

- 影响 runtime adapter descriptor、projection checker、doctor runtime diagnostics、public JSON contract、runtime verification registry 和相关测试。
- 删除 Agent runtime smoke generator 及其专项测试，但不影响 npm release smoke、package smoke 或 workspace lifecycle E2E。
- 更新 `docs/agent-runtime-adapters.md`、CLI/doctor 文档和验证职责说明。
- 不改变 `render`、`sync`、`skill install` 的受管投射格式，也不降低全部 supported adapters 的自动 contract/parity 覆盖。
