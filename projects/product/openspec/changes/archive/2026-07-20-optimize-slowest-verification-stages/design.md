## Context

Candidate 通过统一 registry 和有界 DAG 并行执行验证。当前 timing summary 只保留 step 的 `durationMs`，无法判断一个慢 step 是执行慢还是因全局/并发类别容量排队；同时最慢两个 verifier 内部存在重复 CLI 生命周期或过长串行状态链。优化必须保持 Candidate 完整 profile、真实 CLI 边界、失败传播和稳定 step identity。

## Goals / Non-Goals

**Goals:**

- 以向后兼容字段记录每个已执行 step 的排队、启动和完成时间。
- 降低 runtime parity 的隔离 fixture wall-clock，并保留共享目标上 adapter 投射的必要顺序，不减少 adapter、资产、生命周期或安全覆盖。
- 将 capability 与 public JSON 中相互独立的 workspace 场景并行化。
- 用多轮 Candidate 中位数而非单次结果判断收益和预算。

**Non-Goals:**

- 不删除 Candidate gate，不把 Candidate 改成 diff-aware。
- 不用内部函数替代必须验证的公开 CLI 行为。
- 不改变全局并发上限或通过提高无界并发掩盖慢测试。
- 不承诺特定机器上的绝对运行时间。

## Decisions

### 1. Timing v1 使用可选调度字段保持兼容

Scheduler 在 plan 进入执行时为所有 step 记录共同的 `queuedAt`。实际 launch 时记录 `startedAt`，完成时记录 `finishedAt`，并为已启动 step 计算 `queueDurationMs`。blocked step 保留 `queuedAt` 与 `blockedAt`，不生成启动或完成时间，并继续使用既有 `durationMs: 0` 兼容哨兵。已执行 step 的 `durationMs` 继续表示 executor 测得的执行耗时，现有消费者无需迁移。

备选方案是升级到 timing v2；由于只是新增字段且不改变既有字段语义，当前没有必要制造 schema family 分叉。

### 2. 只并行隔离 fixture，不并行共享 runtime 目标

Runtime parity 的不同 adapter 可能共享 `.agents` 等 runtime 目标；后一个 adapter render 会改变前一个 adapter 的投射上下文，因此每个 adapter 的 install/render/check 或 doctor 必须保持相邻和顺序执行。Skill symlink、Rules symlink、guarded orphan、Rules orphan 与 Git boundary 等使用独立 workspace 的 fixture 可以有界并行，并通过命令族累计计时暴露剩余热点。删除、卸载、恢复和幂等阶段保持原覆盖。

备选方案是把共享 workspace 上的 adapter 生命周期直接并行；该方案会产生受管投射竞态或虚假 stale，已被专项实验否决。为每个 adapter 复制完整 workspace 又会削弱跨 adapter 共存的 golden path，本 change 也不采用。

### 3. Capability 长状态机按独立语义链拆分

Provider replacement、optional degradation、ambiguity/Project override 分别使用独立临时 workspace，并通过 Node test 的显式 bounded concurrency 并行。纯 resolver 组合继续由 unit owner 覆盖，CLI integration 只保留每条链的关键公开命令与 doctor 结果。

### 4. Public JSON/doctor 场景只并行独立 fixture

各测试已经使用独立临时目录，因此可显式并行；共享 Git remote、全局 HOME 或同一 workspace 状态链的 integration tests 不在本次并行范围。文本输出仍保留一条真实 CLI 回归。

### 5. 预算以多轮中位数和稳定性门槛决定

最终实现先在同一冻结 tree 连续运行三次 Candidate，记录总耗时和最慢阶段。只有目标 step 三次均通过、无明显离群且新预算仍保留合理余量时才收紧 registry 预算；若现有预算本身缺乏抖动余量，则依据同一证据向上校准，避免稳定产生无行动价值的噪声。预算仍为非阻断目标。

三轮基准总耗时为 54.964、54.971、55.142 秒，中位数 54.971 秒。目标 step 的中位数分别为 fast integration 10.268 秒、capability CLI 18.509 秒、runtime parity 29.510 秒；据此为前两项设置 15 秒和 25 秒目标预算。runtime parity 已接近现有 30 秒预算且受 Candidate 并发负载影响，最终树首次验证达到 30.097 秒并产生预算警告，因此将目标校准为 35 秒，为实测中位数保留约 19% 余量。

## Risks / Trade-offs

- [并行测试增加 I/O 竞争导致波动] → 只并行独立 fixture，保持现有全局 Candidate 并发上限，并以三次中位数评估。
- [拆分状态链遗漏原有转折] → 对照原断言清单逐项映射，contract test 固化关键场景名称与覆盖事实。
- [Scheduler 时间与 executor duration 略有差异] → 明确定义 `durationMs` 仍由 executor 负责，scheduler 字段用于排队与时间轴分析。
- [单机预算不具代表性] → 预算只在三轮稳定且保留余量时收紧，不把超预算改为失败。
