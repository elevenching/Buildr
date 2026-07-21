## Why

Buildr 的完整 Candidate 在本机约 54 秒，但在 GitHub 发布 runner 上达到 116 秒；`integration-fast` 与 `runtime-adapter-parity` 在共享 runner 上同时被放大约 2–3 倍。当前 Fast 边界已混入重型 workspace/Git/恢复矩阵，Candidate 的外层并发又与 verifier 内部子进程争抢 CPU 和磁盘，需要在不削弱发布覆盖的前提下收紧分层、调度和重复生命周期。

## What Changes

- 重新划定 Fast Integration 边界：保留低成本 CLI/JSON 契约，将 builtin replacement、migration/recovery 失败矩阵和真实 workspace/Git 重型场景迁入独立 Candidate-only steps，并更正命名与验证 owner。
- 调整 Candidate/CI 资源调度：为 workspace-heavy 阶段建立可验证的并发策略，避免 Fast Integration 与 Runtime Adapter Parity 在资源受限 runner 上同时过度扩张子进程。
- 减少 Runtime Adapter Parity 重复准备和同实现族重复生命周期：共享只读 fixture/解析结果，由 contract 覆盖全部 adapter 的通用事实，保留每种投射、checker、cleanup 实现族的代表性黑盒生命周期。
- 增加同一冻结 tree 下的调度对比与 timing 验收，分离 executor 耗时、排队等待和资源争抢；耗时预算仍为非阻断观察指标。
- 不删除 Candidate gate，不降低 Node/操作系统、adapter 实现族、ownership/recovery、tarball 和 Workspace E2E 覆盖。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 收紧 Fast/Candidate 分层、资源感知调度、runtime parity 实现族覆盖与性能验收契约。

## Impact

- 验证 registry、planner、scheduler、timing summary 和 CI 运行参数。
- `test/integration-fast/`、builtin replacement/task-board migration 与 public JSON 相关 verifier 的 owner 与入口。
- Runtime adapter contract/parity verifier 的 fixture 准备、命令矩阵和实现族代表性覆盖。
- `docs/release-checklist.md`、`docs/verification-ownership.md` 与对应契约/集成测试。
