## Context

Buildr 当前把 OpenSpec 归档、Git 协作和 task worktree 生命周期拆分在不同 Skills 中。分层本身合理，但没有一个 Buildr 自有入口负责在任务已经实现并验证后串联这些能力。现有 `git-ops` 把“收尾”解释为只检查并等待逐项授权，导致用户需要重复表达归档、提交、合并、推送和清理。

OpenSpec 是外部 SDD 框架，其 CLI 和 `openspec-*` Skills 会随外部版本更新。Buildr 的收尾增强必须像 sidebar 一样位于外部框架之外，不能直接修改外部 Skill。另一个反复出现的问题是 `openspec archive` 同步 canonical specs 后可能在 Markdown 文件末尾增加空白行，`git diff --check` 会报告 `new blank line at EOF`。

## Goals / Non-Goals

**Goals:**

- 用一句“收尾”触发从已验证 task worktree 到已推送目标分支和本地清理完成的常规路径。
- 将“收尾”定义为范围明确的一次性授权，减少无意义的逐步确认。
- 复用最终候选 tree 的验证证据，只在内容改变时重验受影响部分。
- 在 OpenSpec 归档后自动处理受控的 EOF 空白行问题。
- 保持外部 OpenSpec CLI 和 Skills 可独立更新。

**Non-Goals:**

- 不新增 Buildr CLI 命令或持久化验证结果数据库。
- 不自动 force push、创建 merge commit、删除远端任务分支或丢弃用户改动。
- 不自动解决需要业务或语义判断的冲突。
- 不把 task closeout 操作手册加入 required Core Rule。

## Decisions

### 1. 新增 Buildr 自有 `task-finish` 编排 Skill

`task-finish` 独占“收尾、完成任务、自动收尾”等完整任务结束意图。它调用或遵循现有 OpenSpec、Git Ops 和 Task Worktree 契约，但不复制或修改外部 `openspec-*` Skill 源。

`git-ops` 继续处理单独的 commit、merge、rebase、push、release 和分支操作，并从 description 与意图消歧中移除完整“收尾”路由。`task-worktree` 继续维护 placement、retention 和 cleanup 条件，不承担 Git 授权策略。

### 2. “收尾”是受限的一次性授权

用户在当前轮次明确说“收尾”时，授权范围包括：

1. 识别当前 task/change、canonical worktree、目标分支和远端。
2. 补齐缺失的项目验证，或复用当前最终候选内容已有的成功验证。
3. 对完成的 OpenSpec change 默认同步 delta specs 并归档。
4. 修复受控的 archive EOF 空白行并运行相关校验。
5. 提交当前任务范围、fetch、对本地未推送分支执行无语义冲突的必要 rebase。
6. fast-forward-only 集成、推送目标分支。
7. 迁移仍指向 task worktree 的本机入口，删除本地 worktree 和本地任务分支。

该授权不包含 force push、merge commit、远端任务分支删除、丢弃无关/未提交内容、共享分支历史改写或语义冲突决策。遇到这些条件立即暂停并请求用户决策。

### 3. 用 Git tree identity 管理验证证据

收尾开始时先确认实现与既有验证对应当前候选内容。归档会改变 specs/tree，因此归档后只运行受影响的 OpenSpec、格式或项目专项检查。提交只记录相同内容。

fetch/rebase 前记录候选 tree identity；rebase 后比较新的 tree。tree 相同时复用验证证据，tree 不同时在集成前运行受影响的验证。fast-forward、push 和清理不改变 tree，不重复产品 E2E。

### 4. EOF 修复只覆盖可证明安全的 archive 产物

归档或 specs sync 后运行 `git diff --check`。只有当全部问题都是 OpenSpec 本次修改的 Markdown 文件中的 `new blank line at EOF` 时，才自动把文件结尾规范为恰好一个换行，并重新运行 `git diff --check` 与 OpenSpec strict validation。

任何其他 whitespace error、非 OpenSpec 文件或无法确认来源的问题都暂停。该机制放在 `task-finish`，不放进 Core，也不修改 OpenSpec archive 实现。

### 5. 清理必须从保留的 workspace 执行

删除 task worktree 前，Agent 必须确认任务分支已被目标分支包含、目标分支已推送、worktree 干净。本机命令或 symlink 若指向待删 worktree，先按项目规则迁移到保留 checkout 并验证。最后从主 workspace 或其他保留目录执行 `git worktree remove` 和本地任务分支删除。

## Risks / Trade-offs

- [Risk] “收尾”授权范围过大导致意外远端操作。→ 仅允许普通 push 到已确认目标分支，明确排除 force、远端分支删除和 merge commit，并在动作前展示摘要。
- [Risk] Agent 无法确认历史验证是否覆盖当前内容。→ 没有可信证据时自动运行项目要求的验证，不猜测已通过。
- [Risk] EOF 自动修复误改用户文件。→ 仅处理本次 OpenSpec archive/sync 修改的 Markdown，且只处理唯一明确的 EOF 空白行诊断。
- [Risk] 删除当前执行目录导致后续命令失败。→ 清理前切换到保留 workspace，并把清理作为最后一步。
- [Trade-off] 自然语言 Skill 不是中心化事务引擎。→ 通过严格状态机、package 文本契约和 E2E 防回退；未来软件系统可再提供确定性事务执行器。

## Migration Plan

1. 发布 `task-finish`，更新 manifests、Buildr Skill 路由和 package verification。
2. 从 `git-ops` description 与正文移除完整“收尾”的默认等待语义。
3. 更新 canonical specs 和文档，修正 rebase 验证冲突。
4. 通过 Buildr update/sync 将新 Skill 投射到 workspace 和 Agent runtime。

## Open Questions

无。
