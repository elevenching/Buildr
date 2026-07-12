## Why

Agent 完成阶段性工作后，如果只报告结果而不说明下一步，用户还需要自己判断流程如何继续。Core 应要求 Agent 根据当前事项给出明确、可执行的下一步，同时避免在任务结束后机械追加建议。

## What Changes

- 在 Buildr Core 中增加下一步引导规则。
- 要求 Agent 结合当前状态、适用的 Rule、Skill 和项目约定说明下一步。
- 任务已经完整结束时明确说明完成，不追加无关建议。

本变更不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 增加 Buildr Core 的下一步引导要求。

## Impact

- 修改 `package/targets/workspace/rules/buildr/core.md`。
- 更新对应 OpenSpec spec 和产品验证。
