## Why

当前 `task-worktree` 对普通开发任务采用保守保留策略，但没有区分用于制作并推送发布分支的临时 worktree，导致发布目标已经完成后仍可能无必要地保留本地 worktree 和分支。需要明确发布任务的终态，让 Agent 在远端发布分支已确认且没有后续本地动作时主动清理。

## What Changes

- 区分普通开发 worktree 与发布 worktree 的保留语义。
- 发布分支已推送、远端提交已确认、worktree 干净且没有明确后续本地动作时，默认清理本地发布 worktree 和本地发布分支。
- 仍需构建、部署、修复或验证时保留发布 worktree，并说明保留原因和下一步。
- 增加随包 Skill 契约验证，防止发布 worktree 清理语义回退。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-task-workflows`: 补充发布 worktree 在发布目标完成后的默认清理与例外保留契约。

## Impact

- `projects/product/package/targets/workspace/skills/buildr/task-worktree/SKILL.md`
- `projects/product/openspec/specs/agent-task-workflows/spec.md`
- Buildr package Skill 契约测试
