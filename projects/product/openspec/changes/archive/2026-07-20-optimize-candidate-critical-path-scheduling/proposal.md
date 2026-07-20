## Why

Candidate 已能记录执行与排队时间，但 scheduler 仍按 registry 声明顺序占用并发槽；在 34-step 候选中，`managed data integrity` 排队 55.583 秒才启动，而 runtime、fast integration 与 capability 等长任务也会因早期短任务占槽形成长尾。需要在不伪造依赖、不扩大并发和不削减覆盖的前提下，让已就绪的高成本 step 更早运行。

## What Changes

- 为 verification registry 增加独立于 `budgetMs` 和 `dependsOn` 的可选 `schedulingCostMs` 提示，并对其进行 fail-closed 校验。
- scheduler 在当前依赖已通过且容量可用的 step 中优先启动 `schedulingCostMs` 较高者；同成本保持原 plan 顺序，最终结果仍按 plan 顺序输出。
- 为已测量的高成本 Candidate step 声明粗粒度成本提示，不用 `dependsOn` 表达建议顺序。
- 以同一冻结 tree 的多轮 Candidate timing 对比总墙钟、排队和阶段执行耗时；没有稳定收益时撤销提示或调整设计。
- 按同一 A/B evidence 校准因新增覆盖与默认调度负载变化而失真的非阻断目标预算，不用预算 warning 代替性能判断。
- 无破坏性变更；未声明成本提示的 registry step 保持兼容。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 增加 registry 调度成本提示、稳定的 ready-step 选择规则和基于冻结树的关键路径验证要求。

## Impact

- 影响 `tools/verification/registry.mjs`、registry validation、`tools/verification/dag-scheduler.mjs`、验证维护文档及对应 unit/integration tests。
- Candidate、Fast、Changed 与 Focus 继续使用同一 registry/scheduler；profile 选择、依赖图、并发上限、step identity、诊断和结果顺序不变。
- 不增加依赖，不改变公开 Buildr CLI 或 runtime adapter 行为。
