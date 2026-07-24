## Why

Buildr 的默认本机应用是用户级单实例。多个 task worktree 并发开发时，Agent 无法同时让用户查看各自 checkout 的 Local App，只能切换全局实例或临时覆盖 `Buildr Dev.app`，容易验收到错误分支，也会影响其他任务。

现在需要把“worktree 中的本机应用验收”变成可明确识别、可并行运行、可安全清理的开发预览能力，同时保持主开发分支的 `Buildr Dev.app` 作为唯一稳定开发 launcher。

## What Changes

- 新增 task worktree Local App 预览实例：每个显式实例名拥有独立的用户级状态目录、启动锁、登记列表、随机 loopback 端口与运行身份。
- 新增面向 Agent 的预览启动、查看和停止命令；启动结果输出实例名、URL、worktree、分支、HEAD 与 dirty 状态，供对话交接和人工验收使用。
- 预览页面展示其开发实例身份，防止用户在多个浏览器标签中混淆正在验收的 checkout。
- 保持 `buildr app` 与 `Buildr Dev.app` 的默认单实例语义；预览不得安装、替换或停止 development launcher，也不得影响其他实例。
- 调整 task-finish 的 Local App 清理规则：只处理属于当前任务的预览实例；存在其他活跃实例时必须保留它们。

## Capabilities

### New Capabilities

- `worktree-local-app-preview`: 为 worktree 提供隔离、可识别、可管理的 Local App 开发预览实例。

### Modified Capabilities

- `cli-product-surface`: 公开预览实例的启动、查看和停止命令及帮助语义。
- `task-finish-local-app-handoff`: 区分默认实例、当前任务预览实例与其他任务实例，避免收尾干扰并发验收。

## Impact

- `services/buildr/src/interfaces/local-app/`、CLI registry/help 和本机状态持久化。
- Local App Web shell、HTTP health payload、快速集成与浏览器冒烟验证。
- `services/buildr/package/targets/workspace/skills/buildr/task-finish/` 及其契约/测试。
- `services/buildr/docs/cli-reference.md`；不修改 `Buildr Dev.app` 的安装位置或多 launcher 行为。
