## Why

当 Agent 执行 `pull`、`rebase`、`merge`、`switch` 等会改变工作区内容的 Git 操作后，Buildr 管理的 Rules、Skills、Commands、Components 与 Contributions 可能已经变化，而本地 Agent 环境仍停留在旧状态。当前缺少一个由 Agent 工作流触发、无需 Git hook 或后台进程的统一检查点，用户容易在不知情的情况下继续使用陈旧环境。

## What Changes

- 扩展 Git Ops Skill 的路由范围，覆盖会改变已检出工作区的 Git 操作。
- Git 工作区变更成功后，若处于已初始化的 Buildr workspace，针对当前 Agent 执行环境诊断；诊断发现可由 workspace sync 修复的漂移时，询问用户是否由 Agent 立即同步，同时提供手动同步方式。
- 用户确认后由 Agent 调用 Buildr Skill 执行 `sync` 并验证最终 doctor；未取得授权时不擅自修改 workspace。手动命令只作为用户选择或 Agent 无法执行时的兜底，当前 session 是否重新加载由 Agent runtime 自身决定。
- `task-worktree`、`task-finish` 等内部执行工作区变更的任务 Skill 复用相同检查约束。
- 包验证增加静态契约，防止发布时遗漏触发点、Agent 代执行优先、同步授权、手动兜底或诊断边界。
- 不引入 Git hook、daemon、定时器或新的文件指纹协议；由 Agent 之外执行的 Git 操作留待后续产品化事件机制覆盖。

本变更不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-first-product-positioning`: 明确 Buildr 功能优先由 Agent 在必要授权后直接执行，手动操作只作为用户选择或 Agent 无法执行时的兜底。
- `agent-task-workflows`: 增加 Git 工作区变更后的 Buildr 环境诊断、同步询问、Agent 执行与手动兜底契约，并让相关任务 Skill 复用该检查点。
- `buildr-package-assets`: 增加发布包对上述 Skill 触发、诊断和非自动修复边界的静态验证。

## Impact

- 影响 Product Rule、产品主说明、随包 required Core，以及发布包中的 `git-ops`、`task-worktree`、`task-finish` 与 `buildr` Skills 及其 manifest 描述。
- 影响 Buildr 包资产静态验证与对应测试。
- 不改变 Buildr CLI 命令接口、runtime adapter 渲染格式或 Git 仓库配置。
