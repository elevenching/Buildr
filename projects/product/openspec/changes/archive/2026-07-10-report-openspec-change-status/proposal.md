## Why

Buildr 已要求 Agent 在采用 OpenSpec 前说明 change id、路径和动作，但后续回复没有统一暴露 change 当前进度、可执行动作或阻塞状态，用户难以在持续协作中判断任务实际处于哪里。需要把 change 状态摘要补入任务分流和 OpenSpec 协作契约，让状态对用户持续可见。

本变更不包含破坏性变更。

## What Changes

- 扩展 `task-triage`，要求一旦任务采用 OpenSpec，面向用户的后续状态回复必须包含当前 change 状态摘要。
- 明确状态摘要至少包括 change id、resolved change path、当前动作，以及可从 OpenSpec 状态中确认的 artifact/task 进度、下一可执行动作或阻塞原因。
- 更新随包 Skill 验证，防止该约束在产品打包或后续同步中丢失。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`：扩展任务分流与 OpenSpec 工作流的用户可见状态契约。
- `buildr-package-assets`：验证随包任务与 OpenSpec Skills 保留 change 状态披露要求。

## Impact

- 修改 `package/targets/workspace/skills/buildr/task-triage/SKILL.md`。
- 修改相关 OpenSpec 主 specs 和产品包验证断言。
- 重新渲染当前 Codex runtime 中的 `task-triage` Skill。
- 不改变 Buildr CLI 命令、数据结构或外部 API。
