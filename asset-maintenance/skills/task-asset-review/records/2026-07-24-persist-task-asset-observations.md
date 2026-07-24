---
schemaVersion: buildr.asset-maintenance-record/v1
assetType: skill
assetId: task-asset-review
observationId: persist-task-asset-observations
createdAt: "2026-07-24T11:36:16.564Z"
---

# Task Asset Review 持续观察维护记录

## Source

- Workspace: `f2f40b71-2382-5906-82bd-76a7927b59f3`（Buildr）
- Original task/thread: 本次 Codex 设计讨论；用户明确接受按讨论方案设计与实现
- Original worktree/branch/change: `.worktrees/persist-task-asset-observations` / `codex/persist-task-asset-observations` / `persist-task-asset-observations`
- Observation: 用户级共享 inbox 中的 `persist-task-asset-observations`

## Verified Finding

旧 Skill 只在任务结束时执行只读审查，并把轻量资格判断放在 Task Finish。它无法稳定保留任务早期出现的资产信号，也没有人工 accept/reject、独立新任务和最终资产去向的可验证交接。现有资产为部分覆盖。

## Asset Change

- Modified source assets: `task-asset-review/SKILL.md`、`scripts/observation.mjs`、`templates/`、OpenAI metadata、package/static verifier
- OpenSpec change: `persist-task-asset-observations`
- Verification: helper lifecycle contract tests、package check、affected verification（完成时更新）
- Commit: 随本次资产修改提交，集成完成后更新 observation destination 并删除草稿

## Destination

该记录与 Skill 实际修改一起进入 Buildr dev。只有任务集成成功后，用户级 observation 才能以 `asset-integrated` 完成并删除。
