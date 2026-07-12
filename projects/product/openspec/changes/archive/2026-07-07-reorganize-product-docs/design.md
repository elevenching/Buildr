## Context

本 change 只处理产品文档信息架构，不改变 Buildr runtime 行为。package/workspace 文档已经收敛为随包资产说明、用户 workspace README、Buildr Skill 和 bootstrap guide；剩余文档应围绕产品层分工整理。

## Target Structure

```text
README.md
docs/
  document-index.md
  buildr-product.md
  release-checklist.md
  archive/
openspec/
  knowledge/
    buildr-current-state.md
  specs/
    ...
```

## Document Responsibilities

### README.md

产品入口。只回答：

- Buildr 是什么。
- 最小心智模型。
- 快速开始。
- 当前支持范围摘要。
- 指向产品说明、当前事实和 specs 的文档导航。

README 不承担产品手册、路线图或当前事实全集。

### docs/document-index.md

产品文档说明文档。它说明：

- 当前文档结构。
- 哪些文档是当前入口。
- 哪些内容应进入 knowledge。
- 哪些内容应进入 specs。
- `docs/archive/` 的读取边界。

它不作为运行时规则，也不承载产品事实本身。

### docs/buildr-product.md

产品理解文档。聚合当前 `docs/` 中仍有价值的解释性内容：

- 产品定位和要解决的问题。
- Workspace / Project / Service / Agent runtime 模型。
- Rules、Skills、Commands、OpenSpec、Practices、Project/Service metadata 等工作资产模型。
- 人和 Agent 的协作方式。
- runtime 投射的高层模型。
- MVP 边界摘要和后续方向。

它可以解释为什么，但不作为“当前实现事实”的唯一来源。当前事实应链接到 `openspec/knowledge/buildr-current-state.md`。

### openspec/knowledge/buildr-current-state.md

当前事实源。承接“已经实现部分”，写成事实句，并按 specs 能力域组织：

- Workspace / Organization。
- Project registry。
- Service metadata。
- Package baseline。
- Agent Skills。
- Workspace / Project Skills。
- Commands。
- Doctor。
- Runtime projection。
- Bootstrap / package contract。
- Current limits。

knowledge 不写价值主张、愿景、采用场景或路线图。

### openspec/specs/

行为契约。只写 MUST / SHOULD 级要求、CLI 行为、package check 行为、runtime render/check 行为和产品能力边界。

specs 不写产品叙事、历史原因或当前状态长文。

### docs/release-checklist.md

发布操作清单。保留独立，不并入 product 文档或 knowledge。

### docs/archive/

历史参考。放不再参与当前产品认知的原文、旧方案和模板：

- 被 `docs/buildr-product.md` 聚合后的长文档原稿。
- 被 `openspec/knowledge/` 或 `openspec/specs/` 取代的旧事实说明。
- 旧设计草案、旧组织模型、旧 runtime 方案。
- 历史模板。

archive 文档顶部应标注：

```md
> Archived historical note. Not a current Buildr product source of truth.
```

## Migration Rules

- “已经实现了什么”进入 `openspec/knowledge/buildr-current-state.md`。
- “应该如何表现”进入 `openspec/specs/*`。
- “为什么这么设计 / 如何理解产品”进入 `docs/buildr-product.md`。
- “后续要做什么”进入 `docs/buildr-product.md` 的后续方向或 archive；不要和当前事实混写。
- “发布时检查什么”保留在 `docs/release-checklist.md`。
- 被迁移内容的旧文件进入 archive，而不是直接删除。

## Source Document Treatment

| 当前文档 | 处理方向 |
|----------|----------|
| `docs/buildr-product-manual.md` | 产品理解并入 `docs/buildr-product.md`；当前实现状态迁入 knowledge |
| `docs/buildr-architecture-vision.md` | 核心设计原则并入 `docs/buildr-product.md`；长篇愿景和旧草案归档 |
| `docs/buildr-context-model.md` | 概念解释并入 `docs/buildr-product.md`；scope/target 当前事实迁入 knowledge |
| `docs/buildr-organization-model.md` | Organization/Project/Service 当前事实迁入 knowledge；采用场景并入 product 或归档 |
| `docs/buildr-agent-runtime-adapters.md` | 当前 adapter 行为迁入 knowledge；高层 runtime 模型并入 product |
| `docs/buildr-productization-roadmap.md` | 已完成事实迁入 knowledge；后续方向并入 product 或归档 |
| `docs/buildr-release-checklist.md` | 保留并改名或维持为 release checklist |
| `docs/document-index.md` | 重写为文档说明文档 |

## Non-Goals

- 不改变 package/workspace 文档边界。
- 不改变 Buildr Skill、bootstrap guide 或 bootstrap contract 行为。
- 不新增 CLI 命令。
- 不重写 `openspec/specs/` 的产品契约，只补充分层约束并修正文档引用。
