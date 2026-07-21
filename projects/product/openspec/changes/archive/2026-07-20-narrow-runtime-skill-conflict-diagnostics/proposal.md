## Why

Buildr 当前把 Agent 无法枚举的 `admin`、`system`、`plugin` Skill 来源无条件报告为 doctor warning，导致健康 workspace 永久呈现黄色状态，却没有可执行修复动作。Buildr 应只治理自身维护 Skill 的完整性，并单向检查这些候选在可观测 runtime 中的真实同名冲突；不可观测来源应保留为证据完备性边界，而不是健康问题。

## What Changes

- 普通 doctor 不再因 runtime inventory 为 `partial` 产生 warning；workspace 健康状态只反映可操作的受管资产问题和已观察冲突。
- runtime check 和 JSON 结果继续暴露 `skillInventoryEvidence: partial`、`opaqueSources` 与“不能证明全局无同名 Skill”的 assurance 边界。
- render、sync 和 install 只针对 Buildr 即将投射或已经维护的 Skill identity 检查可观测同名项；真实 `name_conflict`、`foreign_owner` 等冲突仍保持零写入阻塞。
- 与 Buildr 候选无关的 runtime Skills 不进入冲突诊断；不新增全局 Agent runtime 盘点职责。
- 更新公开诊断契约、adapter 文档和自动测试，不包含破坏性 CLI 参数或 schema 变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 将 partial inventory 从 runtime warning 调整为非操作性的 assurance metadata，并限定冲突检查只围绕 Buildr 管理候选。
- `cli-product-surface`: 明确健康诊断、真实冲突与 inventory assurance 的稳定 JSON 表达和 actionability。

## Impact

- `openspec/specs/workspace-first-runtime-projection/spec.md`
- `openspec/specs/cli-product-surface/spec.md`
- `tools/runtime/projection.mjs`
- `tools/cli/application/runtime.mjs` 与 doctor diagnostics 聚合（按实际实现需要）
- `docs/agent-runtime-adapters.md`、产品入口 Skill 的 runtime 说明
- runtime projection、doctor 和公开 JSON contract tests
