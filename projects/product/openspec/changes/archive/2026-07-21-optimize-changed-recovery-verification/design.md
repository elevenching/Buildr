## Context

当前统一 registry 同时服务 Fast、Changed、Focus 和 Candidate。Candidate 通过 profile 无条件选择 required gates；Changed 则把每个 step 的 `inputs` 当作路径 owner。多个重型 Candidate step 仍声明 `src/**`，因此任何 Product 源码都会匹配 recovery、capability CLI、checkout/package parity、release smoke 和 managed integrity。实测一个普通源码路径会选择 10 个 step，领域或 runtime 路径达到 15–17 个，与“最小可解释 DAG”的产品契约不符。

Recovery step 保留 20 项 builtin replacement/migration/recovery 场景，其中多数冲突分支每次都调用 `createLegacyWorkspace()`；该 helper 固定运行一次 `init` 和一次 `sync codex`，source-only 场景随后又删除 runtime。最终 Candidate 中 recovery 为 32–39 秒，而既有同 tree A/B 已证明 `workspace-saturating` 默认互斥比并发两个饱和型 verifier 快约 18.2%，所以本次先优化 owner 与 verifier 内部成本，不反向放开资源约束。

## Goals / Non-Goals

**Goals:**

- 让 Changed 对普通源码只选择真实相关 owner，同时保持每个 Product path 有 verifier owner 或显式 ignore。
- 保留 Candidate required step identity 和无条件完整 profile。
- 保留全部 replacement 状态、安全冲突、零写入、rollback、runtime 收敛、doctor 与历史资产保护语义。
- 把纯状态分类放入 unit，把真实 CLI/事务/文件系统边界保留在 Candidate E2E。
- 消除 source-only fixture 的无效 runtime 准备，并安全复用只读基础状态。
- 用同一冻结 tree 的多轮证据决定 25 秒预算是否仍合理。

**Non-Goals:**

- 不删除或合并 Candidate gate，不改变 stable step id、profile、failure propagation 或 artifact dependency。
- 不解除 `workspace-saturating` 默认互斥，也不扩大全局/类别并发。
- 不以 mock CLI 代替所有真实命令边界。
- 不在本 change 优化 package selector、CLI parity 或其他非关键路径的机械重复。
- 不改变 Buildr 产品运行时、公开 CLI、npm inventory 或 Workspace 数据语义。

## Decisions

### 1. Candidate 完整性与 Changed ownership 分开处理

Candidate 是否运行一个 step 只由 candidate profile 决定；`inputs` 只表达哪些改动应在 Changed/Focus 阶段触发该 owner。重型 step 不再用 `src/**` 表达“它最终会经过 CLI”，而只登记直接实现 owner、公共入口和专属测试/资产。

低成本 `contract`、`cli-architecture` 继续提供全 `src/**` fallback，保证普通源码至少有静态/架构反馈和 inventory ownership。`managed-mutations` 如果实测仍为纯静态低成本检查，也可保留 broad owner；会创建 Workspace、tarball、npm install 或大量 CLI 子进程的 step 必须收窄。

替代方案是增加独立 `changedInputs` 字段。当前 `inputs` 的既有定义本来就是 Changed owner，新增字段只会制造双重事实，因此本次直接修正现有 inputs，并用代表路径 planner tests 固化选择上限和必需 owner。

### 2. Inputs 按实现所有权而不是最终可达性登记

Recovery 只由 builtin replacement/lifecycle、package sync/transaction、task-board predecessor assets 和 recovery tests 触发；普通 network、layout、CLI help 不得触发。Capability、CLI compatibility、package parity、release smoke 和 managed integrity 同样改为各自直接 owner 集合。

Planner 契约至少覆盖 network helper、product layout、CLI help、Workspace domain、builtin replacement 和 runtime publication 六类代表路径；断言 required owner 存在、已知无关重型 owner 不存在，并避免仅冻结脆弱的固定总 step 数。

### 3. Replacement 状态分类下沉到 unit owner

`createBuiltinReplacement()` 已通过依赖注入暴露 `handleSkillReplacement()`，适合在同进程中构造 predecessor/receipt/snapshot 状态。manifest target/source、replacement occupied、predecessor missing、uninstalled、recognized/unknown integrity 和 restore override 等分支由 unit table 覆盖，并断言 finding、restore outcome、mutation callback 和零副作用。

Candidate E2E 继续验证不能由 unit 证明的公开边界：真实 CLI diagnostics、完整 Workspace tree 零写入、mutation rollback、runtime source/receipt 收敛、最终 doctor 不假报成功、uninstalled 状态和历史 HTML 保留。每个主风险保留至少一条黄金路径，不用多个完整 Workspace 重复证明同一纯分类分支。

### 4. 只共享只读基础状态，mutation Workspace 始终隔离

Recovery 测试进程建立 source-only 与 with-runtime 基础 Workspace；基础目录创建后只读，每个测试使用 `fs.cpSync` 复制到独立临时目录再 mutation。source-only 基础只运行 `init`，不先 `sync codex` 后删除 `.agents`；with-runtime 基础才执行 sync。uninstalled 变体从 source-only 副本派生。

若复制后的 receipt、路径或权限无法保持真实语义，回退到“按测试创建但 source-only 跳过 sync”，不能为了速度共享可变 workspace。

### 5. 预算在优化后校准，不预先放宽

25 秒继续作为本 change 的观察目标。最终冻结 tree 先多轮运行 recovery focus，记录中位数和范围，再运行多轮 Candidate 核对关键路径。若 recovery 稳定进入 25 秒以内则保留；若优化后仍稳定超出，按中位数加合理余量调整到诚实预算。单次超时不改变正确性 status。

默认饱和型互斥已有反向并发更慢的同 tree 证据，本次不重新 A/B；只有 recovery 优化使关键路径结构发生明显变化时，后续 change 才重新评估资源 profile。

## Risks / Trade-offs

- [Inputs 过度收窄导致 Changed 漏跑] → 保留 contract/architecture broad fallback，为六类代表路径补 planner tests，并运行当前 inventory 全覆盖检查。
- [Unit 下沉削弱真实 CLI 保障] → 只下沉纯状态分类，E2E 保留成功、阻断、rollback、runtime、doctor 和 uninstalled 黄金路径。
- [基础 fixture 复制导致状态泄漏] → 基础目录只读，每个测试复制到唯一临时 root，test cleanup 只删除自己的副本。
- [共享准备掩盖 init/sync 回归] → init onboarding、Workspace lifecycle 和独立 recovery 黄金路径继续持有真实 init/sync owner。
- [预算为追求无 warning 被随意放宽] → 只基于同 tree 多轮成功中位数与波动调整，并记录优化前后场景覆盖一致性。

## Migration Plan

1. 先补 planner 与 builtin replacement unit 契约，确认当前代码下新增断言能暴露 broad selector 和缺失 unit owner。
2. 收窄 registry inputs，运行 planner/inventory affected 验证。
3. 下沉纯分类矩阵并重构 recovery fixture，逐条核对原 20 项语义映射。
4. 运行 recovery focus、多轮 timing 和完整 Candidate；依据最终数据决定预算值。
5. 仅更新验证职责和性能证据文档；不改变运行时迁移或用户数据。

回滚时可恢复 registry inputs 和 recovery 测试组织，不涉及产品数据迁移。

## Open Questions

无阻塞问题。预算最终值由实现后的冻结 tree 多轮证据决定，不在 proposal 阶段预设。
