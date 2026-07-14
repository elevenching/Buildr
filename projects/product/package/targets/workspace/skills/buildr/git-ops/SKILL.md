---
name: git-ops
description: 用户表达提交、推送、拉取、pull、合并、merge、rebase、checkout、switch、reset、cherry-pick、revert、stash、发布、删除分支等单项 Git 意图，或 Git 操作存在授权、提交范围、amend、远端改写、工作区转换、分支删除等歧义时使用。用于统一 Git 协作约定和安全默认行为，而不是完整任务结束编排。
---

# Git Ops Skill

本 Skill 处理 Git 协作约定、意图消歧和安全默认行为。它不讲解 Git 命令用法，也不替代项目或服务规则中的构建、测试、发布要求。

## 意图消歧

- “提交”或 `commit` 只表示创建 commit，不表示 push。
- “推送”或 `push` 只表示推送已有提交；如果没有可推送提交，先说明状态，不自动创建 commit。
- “提交并推送”表示 commit + push。
- 完整“收尾”、完成任务或自动完成归档集成的意图由 `task-finish` Skill 编排；本 Skill 只处理单项 Git 意图和其安全策略。
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
- 项目要求的完整验证应绑定所有 rebase、冲突解决和内容修改结束后的最终候选 Git tree。
- rebase 前后必须比较最终候选 Git tree；rebase、冲突解决、amend 中的内容调整或其他操作改变已验证 tree 时，原验证结果失效，集成前重新运行受影响的验证。
- commit 只记录相同内容、目标分支集成后保持相同 tree 或 push 只传输已有提交时，复用已有验证结果，不因 checkout、commit hash 或分支名称改变而重复运行相同验证。
- 目标分支默认只通过 fast-forward 集成任务分支；除非用户当前轮次或项目规则明确要求，不创建 merge commit。
- 已推送或多人共享的任务分支不自动 rebase 或 force push。
- rebase 冲突需要业务或语义选择时，停止并报告冲突，等待用户确认。

## 工作区转换后的 Buildr 环境检查

Agent 通过本 Skill 成功改变已检出工作区内容，且工作区已经离开冲突或中断状态后，执行一次 Buildr 环境检查。触发范围包括产生实际 tree 转换的 `pull`、`merge`、`rebase`、`checkout`、`switch`、`reset`、`cherry-pick`、`revert`、`stash apply` 和 `stash pop`。

`fetch`、`push` 和普通 `commit` 不改变已检出内容，不触发该检查；Git 操作失败、仍处于未解决冲突状态或命令没有产生 tree 转换时也不触发。

检查步骤：

1. 从 Git 操作所在目录逐层向上查找最近的 `.buildr/workspace.yml`。找不到时视为不在已初始化 Buildr workspace 中，不执行 Buildr 检查。
2. 使用当前 Agent 对应的受支持 adapter，在 workspace root 运行 `buildr doctor --agent <agent> --target <workspace-root> --json`。不得省略 `--agent`，也不得把 Git 仓库根直接当作 Buildr workspace root。
3. doctor 无需用户处理时，不提醒用户执行 `render` 或 `sync`。
4. doctor 报告问题时，说明这是当前环境状态，不把既有问题错误归因于刚完成的 Git 操作；按 Rules、Skills、Commands、Components、Contributions 和 Agent runtime 分类汇总，并优先采用 doctor 指向的可执行下一步。
5. doctor 指出 workspace sync 是合适修复动作时，询问用户是否由 Agent 立即同步当前 workspace 和 Agent runtime；同时给出 `buildr sync <agent> --target <workspace-root>` 作为手动同步备选，面向用户时必须把占位符替换为已解析的实际值并正确引用路径，用户确认前不得执行 sync。
6. 用户确认后，调用 Buildr Skill 执行 `buildr sync <agent> --target <workspace-root>`，并使用 sync 的最终 doctor 或追加 doctor 验证结果；不得把手动命令作为默认处理方式要求用户代为执行。
7. Commands、Components、CLI 或其他不能由 sync 正确修复的问题，按对应 Buildr 生命周期询问并在取得授权后由 Agent 执行可完成的动作。只有用户选择手动方式，或 Agent 因工具不可用、权限、登录态、外部环境等原因无法完成时，才提供手动步骤并说明原因；用户选择手动后不假设操作成功，在用户报告完成且 Agent 可以执行 doctor 时再次验证。

如果当前 Agent 无法匹配受支持 adapter，或 doctor 无法执行，报告环境状态尚未确认及具体原因，不猜测 runtime 已同步；此时可提供对应 doctor 命令作为手动兜底。当前 session 是否重新发现新资产由 Agent runtime 决定，不由 Buildr 保证。

该检查点由 Agent 工作流触发，不安装或维护 Git hook、daemon、文件 watcher 或定时任务。用户或其他程序绕过 Agent Skill 直接执行 Git 时，Buildr 不声称能够即时感知；后续进入 Buildr 工作流时由基线 doctor 兜底。

## 远端默认行为

- push 前确认目标分支和待推送提交。
- 不对受保护分支 force push。
- 不自动创建或删除远端分支，除非用户意图明确。
- 涉及 API、SDK 或公共契约模块时，未完成项目或服务要求的发布/验证前不 push。

## 失败处理

检查、测试、OpenSpec 校验、发布、rebase、merge、push 或分支删除失败时：

- 停止当前 Git 操作。
- 说明失败阶段、失败命令和阻塞原因。
- 给出可选处理路径。
- 等用户确认后再继续。
