## Why

`buildr sync` 当前会在 source mutation 已经创建 lock、transaction 并可能写入 Builtin 或 Component 后，才识别 optional Builtin 和 Component 的用户决策点；同时事务把整个 `projects/` 树纳入快照与回滚。预期阻塞因此可能升级为大范围目录删除与恢复，真实 workspace 中一旦回滚失败，会威胁独立 Service 仓内容并留下 `rollback-failed`。

## What Changes

- 为 `sync` 建立真正只读的 source plan 与 preflight，在任何 lock、transaction、backup 或源资产写入前汇总全部用户决策点。
- 让 Builtin、registry convergence 和 Component apply 消费同一份已验证计划，并以计划中的精确受管路径建立事务，禁止把整个 `projects/`、Project 根或 Service 仓树作为 affected path。
- 增强目录恢复：有限重试、删除与恢复后校验、失败时保留完整恢复材料，并让同一 transaction 的 `mutation recover` 可安全重复执行。
- 补充 optional Builtin、Component 冲突、嵌套 Git Service 仓、中途异常、首次回滚失败、重复 recover 和最终 doctor 闭环的回归验证。
- 不改变 source commit 后 runtime reconcile 失败不回滚源资产的既有边界。
- 不包含破坏性 CLI 参数或数据格式变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `managed-data-integrity`: 明确只读预检不得创建 mutation 状态，sync 事务只能覆盖计划中的精确受管路径，并增强 rollback/recover 的可验证与幂等保证。
- `buildr-product-capability-sync`: 明确 optional Builtin 或 Component 用户决策点必须在零 lock、零 transaction、零源资产变化状态停止，并支持决策完成后的 sync/doctor 闭环。

## Impact

- 主要实现：`tools/cli/application/runtime.mjs`、Builtin/Component/registry convergence、`tools/cli/shared/infrastructure.mjs`、`mutation recover`。
- 验证：managed data integrity 与 MVP assets/runtime 场景。
- 用户可见行为：预期决策阻塞更早、无 workspace 副作用；恢复失败更可诊断且可安全重试。
- 性能：sync 不再复制和恢复完整 `projects/` Service 树，显著降低大型 workspace 的 I/O 与风险。
