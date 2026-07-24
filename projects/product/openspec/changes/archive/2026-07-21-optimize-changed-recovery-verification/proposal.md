## Why

Buildr 已将重型恢复矩阵从 Fast 拆到 Candidate，并通过饱和型互斥降低了受限环境中的资源竞争，但 Changed planner 仍用多个 `src/**` broad inputs 把普通源码改动扩张为 10–17 个验证 step；同时 recovery 的 20 项分支大多为每个断言重新执行完整 `init + sync` Workspace 准备，单 step 稳定超过现有 25 秒观察预算。现在需要在不削减 Candidate gate 或安全场景覆盖的前提下，让 Changed 回到“最小可解释受影响验证”，并降低 recovery 的重复生命周期成本。

## What Changes

- 收窄 Candidate-only 重型 verifier 的 Changed inputs，以真实实现 owner 和公开边界作为触发条件；Candidate profile 仍无条件包含全部 required gates。
- 为代表性源码路径建立稳定 planner 契约，防止网络、布局或 CLI 小改再次被 broad glob 扩张为无关 recovery、tarball 或 integrity 验证。
- 将 builtin replacement 的状态分类和 preflight 分支下沉到 unit owner，Candidate E2E 只保留真实 CLI、事务、runtime 收敛、最终 doctor 与历史资产保护的黄金路径。
- 优化 recovery fixture：source-only 场景不创建后删除 runtime；只共享只读基础状态，每个 mutation 场景仍复制到独立临时 Workspace。
- 保持 `workspace-saturating` 默认互斥；在最终冻结 tree 上用多轮 recovery/Candidate timing 决定是否保留或校准 25 秒非阻断预算，不以单次结果直接放宽目标。
- 不删除 Candidate required step，不减少现有 replacement、migration、rollback、fail-closed 和 runtime adapter 实现族覆盖；无破坏性 CLI/API 变化。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 收紧 Changed input ownership，要求重型 owner 不得使用无差别 Product 源码 glob；明确 recovery 状态矩阵的 unit/E2E 分层、只读 fixture 复用边界和预算校准证据。

## Impact

- 验证 registry 与 planner 契约：`test/verification/registry.mjs`、planner unit/contract tests。
- Recovery 实现测试：`test/integration-candidate-recovery/`、`test/unit/` 与相关 fixture helper。
- 验证职责与性能记录：`docs/verification-ownership.md`、`docs/release-checklist.md`。
- 不改变产品运行时、公开 CLI、npm 包内容、Candidate required gate 集合或默认资源互斥策略。
