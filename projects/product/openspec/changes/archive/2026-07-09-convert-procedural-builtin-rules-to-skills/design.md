## Context

Buildr 当前随包内置能力分为 required Rule、optional Rules、optional Skills 和 Commands。`buildr-core` 是唯一 required Rule；`buildr-task-triage`、`buildr-openspec`、`buildr-worktree` 和 `buildr-git` 是 optional Rules；OpenSpec explore/propose/apply/sync/archive 已经以 workspace Skills 形式发布。

最新 Core 原则已经把 Rule 与 Skill 的边界收紧：

- Rule 解释“是什么”、基本模型、长期原则和硬边界。
- Skill 描述“做什么”和“怎么做”。
- 一旦规则需要按任务、风险或场景判断是否适用，应优先沉淀为 Skill。

这使当前 optional Rules 出现职责漂移：它们大多带有“适用条件、步骤、命令、完成标准”，实质上是任务 playbook，而不是必须常驻的 ontology 或 invariant。

## Goals / Non-Goals

**Goals:**

- 把产品随包内置能力调整为 `core rule + procedural skills` 的清晰分层。
- 为每个现有 optional procedural Rule 给出迁移去向和保留边界。
- 更新 Buildr Skill、bootstrap guide、current state、package check 和产品验证，使 Agent 能通过 Skills 找到这些流程。

**Non-Goals:**

- 不设计通用 Rule-to-Skill 自动迁移命令。
- 不为旧 optional procedural Rules 设计外部兼容迁移；Buildr 仍处于 MVP 自举阶段，本次直接调整随包 baseline 和自举 workspace 源资产。
- 不改变用户自定义 Rules 和 Skills 的源资产模型。
- 不改变 Codex/Claude Code adapter 的基础渲染模型。

## Decisions

### 1. `buildr-core` 保留为唯一 required Rule

`buildr-core` 保留 Buildr 的基础模型、资产边界、术语原则和硬边界。它仍由 root `AGENTS.md` required block 引用，作为 Agent 进入 workspace 后必须读取的最小常驻上下文。

替代方案是把 `core` 也拆成多个更小 Rule。暂不采用，因为 required block 需要一个稳定入口，而且 Core 当前主要表达 ontology 和 invariant。

### 2. `buildr-openspec` 不再作为 optional Rule 发布

OpenSpec 的 explore/propose/apply/sync/archive 已经有对应 Skills，且这些 Skill 的触发条件和正文更适合承载 workflow。`buildr-openspec` 不再保留为 Rule，也不迁移为 Buildr 自有总 Skill；OpenSpec 任务由已有 `openspec-*` Skills 通过自身 description 匹配。

替代方案是保留 `buildr-openspec` 作为索引 Rule，或新增 `openspec-workflow` 总 Skill。暂不采用，因为 Skill description 已经承担意图匹配职责，Buildr 不应复制远程发布版 OpenSpec Skills 的 workflow 手册。

### 3. `buildr-worktree` 转为 `task-worktree` Skill

worktree 文档本质是任务 worktree 生命周期策略。它应转为 `task-worktree` Skill，用于用户要求代码开发、修 bug、实现功能、运行构建或测试、多仓协作、隔离任务分支，或要求对已上线、已归档、已收尾的任务清理 worktree/change-id/任务分支时触发。

`task-worktree` 只负责 worktree 的创建、使用、保留和清理边界；不负责任务语义分流，不写 Git 命令教程，也不通过正文引用其他 Rule/Skill。Skill 之间的使用由 Agent 基于意图匹配完成。

替代方案是把 worktree 流程并入 Buildr Skill。暂不采用，因为 Buildr Skill 是资产维护入口，过多承载代码开发流程会让产品入口 Skill 变重。

### 4. `buildr-task-triage` 转为 `task-triage` Skill

任务路径判定表、前置检查格式和语义影响判断属于 Skill。`task-triage` 的 description 必须面向用户任务意图，例如修 bug、实现或调整功能、改需求、重构、优化、补文档、补测试、调整 API/契约/权限/状态流/数据语义，或询问某项改动是否需要更新 spec、创建 change、只改代码。

`task-triage` 的正文输出可以使用 `code-only`、`spec-maintenance` 和 `change-flow`，但这些内部路径名不应成为 Skill 触发条件。该 Skill 不引用其他 Rule/Skill，只说明任务意图识别、语义影响判断和后续处理方式。

### 5. `buildr-git` 转为 `git-ops` Skill

Git 文档的价值不是讲解 Git 命令用法，而是统一 Git 协作约定和安全默认行为。`git-ops` 应在用户表达提交、commit、推送、push、提交并推送、合并、merge、rebase、发布、release、收尾、删除分支、清理远端分支等 Git 相关意图，或 Git 操作存在授权、提交范围、amend、远端改写、分支删除等歧义时触发。

`git-ops` 正文聚焦意图消歧、授权边界、commit 范围、amend 策略、提交前摘要、远端默认行为和失败处理。它不列 Git 命令教程；LLM 已具备通用 Git 操作能力，Skill 只补充 Buildr 的协作策略。

### 6. MVP 阶段直接删除旧 optional procedural Rules

Buildr 仍处于 MVP 自举阶段，本次不提供旧 optional procedural Rules 的兼容迁移，不实现 superseded 提示，也不为旧 Rule id 写 doctor/update check 特判。实现时直接从 package baseline 和自举 workspace 源资产中移除旧 Rule 声明和文件，并新增对应 Skills。

## Risks / Trade-offs

- [Risk] Agent 依赖旧 optional Rule 路径，迁移后找不到流程。→ Mitigation：删除归档外活动引用，Buildr Skill、bootstrap guide 和 current state 改为说明新 Skill 模型。
- [Risk] `git-ops` 写成 Git 命令教程，降低 Skill 价值。→ Mitigation：正文只写意图消歧、授权边界、提交策略、远端安全默认值和失败处理。
- [Risk] Skill 数量变多导致 routing 分散。→ Mitigation：Buildr Skill 保持资产维护入口，procedural Skills 使用清晰 description，并避免重复承载同一 workflow。
- [Risk] Skill 正文继续显式引用其他 Rule/Skill，形成新的流程索引。→ Mitigation：Skill 正文只描述自身职责、边界和默认策略；跨 Skill 使用交给 Agent 的意图匹配。

## Migration Plan

1. 更新 package manifest：移除 procedural optional Rules，新增 `task-triage`、`task-worktree` 和 `git-ops` builtin Skills。
2. 更新 workspace baseline：`rules/manifest.yml` 只登记保留 Rules，`skills/manifest.yml` 登记新的 procedural Skills。
3. 删除 `buildr-openspec` Rule 和归档外活动引用。
4. 更新 Buildr Skill、bootstrap guide、README/current state 和产品文档中的 Rule/Skill 分层说明。
5. 更新 CLI 和验证脚本中对 baseline 文件、package check 和验证入口的断言。
6. 运行产品验证：`projects/product/buildr package check`、产品 MVP 验证入口和 `openspec validate --all --strict`。
