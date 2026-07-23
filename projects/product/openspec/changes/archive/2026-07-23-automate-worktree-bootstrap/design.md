## Context

Buildr 目前只通过 `task-worktree`、Buildr Skill 与 Core 文本约束要求 Agent 在新 checkout 后运行 doctor。`git worktree add` 本身不经过 Buildr，package verification 也只检查这些说明仍然存在，因此无法证明某次创建真的完成了环境诊断。实测从当前 `dev` 创建新 worktree 后，doctor 会报告 `runtime.codex_stale`；手动执行 `buildr sync codex --target <worktree>` 可以在 Git tree 保持干净的情况下收敛。

这个问题横跨 Git checkout、Buildr workspace 诊断、sync mutation、runtime 投射、CLI JSON 契约和随包 Skill。解决方案必须继续遵守“不与 Agent 抢活儿”：Agent 决定任务、分支和起点，Buildr 只执行明确参数化的环境生命周期。

## Goals / Non-Goals

**Goals:**

- 提供一次命令完成 canonical task worktree 创建或幂等复用，并确定性运行目标 checkout doctor。
- 对严格可证明为 workspace sync 可安全收敛的问题自动执行 sync，再以最终 doctor 判定结果。
- 以稳定 JSON 返回 created/reused、treeChanged、doctor、sync 决策与阻塞证据，供 Agent 和后续 capability consumer 使用。
- 对路径占用、branch/repository 不匹配、dirty checkout、mutation、非 sync 问题和 sync 失败保持 fail-closed。

**Non-Goals:**

- 不替 Agent 理解任务、选择是否需要 worktree、生成 task id、决定 branch/start point 或处理 Git 分叉冲突。
- 不感知绕过 Buildr 执行的任意 Git 操作，不安装 Git hook、daemon 或 watcher。
- 不自动安装 Commands、恢复/卸载 Components、解决 optional builtin 决策、丢弃改动或清理失败 worktree。
- 不改变 rebase、merge、target fast-forward 等一般 workspace transition 的既有询问边界。

## Decisions

### 1. 新增 `buildr worktree create`，而不是继续增加 Skill 文本

命令形态为：

```text
buildr worktree create <task-id> --agent <agent> --branch <branch> [--start-point <ref>] [--target <workspace>] [--json]
```

`--target` 是 Buildr workspace root；canonical 路径固定为 `<target>/.worktrees/<task-id>`。`task-id`、branch 和 start point 由 Agent 明确提供，产品不推断任务语义。相比新增一个只做 post-create 的 bootstrap 命令，create wrapper 能保证成功创建与 doctor 处于同一个产品调用链；外部直接创建仍只能由后续基线 doctor 兜底。

### 2. Git 操作使用参数数组，并在创建前完成只读预检

产品通过 `git rev-parse --show-toplevel`、`git worktree list --porcelain`、branch/ref 检查确认仓库、目标路径和复用身份。新 branch 不存在时使用 `git worktree add -b <branch> <path> <start-point>`；branch 已存在且未被其他 worktree 占用时使用 `git worktree add <path> <branch>`。已注册的 canonical path 只有 repository 与 branch 都匹配时才返回 `reused`，不发生 tree transition，也不重复 bootstrap。

不拼接 shell 字符串。目标被普通文件/目录占用、branch 已在其他 worktree checkout、task id 逃逸 canonical root、Git 状态不明时零写入。

### 3. 自动 sync 采用封闭 allowlist，而不是把任意 doctor repairPlan 当命令执行

创建成功后运行当前产品入口的 `doctor --agent <agent> --target <worktree> --json`。只有同时满足以下条件才自动调用现有 `syncRuntime`：

- target 是本次刚创建的 canonical checkout，不是复用 checkout；
- workspace initialized、`workspaceValid: true`、mutation 未 blocked；
- checkout 在 doctor 后仍 clean，HEAD/branch 与创建结果一致；
- 全部 actionable findings 的 code 均属于当前 Agent runtime projection 缺失/过期的封闭 allowlist；
- 没有 error、Command、Component、builtin ownership、capability graph、workspace metadata 或其他 source decision finding。

首版 allowlist 只接受 `runtime.<agent-result-key>_stale` / 对应当前 adapter 的 runtime stale code，不执行 doctor 返回的任意 command。这样既覆盖新 worktree 不继承 ignored runtime 的稳定问题，也避免把 future finding 错当成安全修复。

### 4. sync 后重新读取 Git 与 doctor，失败保留现场

sync 复用现有事务化 source/runtime reconcile，完成后再次验证 target 仍为同一 worktree、branch/HEAD 未变且 Git clean，并运行最终 doctor。任一条件失败时命令返回非零和结构化 blocked result，但保留已经创建的 worktree，便于 Agent检查；不得自动删除或回滚未知 workspace mutation。

### 5. JSON 是主契约，人类输出是同一结果的摘要

结果至少包含 `schemaVersion`、workspace/repository/task/branch/path、`state: created|reused|blocked`、`treeChanged`、`bootstrap.doctorBefore`、`bootstrap.sync: skipped|applied|blocked`、`bootstrap.doctorAfter` 和 `nextActions`。JSON 模式下所有产品/doctor/sync 子步骤不得污染 stdout；人类模式按相同对象打印简洁结果。

## Risks / Trade-offs

- **[现有 sync 输出与 `process.exitCode` 面向 CLI，不便内嵌]** → 抽取可返回结果的内部 doctor/sync orchestration，或在受控子进程中捕获 stdout/stderr；不得通过全局 stdout 拼装 JSON。
- **[runtime finding code 随 adapter 演进]** → 从 selected adapter 的 checker result key 构造并测试 allowlist；未知 code 一律 blocked。
- **[创建成功但 bootstrap 失败留下 worktree]** → 明确返回 `created + blocked`，保留现场和 cleanup nextAction，避免删除可能已经发生 mutation 的目录。
- **[自动 sync 可能更新 Buildr 源 baseline]** → 仅允许 clean、刚创建、当前 ref 一致且 preflight 无用户决策；sync 后必须再次 clean，否则视为 blocked。
- **[命令扩大 Buildr 对 Git 的职责]** → 只封装 canonical placement 与环境 bootstrap，不承担 merge/rebase/push 等协作策略；task-worktree capability 仍由 Agent 决定何时调用。
