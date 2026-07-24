## Why

任务收尾会将本机 Buildr CLI 和 Local App 从 task worktree 迁回主工作区。现有流程只要求完成入口迁移和清理，没有要求保留已运行 Local App 的 loopback 端口，导致用户已打开的 URL 在重启后失效，也使收尾结果不可预期。

## What Changes

- 为 task-finish 增加本机 Local App 迁移约束：发现健康实例时，读取并验证其实际 loopback URL，提取端口，并在停止旧实例后用保留 checkout 在同一端口启动新实例。
- 明确停止、重装、重启、健康校验和 task worktree 删除的顺序；端口不可用或重启失败时停止清理并保留现场。
- 为该顺序补充 capability contract、随包 task-finish Skill 和自动化验证。

## Capabilities

### New Capabilities

- `task-finish-local-app-handoff`: 规定任务收尾中 Local App 的同端口迁移与失败边界。

### Modified Capabilities

- 无。

## Impact

- `services/buildr/package/targets/workspace/skills/buildr/task-finish/`
- `services/buildr/package/targets/workspace/skills/contracts/buildr/task-finish/`
- task-finish 相关静态契约测试与随包资产验证。
