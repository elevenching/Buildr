## Why

当前 Buildr Skill 只识别“更新 Buildr”和“同步 workspace”，没有覆盖“同步 Buildr”“更新 workspace”等价表达，也把“更新 Buildr”错误地扩展为整个 workspace 同步。这会让 Agent 在用户要求“更新 workspace”时漏掉 `sync`，或在只想更新 Buildr CLI 与产品入口 Skill 时扩大修改范围。

## What Changes

- 将“更新 Buildr”“同步 Buildr”及明确等价表达统一识别为 Buildr 产品入口更新意图：先更新 CLI，再用新入口安装最新 Buildr Skill。
- 将“更新 workspace”“同步 workspace”及明确等价表达统一识别为 workspace 同步意图：运行 `buildr sync <agent> --target <workspace>`，不先更新 CLI。
- 用户明确要求“只更新 CLI”时仅执行 `buildr update`，不安装 Skill 或同步 workspace。
- 更新产品内置 Buildr Skill、相关文档和验证，确保两组意图边界稳定且“更新 workspace”不会再漏掉 sync。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`: 将 Buildr 产品入口更新与 workspace 同步拆为两组等价表达，并明确各自命令编排。

## Impact

- 影响产品内置 Buildr Skill 的 description、执行循环、任务路由和 runtime 使用说明。
- 影响 `product-agent-skills` canonical spec 及相关 CLI/产品说明中的 Agent 默认工作流表述。
- 不改变 `buildr update` 与 `buildr sync` 两个底层 CLI 命令各自的副作用边界。
