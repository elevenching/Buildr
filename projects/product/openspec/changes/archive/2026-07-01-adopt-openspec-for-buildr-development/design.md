## 背景

Buildr 目前已有框架规则、设计文档和产品化路线文档，但还没有用 OpenSpec 管理自身变更。随着产品化推进，单纯依赖 `docs/` 讨论方向会让“想法、决策、规格和实施任务”混在一起，不利于后续审阅、拆分和归档。

Buildr 自身适合成为 OpenSpec 的首个自举项目：用 Buildr 管理 Agent 上下文，用 OpenSpec 管理 Buildr 的需求和变更。

## 目标与非目标

**目标：**

- 在 Buildr 仓库内建立 OpenSpec 作为自身变更管理入口。
- 明确 `docs/`、`AGENTS.md`、`practices/` 和 `openspec/` 的分工。
- 让后续产品化变更，例如 `buildr-product-mvp`，先通过 OpenSpec change 形成 proposal、design、spec 和 tasks。
- 形成可持续的自举流程：先讨论，后建 change，再实施，再归档。

**非目标：**

- 不在本 change 中实现 `buildr-product-mvp` 的 CLI 功能。
- 不迁移现有所有设计文档到 OpenSpec。
- 不改变当前 Buildr runtime adapter 的 check/render 行为。
- 不决定 `companies/` 是否迁移为 `orgs/`。

## 设计决策

### 决策：使用仓库内 `openspec/` 作为 Buildr 自身规划空间

Buildr 自身开发的 OpenSpec artifact 放在仓库根目录下的 `openspec/`。

原因：Buildr 是这个仓库的产品主体，repo-local OpenSpec 最直接，后续 change 可以和代码、文档、规则同仓审阅。

备选方案：放到 `companies/default/projects/buildr/openspec/`。这个方案更贴近 Buildr 自己的层级模型，但会在 Buildr MVP 尚未实现前引入额外自引用复杂度。

### 决策：`docs/` 继续承载长期设计思考，OpenSpec 承载可实施变更

`docs/` 保留架构愿景、上下文模型、产品路线和长期讨论。OpenSpec change 用于一次明确的需求变更、设计决策、规格变更和实施任务。

原因：产品思考会持续演化，不一定都进入实现；OpenSpec 应保持和可交付变更绑定。

备选方案：所有讨论都进入 OpenSpec。这个方案会让探索性材料过早规范化，降低讨论自由度。

## 风险与取舍

- OpenSpec artifact 和 `docs/` 内容重复 → 通过分工约定缓解：`docs/` 记录长期思考，OpenSpec 记录可实施变更。
- 自举流程增加轻量任务的成本 → 只要求产品能力、规则、架构和跨文件行为变更走 OpenSpec；简单文档修订仍可直接修改。
- 仓库根 `openspec/` 与 Buildr 长期“项目级 openspec”模型不完全一致 → 当前阶段接受 repo-local 自举；未来产品模型稳定后再评估是否迁移为 Buildr 管理的项目级目录。
