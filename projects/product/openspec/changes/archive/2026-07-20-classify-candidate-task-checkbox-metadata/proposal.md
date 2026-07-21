## Why

OpenSpec 要求任务完成后立即勾选 `tasks.md`。当最终任务本身是“运行 Candidate”时，Candidate 只能先在树 A 上成功，随后勾选任务会形成树 B；当前通用规则把任意内容变化都视为 Candidate evidence 失效，因此会为一个纯验证结果标记重复运行完整 Candidate。这个重复执行没有增加实现覆盖，却显著增加收尾耗时。

## What Changes

- 将 Project 明确定义的最终 Candidate 任务单一 checkbox transition 建模为 `closeout-metadata-only` 的 `verification-result-metadata-only` 子类，而不是宣称树 A 的 Candidate 直接覆盖树 B。
- 要求 consumer 同时保存树 A 的 Candidate evidence 与 A→B 的精确、可审计 transition evidence；只有同一会话内可观测、唯一且严格为 `[ ]` → `[x]` 的最终 Candidate 任务标记才允许复用。
- 任意额外内容变化、任务歧义、无法匹配刚成功的 Candidate、跨会话缺少 transition evidence，继续 fail closed 为 `implementation-changed` 并重跑 Candidate。
- 更新 Buildr Product policy、Task Finish、Task Verification 和 OpenSpec apply sidebar；不修改外部 `openspec-*` Skill 源，也不改变 capability/provider/binding 版本。
- 补充 package contract fixture、静态断言和产品文档，覆盖允许路径与拒绝路径。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-task-workflows`: Task Finish 和 OpenSpec apply 对最终 Candidate checkbox transition 的分类、证据与报告要求。
- `task-verification`: Candidate evidence 仍绑定已验证 implementation identity，由 consumer 组合严格限定的验证结果元数据 transition。
- `buildr-package-assets`: package verification 覆盖允许与 fail-closed 分支，并保持能力拓扑不变。

## Impact

- Affected source assets: Product `AGENTS.md`、`task-finish`、`task-verification`、Buildr OpenSpec apply sidebar。
- Affected verification/docs: task verification contract fixture/tests、verification ownership 和产品说明。
- Runtime/API compatibility: 无 CLI/API schema、capability contract version、provider identity 或默认 binding 变化。
