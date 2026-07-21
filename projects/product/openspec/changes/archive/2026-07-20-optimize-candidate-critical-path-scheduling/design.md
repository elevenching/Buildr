## Context

Candidate 使用全局 4、`workspace-heavy` 3 的有界 DAG scheduler。现有 scheduler 在每轮按 plan 声明顺序扫描 pending steps；只要依赖通过且类别有容量就立即启动，因此 registry 后部的长任务可能在大量短任务之后才获得槽位。最近 34-step Candidate 中，runtime parity 排队 24.321 秒、managed data integrity 排队 55.583 秒，后者成为最终尾部；与此同时 fast integration 在并发负载下达到 23.888 秒。

`dependsOn` 只能表达真实 producer/consumer 依赖，`budgetMs` 是非阻断目标阈值，均不适合作为建议调度顺序。需要一个独立、可验证、可回滚的成本提示。

## Goals / Non-Goals

**Goals:**

- 让当前 ready 的高成本 step 更早占用适合的并发槽，降低 Candidate 总墙钟和关键尾部等待。
- 保持 dependency、concurrency class、exclusive、失败传播、step identity 和最终输出顺序不变。
- 提供同一冻结 tree 上 declaration-order 与 cost-aware 的 A/B 模式，并在 timing evidence 中标识实际模式。
- 用多轮中位数决定是否保留成本提示。

**Non-Goals:**

- 不自动从历史 timing 改写 registry。
- 不把 `budgetMs` 重新解释为预计耗时。
- 不扩大全局或类别并发，不删除或缩小 Candidate profile。
- 不承诺每个单独 step 都更快；目标是稳定降低总墙钟并避免不可接受的资源争用。

## Decisions

### 1. 使用独立的 `schedulingCostMs`

Registry step 可选声明正整数 `schedulingCostMs`，表示用于 longest-ready-first 的粗粒度预计执行成本。缺失时视为 0。Planner 在启动进程前拒绝 0、负数、非整数或非数值提示。成本使用最近冻结 Candidate evidence 四舍五入到秒级，不追求单机毫秒精度。

备选方案是复用 `budgetMs`；预算表达目标上限而非预计成本，复用会让预算校准意外改变调度，因此不采用。另一方案是通用 priority；priority 只能表达人工偏好，无法直接对应可复核 timing evidence，也不采用。

### 2. 只改变 ready-step 选择，不改变 DAG

每轮 scheduler 先按 plan index 固化稳定次序，再对当前 pending steps 按 `schedulingCostMs` 降序、plan index 升序扫描。Step 仍必须满足全部依赖通过、全局容量、concurrency class 容量和 exclusive 约束才可启动；blocked 传播与结果数组仍按原 plan 顺序产生。

这种选择相当于有界 longest-ready-first，不会为建议顺序制造 `dependsOn`，也不会让尚未 ready 的高成本 step 阻塞可运行工作。

### 3. A/B 模式是 fail-closed 的诊断入口

Candidate 默认使用 `cost` 模式；维护者可在基准时设置 `BUILDR_VERIFICATION_SCHEDULING=declaration` 复现旧的声明顺序。只接受 `cost` 与 `declaration`，未知值在创建 verifier 子进程前失败。Timing summary 的 environment 记录 `schedulingMode`，保证基准证据自描述。

该入口只切换 ready-step 选择，不改变 registry、profile、并发上限或 executor，因此两组 run 可在同一 candidate fingerprint 上比较。

### 4. 初始成本只覆盖实测高成本 Candidate steps

初始提示优先覆盖 runtime parity、fast integration、capability、Commands、package Skills、CLI compatibility、managed integrity、runtime smoke 和其他实测中高成本 `workspace-heavy` steps。未声明 step 继续按 plan 顺序。提示采用粗粒度值并由 registry tests 固化合法性，不把一次运行的精确毫秒写成长期事实。

### 5. 采用多轮中位数保留或回滚

在同一冻结 tree 上分别运行至少三次 declaration 与 cost Candidate，比较总耗时中位数、关键 step 排队中位数、预算 warning 和失败情况。只有 cost 模式全部通过、总耗时中位数有稳定下降且没有明显执行耗时恶化时才保留；否则调整提示或撤销 cost-aware 默认。

实际 A/B 的 declaration 总耗时为 65.707、65.266、65.941 秒，中位数 65.707 秒；cost 总耗时为 61.352、64.547、60.306 秒，中位数 61.352 秒，下降 4.355 秒（6.6%），且三轮 cost 均快于三轮 declaration。Runtime parity 的 queue 中位数从 24.914 秒降为 0，duration 从 29.864 秒增至 33.849 秒；managed data integrity 的 queue 中位数从 55.968 秒降至 33.457 秒。总墙钟收益稳定，但 runtime 的执行竞争是真实代价，因此保留现有并发上限和 cost-aware 默认，不进一步扩大并发。

六轮 evidence 同时证明前序 15 秒 fast integration 预算已不适用于新增 task-board 覆盖后的 23.805–26.083 秒执行区间，cost 模式下 runtime parity 也达到 33.141–36.418 秒。最终将两者非阻断目标预算分别校准为 30 秒和 40 秒，覆盖实测最大值并保留约 10% 以上余量；该校准不改变 step status 或调度成本。

## Risks / Trade-offs

- [三个高成本 workspace steps 同时运行会增加 I/O 竞争] → 保持类别上限不变，以 A/B 的执行耗时和总墙钟共同判断，不只看 queue。
- [成本提示随产品演进陈旧] → 使用粗粒度可选字段；后续只在多轮 evidence 显示关键路径漂移时更新。
- [排序破坏稳定输出或失败传播] → 只改变 launch order，结果仍按 plan 顺序返回，并补充 dependency、tie、exclusive 和 blocked 单元测试。
- [诊断环境变量误配置] → 未知模式 fail closed，summary 明确记录实际模式。
