# Buildr Roadmap 资料

本目录保存仍有价值、但尚未实现的 Buildr 产品方向。这里的内容用于保留设计意图和帮助后续探索，不是当前产品承诺，也不是已经批准的实施计划。

## 与产品事实的边界

| 内容 | 权威位置 |
|------|----------|
| 产品入口、定位和后续方向摘要 | [`README.md`](../../README.md) 与 [`docs/buildr-product.md`](../buildr-product.md) |
| 已实现的当前事实 | [`openspec/knowledge/buildr-current-state.md`](../../openspec/knowledge/buildr-current-state.md) |
| MUST / SHOULD 级行为契约 | [`openspec/specs/`](../../openspec/specs/) |
| 已进入实施评审的计划型变更 | [`openspec/changes/`](../../openspec/changes/) |
| 历史参考 | [`docs/archive/`](../archive/) |

Roadmap 文档不是 Rule、Skill、Agent runtime 资产或当前能力说明，不能直接指导 Agent 假设对应功能已经可用。某个方向准备实现时，必须另行创建 OpenSpec change，收敛需求、设计、delta specs 和 tasks；实现完成后再按事实更新 current-state knowledge 与 canonical specs。

## 当前方向资料

- [多 Agent 任务编排与上下文管理](agent-context-orchestration.md)：以 Task DAG、Specs、Codebase Memory 和 Task State 支撑并发执行与多层上下文流转；重要性 t0，紧急性 t1。
- [角色 Agent 设计候选](agent-roles/)：历史岗位化职责草案；后续应优先评估如何拆分为可动态加载的 Rules、Skills 和 Packages，而不是固定 Agent 身份。
- [原型开发能力设想](prototype-development.md)：编码式交互原型流程候选，尚未作为 Buildr Skill、CLI 或受管工作流实现。
- [Workspace Assets 独立版本化方向](workspace-assets-versioning.md)：当前继续随 CLI package 发布，未来按触发条件评估版本化 tarball 与独立同步协议。

Roadmap 方向如果被放弃、替代或实现，应同步维护本索引，避免陈旧资料继续暗示当前能力。
