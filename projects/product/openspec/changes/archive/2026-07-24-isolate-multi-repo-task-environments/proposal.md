## Why

当前 task worktree 只为 Workspace 根 Git 仓库创建一个 checkout，Skill 虽然要求开发和验证留在 canonical worktree，却无法证明命令实际使用了该 checkout，也无法把独立 Project/Service Git 仓库组合成同一个任务环境。随着多个 Agent 并发开发和多仓任务增多，需要把“一个 worktree”提升为具有统一 owner、仓库集合、执行边界和候选证据的任务环境。

## What Changes

- 将 `<workspace>/.worktrees/<task-id>` 定义为 task environment 根：保留 Workspace 根仓库 worktree，并可按 Project/Service registry 显式物化多个独立 Git 仓库 worktree，保持它们在 Workspace 中的 canonical 相对路径。
- 扩展 `buildr worktree` CLI，使一次创建或复用能够解析显式仓库选择、各仓稳定 Git identity、integration branch/start point、任务分支和环境 owner，并对部分创建、路径占用、remote 不一致或 branch ownership 冲突 fail closed。
- 提供可重复检查的 task environment context，记录 workspace、task、environment root、每个 source/checkout repository、branch、HEAD、dirty 状态和允许执行根；Agent 在开发、CLI、构建和验证阶段必须使用该 context。
- 让 task-worktree、task-triage、task-verification 和 task-finish 通过同一 task environment identity 交接边界；正式验证不得接受来自其他 checkout、其他 worktree 或主工作区的候选证据。
- Local App preview 和清理流程从单一 owner worktree 扩展为 task environment owner，停止当前任务资源时不得影响其他任务环境。
- 明确隔离承诺：Git/source 写入、Buildr CLI target、验证 evidence 和 Local App 本机状态必须收敛；外部依赖沿用 Project 既有环境，只有并发任务会修改同一共享状态时才要求项目已有的数据边界、串行化或显式授权。
- **BREAKING**：`buildr worktree create --json` 的结果升级为 task-environment-aware schema；依赖 `buildr.worktree-create/v1` 精确结构的调用方需要迁移。

## Capabilities

### New Capabilities

- `task-environments`: 定义单仓与多仓 task environment 的仓库选择、canonical 布局、owner/context identity、CLI 行为、复用、阻塞和清理语义。

### Modified Capabilities

- `agent-task-workflows`: 将实现型任务的位置从单一 worktree 扩展为可验证的 task environment，并规定 Skills 间的执行上下文交接。
- `task-verification`: 在 task environment 模式下将仓库集合、实际执行根和候选 identity 绑定到正式验证 evidence，同时保持非 worktree 项目可独立验证。
- `worktree-local-app-preview`: 将 preview owner 从单一 worktree identity 扩展为 task environment identity。
- `task-finish-local-app-handoff`: 对多仓 task environment 执行逐仓集成、入口迁移、当前任务资源停止和安全清理，并保护其他任务环境。

## Impact

- CLI/application：`worktree create`、新增 inspect/context 能力、命令 registry、JSON contracts 与错误诊断。
- Git 与 Domain adapter：解析 Workspace/Project/Service 的真实 repository boundary、remote 和 integration branch，在 task environment 内物化嵌套 worktrees。
- Skills/contracts：`task-triage`、`task-worktree`、`task-verification`、`task-finish`、`task-asset-review` 及相关 capability contracts、bindings consumer evidence。
- Local App：preview owner identity、list/stop/cleanup 兼容。
- 验证与文档：多仓 fixture、路径越界/错误 checkout/部分创建/复用/清理测试，CLI 和 JSON contract 文档，以及 Codex 原生单仓 worktree 的适配说明。
