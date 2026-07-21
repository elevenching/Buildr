## Why

Buildr Candidate 已记录阶段 timing，但人类输出只显示 summary 路径，默认固定临时路径还会被其他 worktree 覆盖；`test:changed` 没有整体 summary，`task-finish` 也不会强制消费 timing 证据。结果是验证确实执行了，却无法在最终完成报告中可靠回答“本次测试用了多久、最慢在哪里、证据属于哪个候选 tree”。

## What Changes

- Candidate 和 Changed verification 为每次运行生成唯一、持久到当前临时目录生命周期结束前的 evidence 目录，避免默认 summary/diagnostics 跨 worktree 覆盖。
- timing summary 增加 run identity 与 source identity，绑定入口、worktree、Git HEAD、候选状态 fingerprint 和执行时间。
- Candidate 与 Changed 的人类输出都显示总耗时、预算状态、最慢阶段、失败阶段和 summary 绝对路径。
- `test:changed` 生成与 Candidate 同 schema family 的整体 timing summary，而不是只打印逐阶段耗时后删除全部证据。
- `task-finish` 在复用完整 Candidate 验证时读取并核对 timing summary，在最终收尾报告中说明总耗时、最慢阶段、失败阶段和证据路径；证据缺失、被覆盖或无法归属时不得伪造耗时。
- 增加并发 worktree、成功/失败、人类输出和收尾契约测试。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 强化 timing summary 的唯一性、候选归属、Changed 覆盖和人类可见摘要。
- `agent-task-workflows`: 要求 `task-finish` 消费并报告可信的完整验证 timing 证据。

## Impact

- 验证实现：`tools/verification/candidate.mjs`、`changed.mjs`、`timing/` 与 plan runner。
- Skill：package 中的 `task-finish` 源及其契约测试；不升级 `buildr.task-finish/v1`，不改变授权或 Git/worktree provider 边界。
- JSON：保持 `buildr.verification-timing/v1`，新增兼容字段；默认输出路径从共享固定文件改为唯一 evidence 目录，显式环境变量路径保持有效。
- 文档与测试：验证说明、timing integration tests、task-finish fixtures/contract。
