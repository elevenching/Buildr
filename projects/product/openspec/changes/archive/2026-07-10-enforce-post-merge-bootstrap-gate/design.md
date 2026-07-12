## Context

Buildr 当前同时维护 Product Project、task worktree 和自举 workspace。现行 spec 要求未合并候选 checkout 直接 update/sync 主自举 workspace；而 `task-worktree` Skill 又要求任务代码只存在于 task worktree。这使主工作区在集成前出现候选安装结果，并让 change artifacts 可能在创建 worktree 前先落入主工作区。

上一版方案把主自举 workspace 检查改成 post-merge gate，但这会在 worktree 已完成完整 E2E、且集成 tree 未变化时重复验证。真正决定验证是否仍有效的是被测内容，而不是 checkout 位置。

## Goals / Non-Goals

**Goals:**

- 在 OpenSpec change 创建前完成是否使用 worktree 的判断。
- 选择 worktree 后，使 artifacts、实现和候选验证只有一个写入位置。
- 将完整验证绑定到最终候选 Git tree，并在相同 tree 集成后复用证据。
- 只在候选 tree 改变时重新运行相关验证。
- 区分产品 E2E 与实际自举 workspace 的日常 update/sync、doctor。

**Non-Goals:**

- 不改变 Git merge/rebase 授权策略。
- 不自动合并任务分支、提交或推送。
- 不为普通用户 workspace 增加新的 CLI 命令。
- 不引入验证结果数据库、签名或远端门禁系统。

## Decisions

### 1. worktree 决策发生在 change 创建之前

task triage 决定是否进入 change-flow；如果预计后续包含代码、构建、测试或长期任务上下文，Agent 必须先创建或复用 task worktree，再在其中执行 `openspec new change`。只有明确的纯元内容维护才可以留在当前 workspace。

若任务在 artifacts 阶段后才升级为代码实现，Agent 必须先把 artifacts 迁入唯一 task worktree，并清除原工作区重复副本后才能继续。不能以“OpenSpec artifacts 是元内容”为理由保留双份 change。

### 2. 候选验证不写主自举 workspace

合并前验证使用临时用户 workspace、task worktree 根或其他隔离目标。未合并 task checkout 不得向主开发工作区执行 update/sync。这样主工作区 status 可以作为隔离门禁，不混入候选安装结果。

### 3. 验证证据绑定最终候选 tree

完整产品验证应在所有 rebase、冲突解决和内容修改结束后，对准备集成的最终候选 tree 执行。commit 只记录相同内容、目标分支以相同 tree 完成集成、push 传输已有提交以及 worktree 清理都不改变被测内容，因此不要求在主开发分支重复同一套 E2E。

如果 rebase、冲突解决、amend 中的内容调整、额外编辑或集成过程使最终 tree 与已验证 tree 不同，原证据失效。Agent 必须在集成前对新 tree 重新运行受影响的验证；不因为 commit hash 改变而机械重验，也不在 tree 已改变时沿用旧结果。

### 4. 自举 workspace 更新不是第二轮产品 E2E

合并后是否把新版本 Buildr 物化到真实自举 workspace，取决于当前 workspace 是否需要消费本次产品资产变更。若执行 update/sync，它是一次独立的 workspace 状态变更，必须按 Buildr Core 运行当前 Agent doctor。该 doctor 证明物化后的 workspace 状态有效，不重复证明已经由候选 E2E 覆盖的产品 tree，也不作为相同 tree 的 commit、merge、push 或 worktree 清理门禁。

本机 `buildr` 若仍指向即将删除的 task worktree，清理前必须把入口切换到仍保留的 checkout；这是避免悬空路径的清理条件，不是重复产品验证。

### 5. 用文本契约和 E2E 防回退

package check 校验 `task-worktree`、`git-ops` Skills 和 Product Project 规则包含决策时机、单写入位置、最终 tree 验证、证据复用与 tree 改变后重验语义。E2E 检查主工作区在 worktree 候选验证期间保持干净，并确保规则不再要求 post-merge 重复 E2E。

## Risks / Trade-offs

- [Risk] Agent 只看到 commit hash 变化就误判需要重验。→ 契约明确比较 tree 内容，commit 元数据和 push 不使证据失效。
- [Risk] rebase 或冲突解决改变内容但仍沿用旧结果。→ `git-ops` 明确要求 tree 改变后在集成前重新验证。
- [Risk] 本机 CLI 指向被清理 worktree。→ 保留现有入口切换检查，但不把它表述为产品 E2E。
- [Trade-off] 不以真实主自举 workspace 作为第二份集成证据。→ 临时 workspace E2E 覆盖产品路径；真实 workspace 只在实际更新时按状态变更运行 doctor。

## Migration Plan

1. 更新 specs、`task-worktree`、`git-ops` Skills、Product Project 规则和 current state。
2. 删除 post-merge 重复验证文本，扩展 package check 与 E2E 的 verified-tree 契约。
3. 当前未合并任务继续只在 task worktree 验证，并确认主 workspace 保持干净。
4. 以后每个实现型 change 在 propose 前创建 task worktree；在最终候选 tree 上完成验证后再集成。

## Open Questions

无。
