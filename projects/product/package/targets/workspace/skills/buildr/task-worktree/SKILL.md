---
name: task-worktree
description: 用户要求代码开发、修 bug、实现功能、运行构建或测试、多仓协作、隔离任务分支，或清理已上线、已归档、已收尾任务的 worktree/change-id/任务分支时使用。用于管理任务 worktree 的创建、使用、保留和清理边界。
---

# Task Worktree Skill

本 Skill 管理任务 worktree 生命周期：是否创建、如何隔离开发、何时保留，以及何时进入清理检查。它不判断业务语义是否需要 OpenSpec change，也不提供 Git 命令教程。

用户要求完整“收尾”或自动完成归档、集成、推送和清理时，由 `task-finish` Skill 编排；本 Skill 只提供 worktree placement、retention 和 cleanup 条件。

## 创建或复用 worktree

代码开发、修 bug、实现功能、运行构建测试、多仓协作、需要隔离任务分支或长期任务上下文时，优先使用任务 worktree。task triage 选择 OpenSpec change-flow 且预计进入这些动作时，必须在 propose 和创建 change artifacts 前先完成 worktree 决策。

创建或复用前先确认：

- 当前 Buildr workspace 根；task worktree 统一放在 `<workspace-root>/.worktrees/<task-id>`，不按当前 Git 主 worktree 或系统临时目录推导位置。
- 实际 Git 仓库边界，以 `git rev-parse --show-toplevel` 为准。
- 当前任务标识，可来自 change id、用户指定任务名，或当前工作单元。
- 每个独立 Git 仓库最多一个任务 worktree。
- 同一任务优先复用已有 task worktree，不重复创建。
- 多仓任务为每个独立仓库使用带 repo 标识的 task id，避免 `.worktrees/` 下路径碰撞。

执行创建或复用前，必须先明确告诉用户：

- 当前采用 task worktree，以及是创建还是复用。
- workspace 根、task id、canonical worktree 路径和任务分支。
- 如同时使用 OpenSpec，change id、change 路径和当前 OpenSpec 动作。

canonical 位置不可用、已被其他任务占用或无法确认 workspace 根时，停止并说明问题；不得静默回退到 `/tmp` 或其他任意目录。

一旦采用 task worktree，artifacts、实现和合并前候选验证都只能写入该 worktree；artifacts 包括 proposal、design、specs 和 tasks。不得在原始主工作区保留同一 change 的第二份 artifacts，也不得从未合并 task checkout 向主自举 workspace 执行 sync。

新 worktree checkout 完成后，复用 Git Ops 的“工作区转换后的 Buildr 环境检查”：只有新 checkout 实际位于包含 `.buildr/workspace.yml` 的已初始化 Buildr workspace 中，才针对当前 Agent 和该 workspace root 运行 doctor。doctor 无需处理时不询问同步；发现可由 sync 修复的环境问题时，复用同步询问、Agent 执行和手动兜底边界，用户确认前不执行 sync。复用既有 worktree 且没有发生 tree 转换时，不重复运行该检查。

## 不创建 worktree 的场景

明确只维护 Buildr 源资产、OpenSpec artifacts、规则、Skills、文档、模板、README、AGENTS 等元内容，且不会进入代码实现、构建或测试时，默认在当前 workspace 直接修改，不创建 task worktree。

如果纯元内容任务后来升级为实现任务，必须先创建或复用 canonical task worktree，把已有 artifacts 收敛到该唯一位置并清除原工作区重复副本；确认主工作区没有该任务的开发改动后才能继续。

## 使用边界

- 任务代码改动只在对应 task worktree 中进行。
- 合并前，原始主工作区只用于只读检查、worktree 管理、任务集成或排查；不承载任务 artifacts、代码开发或未合并候选产品的自举安装结果。
- 一个 worktree 同一时间只由一个 Agent 写入。
- workspace 根 `/.worktrees/` 必须由 `.gitignore` 忽略；不把其中内容提交到仓库，也不把任务副本当作 Rules 扫描源。
- 构建、编译和测试命令以当前项目或服务规则为准。

## 保留策略

- 普通开发任务未上线、未归档或未明确收尾前，默认保留 task worktree 和任务分支。
- 同一任务的缺陷、联调问题和需求调整优先继续在原 task worktree 中处理。
- 代码合并、推送、联调、测试通过或验收通过本身不等于可以清理 worktree。

发布 worktree 是用于从既有发布基线制作、验证和推送发布分支的临时环境，不沿用普通开发任务的保守保留策略。满足以下全部条件时，默认删除本地发布 worktree 和已由远端安全承载的本地发布分支：

- 远端发布分支已推送，且远端 ref 与本地候选提交一致。
- 发布 worktree 干净，没有未提交或未处理内容。
- 没有明确的后续本地构建、部署、修复或验证动作。

发布分支推送后仍有明确的本地构建、部署、修复或验证动作时，保留发布 worktree，并向用户说明保留原因和下一项本地动作。发布 worktree 的默认清理不授权删除远端发布分支。

## 验证证据边界

项目要求的完整验证应在所有 rebase、冲突解决和内容修改结束后，对准备集成的最终候选 Git tree 执行。

实现期间采用三级验证门禁：

1. 单任务最小反馈：完成任务组内的普通任务后，只运行语法、类型或与该任务直接相关的小范围检查，不默认运行当前 workspace 或 Project 定义的完整验证入口。
2. 任务组受影响范围验证：共享实现区域、验证入口或失败影响面的任务全部完成后，集中运行一次专项检查，不为组内每个任务机械重复同一检查。
3. 最终候选完整验证：全部实现、自然语言资产、生成资产同步和 review 修订完成后冻结候选，再运行一次项目要求的完整验证。

- 具体检查命令由当前 workspace 或 Project 定义；Buildr 产品仓的 package check、临时 workspace E2E 和产品总验证不是所有用户项目的固定入口。
- 能证明上层验证入口覆盖某项底层检查时，同一候选状态不机械重复该底层检查；无法证明覆盖关系时保留必要检查。
- 高风险安全边界、不可逆迁移或用户明确要求的即时检查不受默认批量节奏限制。
- 完整验证失败后退出候选冻结状态；修复期间优先重跑失败项和受影响专项检查，候选重新稳定后再执行一次最终完整验证。
- 验证命令返回 session、cell、process id 或仍在运行状态时，使用 wait、poll 或 resume 继续同一进程；暂时无输出不得触发相同命令重复启动。

- commit 只记录相同内容、集成后的 tree 与已验证 tree 相同、push 只传输已有提交或 worktree 清理不改变产品内容时，复用已有验证结果；不在主开发分支重复运行相同 E2E。
- rebase、冲突解决、后续编辑或其他操作改变候选 tree 时，原验证结果失效，必须在集成前对新 tree 重新运行受影响的验证。
- 实际自举 workspace 的 sync 是独立的状态变更，不是第二轮产品 E2E；如果执行，按 Buildr Core 运行当前 Agent doctor。CLI update 只更新 Product checkout 或 registry package，不读取 workspace。
- 本机 `buildr` 若指向即将删除的 task worktree，清理前必须切换到仍保留的 checkout，避免留下悬空入口。

## 清理触发

以下表达进入 worktree 清理检查：

- 发布 worktree 已完成远端分支推送和 ref 核对，且没有明确后续本地动作。
- 用户说明任务已上线。
- 用户说明 change 已归档。
- 用户说明任务已收尾或可以清理。
- 用户要求清理指定 worktree、change-id 或任务分支。

## 清理前检查

删除 worktree 或任务分支前，先确认：

- worktree 没有未提交或未处理改动，或用户明确放弃这些改动。
- 任务分支内容已经合入目标分支，或用户明确放弃该分支内容。
- 远端任务分支删除属于远端状态修改，需要用户当前轮次明确授权。
- 清理后检查 worktree 列表和仓库状态。

## Guardrails

- 不在未确认仓库边界时假设目录是否为独立仓库。
- 不在未向用户说明 canonical 路径和分支时创建或切换 task worktree。
- 不在原始主工作区直接承载任务代码开发，除非用户明确要求。
- 不在实现型 OpenSpec change 创建 artifacts 后才延迟决定 worktree，也不保留同一 change 的双份副本。
- 不从未合并 task checkout 更新主自举 workspace。
- 不在用户确认前同步新 worktree runtime，也不把手动命令作为默认处理方式；不为未发生 tree 转换的 worktree 复用重复检查。
- 不因 checkout 或 commit hash 改变而机械重复验证，也不在候选 tree 已改变时沿用旧验证结果。
- 不在每个普通实现任务后机械运行完整验证，也不因运行中进程暂时无输出而重复启动验证。
- 不自动删除仍可能承载后续修复或未合入内容的 worktree。
- 不把 commit、push、merge、rebase、远端分支删除的授权和协作策略写成 worktree 流程。
