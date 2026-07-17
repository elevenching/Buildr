## 1. Sync 只读计划与精确事务范围

- [x] 1.1 为 Builtin 和 registry convergence 生成只读 findings、确定性签名与精确 potential affected paths，并拒绝已有集合根或独立 repo 根进入计划。
- [x] 1.2 让 Component `checkOnly` 执行真实 reconcile plan，返回完整冲突与精确成员、manifest、definition affected paths。
- [x] 1.3 重构 `syncRuntime()`：事务外汇总用户决策，事务内重检计划稳定性并只对精确路径执行 Builtin 与 Component apply。
- [x] 1.4 增加 optional Builtin missing/modified、Component 冲突和嵌套 Git Service 仓的零 mutation、零文件变化回归测试，并运行相关最小测试。

## 2. Rollback 与 recover 加固

- [x] 2.1 为 snapshot restore 增加有限删除重试、删除/复制结果验证和失败材料保留，并由普通 rollback 与显式 recover 共享。
- [x] 2.2 增加 recovered receipt，使失败 recover 可重试、成功 recover 可重复执行为 no-op，未知 transaction 仍 fail closed。
- [x] 2.3 增加 mutation 中途异常、首次 rollback/recover 失败、恢复后 Git 状态一致和连续 recover 的回归测试，并运行 managed integrity 验证。

## 3. 产品事实与候选验证

- [x] 3.1 更新 Buildr current-state knowledge，记录只读 sync preflight、精确 source transaction 和 recover 幂等边界。
- [x] 3.2 运行受影响范围验证，修复所有与本 change 相关的失败。
- [x] 3.3 冻结最终候选并运行一次 `npm run test:candidate`，读取并记录 timing summary。
