## 1. 建立选择与覆盖基线

- [x] 1.1 为 network helper、product layout、CLI help、Workspace domain、builtin replacement 和 runtime publication 建立 Changed plan 基线，记录当前 required 与无关重型 owners。
- [x] 1.2 补充 planner unit/contract tests，断言代表路径选择真实 owner、排除已知无关重型 owner，并保持 Product inventory 全覆盖。
- [x] 1.3 固化 Candidate required gate identities，证明后续 inputs 收窄不改变完整 Candidate profile。

## 2. 收窄 Changed verifier ownership

- [x] 2.1 收窄 recovery、capability CLI、CLI compatibility、CLI package parity、release smoke 和 managed integrity 的 broad `src/**` inputs。
- [x] 2.2 保留 contract、architecture 和适用的低成本 mutation fallback，为每个重型 step 登记直接实现、入口、测试和资产 owner。
- [x] 2.3 运行 planner/inventory affected 验证，确认代表路径计划可解释、无未映射 Product path，Candidate gates 不减少。

## 3. 下沉 builtin replacement 状态矩阵

- [x] 3.1 为 `createBuiltinReplacement()` 建立 unit fixture，直接覆盖 predecessor、receipt、snapshot、restore 和 uninstalled 状态组合。
- [x] 3.2 将 manifest target/source、replacement occupied、predecessor missing、recognized/unknown integrity 与 restore override 分类迁入 table-driven unit tests。
- [x] 3.3 在 unit tests 中断言 findings、restore outcomes、mutation callbacks 和零副作用，保留每个原有分类分支的明确 owner。

## 4. 优化 Recovery E2E 生命周期

- [x] 4.1 重构 recovery fixture，使 source-only 基础只执行 init，with-runtime 基础才执行 sync，并为每个 mutation 场景复制独立 Workspace。
- [x] 4.2 将 Candidate E2E 收敛为成功迁移/幂等、显式 restore、代表性阻断、sync/restore rollback、runtime 收敛、最终 doctor、uninstalled 和历史资产保护黄金路径。
- [x] 4.3 建立原 20 项场景到 unit/E2E owner 的覆盖映射，证明没有通过删除安全分支缩短耗时。
- [x] 4.4 运行 unit 与 recovery focus，确认共享基础状态只读、测试间无 mutation 泄漏且失败 diagnostics 保持可定位。

## 5. 性能验收与预算校准

- [x] 5.1 在同一冻结 tree 上多轮运行 recovery focus，记录每轮 wall-clock、中位数、范围和场景数量。
- [x] 5.2 根据多轮证据决定保留 25 秒预算或按中位数加波动余量校准，并更新验证职责/性能文档。
- [x] 5.3 运行 Changed affected 验证，报告代表路径 selector 数量变化、失败/跳过和 timing evidence。
- [x] 5.4 运行完整 Candidate，核对 required gates、总耗时、最慢阶段、预算、失败/跳过和 evidence identity；最后仅写回本任务 checkbox。
