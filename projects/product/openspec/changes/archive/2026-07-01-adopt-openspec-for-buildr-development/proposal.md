## 背景与动机

Buildr 正在从文件系统框架走向产品化，需要一种可追踪、可讨论、可实施的变更管理方式来承载自身演进。将 Buildr 自身开发纳入 OpenSpec，可以让后续 `buildr-product-mvp` 等产品化工作先形成清晰的 proposal、design、spec 和 tasks，再进入实现。

## 变更内容

- 初始化 Buildr 仓库内的 OpenSpec 规划空间，作为 Buildr 自身需求、设计和任务的项目级来源。
- 定义 Buildr 自身开发使用 OpenSpec 的工作方式：何时创建 change、change 应该沉淀什么、如何与现有 `docs/`、`AGENTS.md`、`practices/` 和 runtime 产物分工。
- 建立第一个自举 change，用于规范后续 Buildr 变更如何被 proposal、design、spec 和 tasks 驱动。

## 能力范围

### 新增能力

- `buildr-development-openspec`: 定义 Buildr 自身开发如何使用 OpenSpec 管理需求、设计、规格和实施任务。

### 修改能力

无。

## 影响范围

- 新增仓库内 `openspec/` 规划空间和 `openspec/changes/` 变更目录。
- 后续 Buildr 产品化、能力规范、需求变更应优先通过 OpenSpec change 表达。
- 现有 `docs/` 仍用于框架设计、产品思考和长期说明；OpenSpec 用于具体可实施变更。
- 不改变现有 CLI 行为，不修改 runtime adapter 生成逻辑。
