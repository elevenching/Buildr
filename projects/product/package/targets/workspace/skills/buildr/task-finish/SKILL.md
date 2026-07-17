---
name: task-finish
description: 用户在 task worktree 中要求“收尾”、完成任务、自动收尾，或要求自动完成已验证 change 的归档、提交、集成、推送和本地清理时使用。
---

# Task Finish Skill

本 Skill 是 Buildr 自有的任务收尾编排层。它在不修改外部 OpenSpec Skills 的前提下，组合项目验证、OpenSpec、Git Ops 和 Task Worktree 契约，把已完成任务安全推进到目标分支已推送、本地 task worktree 已清理的状态。

## “收尾”的授权

用户在当前轮次明确说“收尾”、完成任务或自动收尾，表示一次性授权以下常规动作：

- 对已完成的 OpenSpec change 默认同步 delta specs 并归档。
- 修复可证明由 OpenSpec archive/specs sync 产生的 Markdown 文件末尾多余空行。
- 提交当前任务直接相关改动。
- fetch 已确认远端；对本地未推送任务分支执行无语义冲突的必要 rebase。
- fast-forward-only 集成到已确认目标分支并普通 push 该目标分支。
- 迁移仍指向待删 worktree 的本机入口，删除本地 task worktree 和本地任务分支。

该授权只在当前轮次有效。执行 Git 写操作前，必须向用户一次性说明任务/change、提交范围、commit message、目标分支、远端、集成方式和本地清理范围；上下文清楚时不再逐项等待确认。

“收尾”不授权 force push、merge commit、删除远端任务分支、丢弃改动、改写已推送或共享分支历史，也不授权替用户解决需要业务或语义判断的冲突。出现这些情况时停止并请求对具体动作的明确授权或决策。

## 1. 收尾前置检查

在任何归档、提交、merge、push 或 cleanup 前确认：

- 使用 `git rev-parse --show-toplevel`、`git worktree list --porcelain` 和当前分支解析真实仓库、Buildr workspace root、canonical task worktree 与本地任务分支。
- 当前任务/change、目标分支和远端均唯一可确认；不得根据目录名猜测仓库边界或目标分支。
- task worktree 中的改动都属于当前任务；存在无关 dirty changes 时不 stage、不丢弃，并在破坏性动作前停止。
- 主 workspace 可用于集成且没有未处理改动。
- 如果存在 active OpenSpec change，使用 `openspec status --change <id> --json` 和 apply instructions 确认 artifacts、tasks 与 action context；未完成、blocked 或 workspace planning context 不得自动归档。
- 当前候选内容具备可信的项目验证结果。当前会话没有对应成功结果，或验证后内容已改变时，先运行项目要求的验证。
- 对照用户已经确认的目标、纠正和决策，检查当前 change 的 proposal、design、delta specs 和 tasks、最终实现、Git diff 与验证结果是否语义完整对齐。任务范围内仍有未记录语义、实现偏差或验证缺口时，在资产审查门控前停止收尾并回到修正流程。
- OpenSpec contract sidebar 只证明已记录契约、baseline、canonical specs、active conflict 和同步结果的一致性；它不能替代上述用户决策与实现语义检查，`task-asset-review` 也不重复承担当前 change 完整性判断。

如果此前完整验证失败，收尾前必须确认修复期间已经优先重跑失败项和受影响专项检查，并在候选重新稳定后完成一次新的最终完整验证。不得把仍在修复循环中的专项检查结果当作最终候选验证证据。

多个 change、多个 worktree、多个远端或目标分支无法消歧时停止，不替用户选择。

当前任务包含已完成的 active OpenSpec change 时：

<!-- buildr:skill-contributions pre-spec-sync -->

1. 使用外部可用的 OpenSpec CLI/Skills 评估 delta specs，并采用默认推荐路径同步 canonical specs。不得直接修改 Buildr 随附的 `openspec-*` Skill 源来加入收尾逻辑。

<!-- buildr:skill-contributions post-spec-sync -->

## 2. 任务资产审查门控

当前任务语义完成、canonical specs 同步结果和 contract sidebar 结论可确认、候选 tree 与最终验证证据有效后，且 OpenSpec 归档、提交、集成和 worktree 清理尚未使证据入口消失时，执行以下门控：

1. 只根据当前上下文做轻量资格判断；不得调用工具、重新读取任务文件或加载完整 `task-asset-review`。
2. 检查是否存在至少一个强信号：
   - 用户纠正过 Agent 的工作边界、资产职责、scope 或授权范围；
   - 初始假设被代码、命令、测试或用户反馈推翻；
   - 失败、重试或回退形成了明确根因和复用价值；
   - 同一搜索、工具、修复或验证出现无效重复或明显 token 浪费；
   - 形成新的长期工作边界、约束或可复用流程；
   - Agent 已明确发现具体 Rule 或 Skill 候选。
3. 没有强信号时静默跳过完整审查并继续收尾，不为形式完整增加任务复盘。
4. 命中强信号时调用 `task-asset-review`，或复用当前候选 tree 已有的有效审查结果。完整审查只读，不重新判断当前 change 是否完整，不重复验证，不修改候选 tree。
5. `task-asset-review` 已被用户卸载、当前 runtime 不可发现、证据不足或审查失败时，记录跳过或降级原因并继续正常收尾；审查成功不是 archive、commit、rebase、merge、push 或 cleanup 的新增前置条件。
6. 没有重要质量发现或合格候选时静默继续。有发现时只在最终收尾报告中展示重要执行质量摘要、Rule/Skill 候选和可独立引用的证据胶囊，不中断收尾等待确认，也不自动写入组织资产；“收尾”不构成 Rule 或 Skill 写入授权。

## 3. OpenSpec 归档与格式收敛

当前任务包含已完成的 active OpenSpec change 时：

1. 使用外部可用的 OpenSpec CLI/Skills 归档 change。
2. 归档后立即运行 `git diff --check`。
3. 只有全部诊断都是本次 archive/specs sync 修改的 OpenSpec Markdown 文件中的 `new blank line at EOF` 时，才自动删除多余结尾空白行，使每个文件恰好以一个换行结束。
4. 自动规范后重新运行 `git diff --check` 和当前 planning root 的 OpenSpec strict validation。
5. 任何其他 whitespace error、非 OpenSpec 文件或无法确认来源的问题都停止自动修复并报告。

归档改变 specs/tree，但不等于产品实现需要重复完整 E2E。只运行归档直接影响的格式、OpenSpec 或项目专项检查。

## 4. 提交与验证 tree

- 按 Git Ops 提交范围检查，只 stage 当前任务文件；提交前展示变更摘要和 commit message。
- 提交只记录已检查内容；commit hook 或提交后状态若表明内容改变，重新判断验证。
- 提交后记录最终候选 Git tree identity，例如 `git rev-parse HEAD^{tree}`。
- fetch 最新目标分支。仅当本地未推送任务分支发生分叉时执行必要 rebase；已推送或共享分支不自动改写。
- rebase 后再次读取 `HEAD^{tree}` 并与已验证 tree 比较：
  - tree 相同：复用已有验证结果，不因 commit hash、parent、checkout 或分支名称变化重复 E2E。
  - tree 不同：在集成前重新运行受影响的验证；验证失败时停止 merge、push 和 cleanup。
- 成功 rebase 后若最终已检出内容实际变化，复用 Git Ops 的“工作区转换后的 Buildr 环境检查”；doctor 指出 sync 时复用同步询问、Agent 执行和手动兜底边界，用户确认前不执行 sync。
- rebase 冲突只有在能机械保持双方既有语义时才可继续；需要业务选择时停止。
- 验证命令仍返回 session、cell、process id 或运行中状态时，继续 wait、poll 或 resume 同一进程；暂时无输出不得启动第二个相同验证。

## 5. 集成与推送

在验证证据仍有效且目标 workspace 干净时：

1. 从目标分支所在的保留 workspace 执行 fast-forward-only 集成；不创建 merge commit。
2. 确认集成后的 tree 与任务分支一致。
3. fast-forward-only 集成完成后，在目标 workspace 复用 Git Ops 的“工作区转换后的 Buildr 环境检查”；doctor 无需处理时不询问同步，发现可由 sync 修复的问题时询问用户，确认后由 Agent 执行并验证，手动命令只作备选。
4. 普通 push 已确认的目标分支，并确认远端目标 ref 指向预期提交。
5. fast-forward、普通 push 和 checkout 切换不改变候选产品 tree，不在主开发分支重复相同产品 E2E；其中目标 workspace 的 fast-forward 已改变其已检出内容，仍须完成上一步环境检查。

push 被拒绝或远端状态变化时停止；不得改用 force push。

## 6. 本地清理

只有全部条件成立才清理：

- OpenSpec change 已归档或任务不需要 OpenSpec。
- 目标分支包含任务提交且远端目标分支已推送。
- task worktree 干净，没有未提交或未处理内容。
- 本地任务分支不再承载未集成提交。

清理步骤：

1. 检查本机命令、symlink 或开发入口是否指向待删 worktree；如有，先按项目规则迁移到仍保留的 checkout，并完成该入口要求的最小验证。
2. 将后续命令的工作目录切换到主 workspace 或其他保留目录，不在即将删除的目录中执行清理。
3. 删除本地 task worktree，再删除已经合入的本地任务分支。
4. 不删除远端任务分支，除非用户另行明确授权。
5. 检查 worktree 列表、分支包含关系、目标分支远端状态和主 workspace status。

## 失败处理

任一步骤失败时：

- 停止尚未执行的 archive、commit、rebase、merge、push 或 cleanup。
- 不回滚已经成功的远端操作，不隐藏部分完成状态。
- 报告失败阶段、已完成动作、当前 Git/OpenSpec 状态和下一步。
- 保留仍可能用于修复的 task worktree 和本地任务分支。
