## Why

“收尾”需要把已集成的结果推送到目标分支，但不应因此默认把临时任务分支发布到远端。任务分支被无意推送会留下无用的远端 `codex/*` 分支，也会让用户误以为它们是待处理的交付物。

## What Changes

- 明确 Task Finish 的默认推送范围仅为已集成的目标分支。
- 为 Git 任务集成契约补充远端任务分支的授权边界：只有用户在当前轮次明确要求时才可创建或推送。
- 让 `task-finish` 与 `git-ops` 的正文、静态校验和契约测试共同验证这一默认行为。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-task-workflows`: 收尾流程需要明确目标分支推送与远端任务分支推送的不同授权。

## Impact

- `services/buildr/package/targets/workspace/skills/buildr/task-finish/`
- `services/buildr/package/targets/workspace/skills/buildr/git-ops/`
- 两项相关 capability contract、随包静态校验与契约测试。
- 不改变现有 capability binding，也不删除已存在的远端分支。
