## Context

Buildr Candidate 由统一 registry 和有界 DAG scheduler 编排 33 个 steps。本次 `0.1.0-rc.6` 同一候选 tree 的证据显示：本机 Candidate 约 54 秒，GitHub publish Candidate 约 116 秒；`integration-fast` 从本机单独 31 秒放大到 CI 并发下 91 秒，`runtime-adapter-parity` 从本机单独 26 秒放大到 74 秒。两者都会高密度创建临时 workspace、启动 Node/Git/CLI 子进程和执行文件系统 mutation，但当前都属于可同时运行的 `workspace-heavy`。

同时，`integration-fast` 已纳入 builtin replacement、task-board migration、rollback 失败矩阵和 release history 场景，与“普通任务的低成本 Fast feedback”不再完全一致。Runtime parity 已有 implementation family 契约，但黑盒命令矩阵仍对多个共享实现的 adapter 重复准备和生命周期。

## Goals / Non-Goals

**Goals:**

- 让 `test:fast` 只承担低成本、可稳定频繁运行的反馈，重型恢复/迁移矩阵保留为独立 Candidate owner。
- 使 scheduler 能防止多个子进程/文件系统饱和型 verifier 在资源受限环境中相互放大。
- 使 runtime contract 遍历所有 adapter 的声明式事实，parity 只对实现族差异执行完整黑盒生命周期。
- 用同一冻结 tree 的多轮 timing 对比证明优化，保留 step identity、失败诊断和完整 Candidate coverage。

**Non-Goals:**

- 不删除 Node 20/22、macOS/Windows release smoke 或任一发布安全门禁。
- 不用单次耗时或超预算直接阻塞 Candidate。
- 不把真实 Agent invocation/marker smoke 加入 Candidate。
- 不在本 change 内引入专用高配 runner 或外部分布测试服务。

## Decisions

### 1. 先重画 owner，再优化实现

将 Fast Integration 按证据 owner 拆分，而不是在原测试文件内用条件跳过：

- Fast 保留不需要多轮真实 workspace 演进的 CLI update、JSON contract 与调度/timing 低成本契约。
- builtin replacement、migration/recovery 失败矩阵、release history/convergence 等使用独立 step identity 和 Candidate-only profile。
- Changed/Focus 仍可以按路径或 step id 定点运行重型 owner，不必启动完整 Candidate。

这比单纯把 `integration-fast` 改名更有价值：名称、profile 和实际副作用保持一致，同时 Candidate 总集不变。

### 2. 为饱和型 verifier 增加显式资源约束

Registry 继续声明稳定 step id、依赖和 concurrency class，但对“会启动大量子进程并高密度 mutation 临时 workspace”的 steps 提供独立资源限制。实现前在同一冻结 tree 上对比至少两种方案：

- 将饱和型 steps 互斥；
- 保留并发但降低 CI `workspace-heavy` class limit。

最终选择以 Candidate 整体 wall-clock、两个重项 executor duration、queue duration 和稳定性共同决定，不只比较某个 step 的单次耗时。实际策略及证据需记录在 timing summary/verification docs 中。

### 3. Runtime contract 全覆盖，parity 按实现族取样

- Descriptor/plan/capability contract 继续遍历 7 个 supported adapters，证明 targets、activation、inventory evidence 与安全边界。
- 完整 install/render/check/idempotency/cleanup 黑盒生命周期按 native-recursive、per-source reference、same-directory vendor、central vendor、root-index bridge 等实现族选择代表。
- 品牌特有路径、checker probe 或 activation 差异仍保留定点断言；不能因底层实现共享就忽略公开 adapter 事实。
- 共享只读 fixture 和不变解析结果，但不共享可变 workspace、receipt 或 mutation target。

### 4. 优化验收以覆盖和多轮证据为准

实现前捕获基线，实现后在同一冻结 tree 上运行多轮默认与对照调度。验收必须同时证明：

- Candidate 的 required step/owner 集合与关键场景未减少；
- Fast 不再执行 Candidate-only 的真实 workspace/recovery 矩阵；
- 调度策略在 summary 中可观测；
- 使用中位数与波动范围评估改善，不将性能指标改成阻断性测试。

## Risks / Trade-offs

- [降低外层并发可能增加排队时间] → 使用同 tree A/B 比较整体 wall-clock 和重项 duration，选择真正缩短关键路径的方案。
- [拆分 Fast 可能使某些回归更晚暴露] → Changed planner 为对应实现路径保留重型 owner，并在 Candidate 中强制全部执行。
- [Parity 取样错误合并了真实差异] → 从 runtime trait/implementation registry 生成覆盖矩阵，对品牌特有 path/checker/activation 保留独立断言。
- [共享 fixture 导致状态泄漏] → 只共享只读源与解析结果，所有 mutation workspace 继续使用独立 namespace。
- [单次 CI 噪声导致错误结论] → 以多轮成功中位数、分位波动和调度时间线作为决策证据。
