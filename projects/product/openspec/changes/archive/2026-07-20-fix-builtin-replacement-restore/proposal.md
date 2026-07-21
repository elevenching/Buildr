## Why

`builtin restore` 对普通 Builtin 能表达“用户确认放弃本地内容并恢复当前官方版本”，但 replacement 迁移没有消费这项显式授权：未知旧版 predecessor 仍被判为 `modified`，命令却无条件报告“已恢复”。这会让 `task-cockpit` 无法迁移为 `task-board`，并让 Agent 基于假成功结果继续操作，因此需要补齐 replacement 的显式恢复生命周期。

## What Changes

- 为被替代 Builtin 定义显式 restore 语义：只有用户或 Agent 已明确选择放弃冲突 predecessor 内容时，`builtin restore <replacement>` 才能接管并替换旧 identity。
- restore 在写入前汇总 predecessor source、manifest、receipt 和 runtime 的精确删除范围，继续通过受管 mutation 与回滚边界执行，不放宽普通 `sync` 的 fail-closed 规则。
- restore 成功后删除旧受管 Skill identity、安装新 Skill、更新 manifest/receipt；后续 `sync` 负责收敛 runtime 并通过最终 doctor。
- restore 未实际完成时返回失败，不得仅因 finding 中存在目标 id 就输出“已恢复”。
- 增加未知 legacy integrity、缺少/冲突 ownership、受保护用户资产、事务失败、重复执行及 success/failure 输出的契约与集成验证。
- 不迁移、不删除、不改写 `openspec/knowledge/task-cockpits/*.html` 等历史任务页面。
- 不包含破坏性 CLI 兼容变更；仅修正现有 restore 契约未兑现和假成功行为。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `buildr-product-capability-sync`: 明确 replacement target 的显式 restore 授权、受管迁移结果、失败语义，以及 restore 后重新 sync 的收敛要求。

## Impact

- 影响 Buildr CLI 的 Builtin replacement preflight、restore lifecycle、workspace mutation、manifest/receipt 更新和命令结果判断。
- 影响 package/replacement 单元测试、CLI integration、临时 workspace E2E 与相关静态契约验证。
- 不改变普通 `sync` 对未知或 ownership 不明资产的零写入保护，不改变历史任务页面路径与内容。
