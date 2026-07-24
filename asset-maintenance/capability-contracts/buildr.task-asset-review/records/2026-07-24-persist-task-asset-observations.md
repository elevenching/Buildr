---
schemaVersion: buildr.asset-maintenance-record/v1
assetType: capability-contract
assetId: buildr.task-asset-review
observationId: persist-task-asset-observations
createdAt: "2026-07-24T11:36:16.564Z"
---

# buildr.task-asset-review v2 维护记录

## Source

- Workspace: `f2f40b71-2382-5906-82bd-76a7927b59f3`（Buildr）
- Original task/thread: 本次 Codex 设计讨论；用户明确接受按讨论方案设计与实现
- Original worktree/branch/change: `.worktrees/persist-task-asset-observations` / `codex/persist-task-asset-observations` / `persist-task-asset-observations`
- Observation: 用户级共享 inbox 中的 `persist-task-asset-observations`

## Verified Finding

v1 Effects 只允许只读审查，而新流程需要写当前 owner 的用户级 observation、在 cleanup 前等待人工决定，并把接受结果交给新任务。这改变 effects、consumer obligations、minimum guarantees、decision points 和 result evidence，必须升 major，不能原位改写 v1。

## Asset Change

- Modified source assets: 新增 `contracts/buildr/task-asset-review/v2.md`；默认 provider、binding、产品入口和 Task Finish optional consumer 迁移到 v2
- OpenSpec change: `persist-task-asset-observations`
- Verification: capability/package contract tests、doctor graph、affected verification（完成时更新）
- Commit: 随本次 contract 与 provider 修改提交，集成完成后更新 observation destination 并删除草稿

## Destination

v1 contract 作为兼容历史继续随 package 映射；v2 成为默认 binding。该记录随 contract 实际修改进入 Buildr dev。
