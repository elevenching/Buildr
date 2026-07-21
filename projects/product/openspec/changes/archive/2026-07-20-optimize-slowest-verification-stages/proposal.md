## Why

当前 Candidate 虽已在 120 秒预算内，但 `runtime adapter parity` 与 `capability CLI integration` 已逼近各自 30 秒预算，且 timing summary 只记录执行耗时，无法区分排队时间与真正临界路径。需要在不缩小 Candidate 覆盖的前提下补齐调度证据，并消除最慢三项中的重复生命周期与可并行串行场景。

## What Changes

- 为 verification timing step 增加排队、启动、完成和排队耗时证据，使维护者能够识别调度等待与真实执行成本。
- 为 runtime adapter parity 增加命令族计时，并并行化彼此隔离的安全 fixtures；共享 runtime 目标上的 adapter 生命周期保持顺序执行。
- 拆分 capability CLI integration 的长状态链，使独立场景可以并行执行，同时保留关键 CLI 端到端转折。
- 并行化相互隔离的 public JSON/doctor fast integration 场景，保留真实 CLI、Git 和 workspace 覆盖。
- 使用多轮 Candidate 的中位数评估优化效果；只有证据稳定时才收紧高耗时 step 的非阻断目标预算。
- 不删除既有验证覆盖，不改变 Candidate 完整 profile，不引入破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 扩展 timing 调度证据，并要求性能优化保持验证覆盖、稳定 identity 和有界并行。

## Impact

- 影响 `tools/verification` 的 scheduler、timing evidence、registry 与相关单元/集成测试。
- 影响 runtime adapter parity、capability CLI integration 和 public JSON fast integration fixtures。
- `buildr.verification-timing/v1` 新增向后兼容字段；现有消费者仍可只读取 `durationMs`。
- 不改变 Buildr CLI 面向 workspace 的业务行为，不新增外部依赖。
