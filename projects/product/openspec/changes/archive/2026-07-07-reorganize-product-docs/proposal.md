## Why

Buildr 当前产品相关说明分散在根 `README.md`、`docs/` 多篇长文档、`openspec/knowledge/` 当前事实和 `openspec/specs/` 行为契约中。经过 package/workspace 文档收敛后，剩余问题主要是产品层文档职责重叠：

- README、产品手册、路线图和 current-state 都在描述“当前实现了什么”。
- 架构愿景、上下文模型、组织模型和 runtime adapter 文档之间存在概念重复。
- 已实现事实没有稳定收敛到 `openspec/knowledge/`，导致 Agent 判断当前产品状态时需要读多篇 docs。
- `docs/` 缺少一个明确的“文档说明文档”，说明哪些文档是当前事实源、哪些是产品理解、哪些只是历史参考。

需要先建立产品文档分层契约，再按该契约整理现有文档。

## What Changes

- 新增或重写 `docs/document-index.md`，作为产品文档说明文档，明确 README、`docs/`、`openspec/knowledge/`、`openspec/specs/` 和 `docs/archive/` 的职责。
- 将已实现产品事实收敛到 `openspec/knowledge/buildr-current-state.md`，并与 `openspec/specs/` 的能力域对齐。
- 将产品理解、核心模型、设计原则和后续方向聚合为一个 `docs/buildr-product.md`，避免多篇 docs 重复解释 Buildr 是什么。
- 保留 `docs/release-checklist.md` 作为发布操作清单。
- 将被聚合或被 knowledge/specs 取代的历史长文档移入 `docs/archive/`，并标注不再作为当前事实源。
- 瘦身根 `README.md`，让它只承担产品入口、快速开始和文档导航。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `buildr-development-openspec`: 增加 Buildr 产品文档、knowledge 和 specs 的分层约束，要求当前事实进入 knowledge，规范性行为进入 specs，产品理解进入 docs。

## Impact

- 影响 `README.md`、`docs/`、`openspec/knowledge/` 和文档索引。
- 不改变 CLI、package baseline、runtime adapter 或用户 workspace 生成行为。
- 需要校验文档中的当前事实与 `openspec/specs/` 不冲突。
- 实施完成后，Agent 判断 Buildr 当前产品状态时应优先读取 `openspec/knowledge/buildr-current-state.md`，而不是从多篇 docs 中拼接事实。
