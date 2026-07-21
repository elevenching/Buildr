---
name: git-ops
description: 用户表达提交、推送、拉取、pull、合并、merge、rebase、checkout、switch、reset、cherry-pick、revert、stash、发布、删除分支等单项 Git 意图，或 Git 操作存在授权、提交范围、amend、远端改写、工作区转换、分支删除等歧义时使用。用于统一 Git 协作约定和安全默认行为，而不是完整任务结束编排。
---

# Git Ops Skill

本 Skill 是 `buildr.git-single-operation/v1`、`buildr.git-task-integration/v1` 和 `buildr.git-workspace-update/v1` 的默认 provider，处理 Git 协作约定、意图消歧和安全默认行为。它不讲解 Git 命令用法，不执行项目 Candidate 验证，也不替代项目或服务规则中的构建、测试、发布要求。

## 意图消歧

- “提交”或 `commit` 只表示创建 commit，不表示 push。
- “推送”或 `push` 只表示推送已有提交；如果没有可推送提交，先说明状态，不自动创建 commit。
- “提交并推送”表示 commit + push。
- 完整“收尾”、完成任务或自动完成归档集成的意图由 `buildr.task-finish/v1` selected provider 编排；本 Skill 只处理单项 Git 意图和其安全策略。
- “发布”不自动等于 push；需要结合项目发布规则和用户明确动作。

## 授权边界

- 不依据历史对话里的提交、推送或清理授权自动执行新一轮 Git 操作，除非用户明确声明后续自动提交推送。
- 没有用户当前轮次明确授权，不执行 commit、push、merge、删除分支、删除远端分支、force push 或其他会改变远端状态的操作。
- 会改写提交历史的 amend、rebase、reset 或 force-with-lease，必须确认提交未推送，或取得用户明确授权。
- 远端 push 被拒绝时停止说明原因，不自动改用 force push。
- 新建开发任务本地分支时，除非用户指定，否则使用 `tasks/<task-id>`。

## Commit 范围

- commit 只包含当前任务直接相关变更。
- 工作区存在无关改动时，不 stage，不回滚，只说明已忽略。
- 执行 commit 前给出变更摘要：涉及文件、变更性质、排除的无关改动、commit message。
- 如果用户当前轮次已明确要求提交，且变更范围在上下文中清楚匹配当前任务，可以直接提交，不重复打断。

## Commit 信息

默认格式：`<type>(<scope>): <subject>`，其中 scope 可选。

- type 根据实际变更选择：`feat` 新功能，`fix` 修复，`docs` 文档，`style` 格式，`refactor` 重构，`perf` 性能，`test` 测试，`build` 构建或依赖，`ci` CI，`chore` 其他维护，`revert` 撤销。
- scope 仅在范围明确时使用，不猜测。
- subject 简洁描述实际变更；无需补充信息时只写一行。
- 正文可选，仅说明变更动机和行为差异；破坏性变更使用 `BREAKING CHANGE:`。
- 提交信息语言遵循 Buildr Core 和当前 scope 更具体的 Project、Service 或仓库约定。

## Amend 策略

- 同一任务的多次直接相关修正默认合并为一次提交。
- 同一任务已有本地未推送提交时，后续直接相关修正默认使用 amend。
- 已推送提交不自动 amend；需要用户明确选择新提交、revert，或允许安全的历史改写方式。

## 分支集成策略

- 集成前先 fetch 最新目标分支；本地未推送任务分支发生分叉时，默认 rebase 到最新目标分支。
- rebase、merge、fast-forward 或其他集成动作必须比较输入与最终 candidate content identity，并返回前后 identity、tree 等价性信号和 `treeChanged`；不得把相同 commit、branch 或命令成功当作内容等价证据。
- tree 等价性信号只描述 Git 操作效果。Candidate evidence 是否有效、是否复用或重跑验证，由 selected task-verification provider 或其 consumer 根据当前 candidate identity 决定。
- 目标分支默认只通过 fast-forward 集成任务分支；除非用户当前轮次或项目规则明确要求，不创建 merge commit。
- 已推送或多人共享的任务分支不自动 rebase 或 force push。
- rebase 冲突需要业务或语义选择时，停止并报告冲突，等待用户确认。

## Workspace tree transition result

本 provider 对每次 Git 操作返回 `treeChanged` 结果证据，并在发生 tree 转换时记录操作、before/after commit 或 content identity、冲突状态与当前仓库边界。

`treeChanged: true` 时，consumer 或 orchestrator 必须直接遵守 required Core workspace-transition invariant，并通过产品入口 Buildr Skill 执行当前 Agent 的 doctor、sync 询问和修复边界；本 provider 不拥有或复制该 Buildr 操作手册。

`fetch`、`push` 和普通 `commit` 不改变已检出内容，应返回 `treeChanged: false`。Git 操作失败、仍处于未解决冲突状态或命令没有产生 tree 转换时，不得报告成功的 tree transition。
## 远端默认行为

- push 前确认目标分支和待推送提交。
- 不对受保护分支 force push。
- 不自动创建或删除远端分支，除非用户意图明确。
- 涉及 API、SDK 或公共契约模块时，未完成项目或服务要求的发布/验证前不 push。

## 失败处理

Git 状态检查、commit、rebase、merge、push 或分支删除失败时：

- 停止当前 Git 操作。
- 说明失败阶段、失败命令和阻塞原因。
- 给出可选处理路径。
- 等用户确认后再继续。
