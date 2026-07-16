# Buildr 文档说明

本文说明 Buildr 产品文档的分工。它不是 Agent 运行时规则，也不是产品事实源。

## 当前入口

| 文档 | 作用 |
|------|------|
| [../README.md](../README.md) | 产品入口、快速开始和文档导航 |
| [buildr-product.md](buildr-product.md) | 产品理解：定位、核心模型、工作资产、协作方式和后续方向 |
| [../openspec/knowledge/buildr-current-state.md](../openspec/knowledge/buildr-current-state.md) | 当前已实现事实，按 OpenSpec 能力域组织 |
| [../openspec/specs/](../openspec/specs/) | 规范性产品行为契约 |
| [roadmap/](roadmap/) | 尚未实现的产品方向和详细设计候选，不作为当前事实或实施契约 |
| [release-checklist.md](release-checklist.md) | 发布准备和验证清单 |
| [cli-reference.md](cli-reference.md) | 公开 CLI 命令、参数边界和 canonical onboarding |
| [cli-architecture.md](cli-architecture.md) | CLI 内部分层、依赖方向、兼容和维护验证边界 |
| [agent-runtime-adapters.md](agent-runtime-adapters.md) | 已接入 Agent runtime adapter 的支持矩阵、接入路径、刷新方式、限制和证据状态 |
| [agent-runtime-adapter-contribution.md](agent-runtime-adapter-contribution.md) | 新 Agent runtime adapter 的证据采集、分诊、设计、实现和验收流程 |
| [agent-runtime-adapter-research-prompt.md](agent-runtime-adapter-research-prompt.md) | 可直接交给目标 Agent 执行的 runtime 能力调查 Prompt |
| [known-limitations.md](known-limitations.md) | 当前公开试用范围和已知限制 |
| [archive/](archive/) | 历史参考，不作为当前事实源 |

## 内容归属

| 内容类型 | 放置位置 |
|----------|----------|
| 产品入口、最小心智模型、快速开始 | `README.md` |
| 产品定位、为什么、核心概念、协作模型 | `docs/buildr-product.md` |
| 已经实现的当前事实 | `openspec/knowledge/buildr-current-state.md` |
| 复杂任务的跨阶段目标、计划、依赖、进度和证据入口 | `openspec/knowledge/task-cockpits/yyyy-MM-dd-<task-id>.html` |
| MUST / SHOULD 级产品行为 | `openspec/specs/` |
| 计划型产品变更 | `openspec/changes/` |
| 尚未进入实现的长期产品方向 | `docs/roadmap/` |
| 发布检查和公开发布准备 | `docs/release-checklist.md` |
| 公开 CLI reference、内部维护架构、adapter 接入指南与已知限制 | `docs/cli-reference.md`、`docs/cli-architecture.md`、`docs/agent-runtime-adapter-contribution.md`、`docs/known-limitations.md` |
| 旧设计、旧草案、迁移前原文、历史模板 | `docs/archive/` |

## Knowledge 规则

进入 `openspec/knowledge/` 的常规 current-state 文档必须是当前事实：

- 当前已经实现。
- Agent 或维护者需要据此判断现状。
- 能和 `openspec/specs/` 的能力域对齐。
- 未来可能随实现变化而更新。

`knowledge` 不写产品价值主张、愿景、历史原因、采用场景或路线图。

`openspec/knowledge/task-cockpits/` 是明确隔离的 task-scoped working knowledge 子层：

- 由 Agent 单向维护整个任务的目标、当前计划、历史阶段、依赖、风险和验证证据入口。
- 文件名使用 `yyyy-MM-dd-<task-id>.html`，日期取首次创建时的本地日期，后续保持稳定路径。
- 可以关联多个 active/archive change、code-only 工作和外部依赖，不随单个 change archive 移动。
- 不是 current-state facts 全集、canonical specs、active change、代码或验证结果的替代事实源；冲突时必须回到对应权威来源核实并修正驾驶舱。

## Roadmap 规则

`docs/roadmap/` 保存仍有价值但尚未实现的产品方向：

- 必须显著说明内容尚未实现，不是当前事实、行为契约、Rule、Skill 或 Agent runtime 资产。
- 不能用现在时把未来方向描述为 Buildr 已提供的能力。
- 方向准备进入实现时，必须创建独立 OpenSpec change；Roadmap 文档不替代 proposal、design、delta specs 或 tasks。
- 方向实现、放弃或被替代后，应同步维护 Roadmap 索引，避免陈旧规划被误读。

## Archive 规则

`docs/archive/` 放历史参考。归档文档不是当前 Buildr 产品事实源，默认不参与 Agent 当前任务判断。

归档文档顶部必须标注：

```md
> Archived historical note. Not a current Buildr product source of truth.
```

## 维护约定

- 新增当前产品说明时，优先更新 `docs/buildr-product.md`。
- 新增当前实现事实时，优先更新 `openspec/knowledge/buildr-current-state.md`。
- 复杂任务需要持续可视化认知入口时，使用 `task-cockpit` Skill 维护 `openspec/knowledge/task-cockpits/`，不要把任务进度混入 current-state facts 文档。
- 新增规范性行为时，更新 `openspec/specs/` 或创建 OpenSpec change。
- 新增尚未进入实现的详细产品方向时，维护 `docs/roadmap/` 并保持非当前事实声明。
- 新增 Agent runtime adapter 前，先按 `docs/agent-runtime-adapter-contribution.md` 取得目标 Agent 的版本化证据；进入实现后仍必须创建独立 OpenSpec change。
- Components、Commands collections 与 OpenSpec 契约门禁的当前边界写入 current state，产品含义写入产品说明，MUST 行为保留在 OpenSpec specs；未来的 Project/Service Component、远程 registry 和 Hook 不得提前写成当前事实。
- 重命名、归档或删除文档时，同步更新本文。
