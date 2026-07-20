## 1. Timing 调度证据

- [x] 1.1 为 DAG scheduler 结果增加 queued/start/finish/blocked 时间字段与排队耗时
- [x] 1.2 在 timing evidence 中保留新增字段并补充 scheduler、summary 和 JSON contract tests

## 2. 最慢 verifier 优化

- [x] 2.1 为 runtime adapter parity 增加命令族计时并并行化隔离安全 fixtures，保留共享目标顺序与完整覆盖
- [x] 2.2 将 capability provider 状态长链拆成隔离且可并行的 CLI integration 场景
- [x] 2.3 并行化相互隔离的 public JSON/doctor fast integration 场景

## 3. 验证与预算

- [x] 3.1 运行 timing、runtime、capability 和 integration-fast 专项验证及 Changed verification
- [x] 3.2 在同一冻结 tree 运行三轮 Candidate，汇总总耗时与目标 step 中位数
- [x] 3.3 依据稳定性决定是否收紧 step 预算，并在最终候选 tree 核对 Candidate timing summary
