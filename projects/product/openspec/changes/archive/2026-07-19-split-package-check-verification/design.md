## Context

第一批次已经移除旧 MVP shell、把 Workspace E2E 拆成隔离 suites，并让 Candidate 记录 step 预算和 diagnostics。剩余最大的黑盒是 `buildr package check`：静态校验位于 `static-validation.mjs`，但 `smoke-checks.mjs` 仍在共享临时 workspace 中顺序执行 init、Project、Commands、Rules、Skills、doctor 和 runtime Rules 行为，Candidate 只能看到一个约 16 秒的聚合 step。

`package check` 同时是公开的产品维护命令，不能为了 Candidate 提速而删除其完整门禁；需要把“命令聚合”与“场景所有权”分开。

## Goals / Non-Goals

**Goals:**

- 为 package static、workspace baseline smoke、Commands/Rules/Skills/runtime focused integration 建立稳定 verifier identity。
- Candidate 直接编排独立 steps，获得阶段耗时、预算、diagnostics 和失败后定点重跑能力。
- `buildr package check` 复用同一 verifier registry，保持全量聚合和兼容输出。
- 删除重复场景前先迁移断言并用覆盖矩阵/自动测试证明所有权。

**Non-Goals:**

- 不改变 package manifest、workspace baseline 或 CLI 公共参数。
- 不在本批次实现基于 Git diff 的自动 affected planner。
- 不在本批次系统性提升 unit coverage；该工作保留为驾驶舱后续批次。
- 不追求通过并行隐藏共享状态；只有状态隔离后才允许并行。

## Decisions

### 1. 使用 verifier registry，而不是为 `package check` 增加公开 selector

在 `tools/verification/package/` 建立内部稳定入口和 registry。Candidate、affected 与 package maintenance facade 复用同一 step 定义；`buildr package check` 继续无参数执行全量聚合。

选择内部入口是因为 selector 属于维护编排能力，不应扩大公开 CLI 契约。备选方案是在 `buildr package check --section` 上增加参数，但会让内部验证拓扑变成长期公共 API。

### 2. 静态验证与进程型场景使用不同执行模型

静态 verifier 复用现有 `createPackageStaticValidator`，只读取源码和 package assets。workspace/domain verifier 通过 Node executable 创建独立 fixture 并运行真实 CLI 进程。聚合层接收统一的 step result，但不强迫静态函数通过子进程间接调用。

这样可以保留静态校验效率，并确保行为契约仍经过真实 CLI。备选方案是所有 verifier 都通过 `buildr package check` 子进程，会重新产生黑盒与递归编排。

### 3. 以契约所有权拆分 smoke，而不是机械按文件行数切分

- package workspace smoke：init baseline、Project baseline、existing `AGENTS.md` 兼容、最终 doctor。
- Commands integration：manifest collection 与代表性 add/remove/error。
- Rules integration：注册生命周期与 recursive discovery。
- Skills integration：local/remote source 生命周期。
- runtime Rules integration：Codex native diagnostics 与 Claude bridge reconcile。

已有 runtime parity、CLI compatibility、Workspace E2E 已持有的完整矩阵不在 package verifier 重复。只在 package 随包默认资产与领域契约交界处保留代表断言。

### 4. Candidate 直接编排 steps，package check 只做兼容聚合

Candidate 不再执行单一 `buildr package check`，而是读取 package registry 并把各 entry 交给现有 timing runner。`buildr package check` 仍按 registry 全量运行并汇总问题，因此本地维护命令和 Candidate 使用相同事实源，但 Candidate 可独立计时和诊断。

### 5. 失败时保留 fixture 与 step diagnostics

进程型 verifier 使用各自临时目录；成功时清理，失败时输出 retained fixture 路径。Candidate 的 stdout/stderr diagnostics 继续由 timing runner 收集。这样既避免成功运行遗留临时数据，又让失败可复现。

## Risks / Trade-offs

- [拆分时遗漏旧断言] → 先建立旧函数断言清单和新 owner 映射，迁移后用架构测试禁止重新聚合，并运行完整 Candidate。
- [package check 与 Candidate registry 漂移] → 两者导入同一 registry，入口测试断言 step identity 唯一且完整。
- [领域 verifier 仍共享 fixture] → 每个 executable 自建 fixture；并行前由测试验证目录和输出隔离。
- [步骤变多增加启动开销] → 优先拆成少量语义 steps，并用预算数据决定是否进一步合并或并行，不能以牺牲诊断边界换取毫秒级优化。
- [公开输出变化影响维护脚本] → 保留最终成功文案和非零失败语义；新增的 step 前缀属于诊断增强，不改变 JSON 公共契约（当前 package check 无 JSON）。

## Migration Plan

1. 为旧 `smoke-checks.mjs` 的断言建立 owner 清单和回归测试。
2. 新建 package verifier registry 与独立 executable，先迁移静态和 workspace baseline。
3. 迁移 Commands、Rules、Skills、runtime assertions，确保每个 focused verifier 可单独通过。
4. 让 `buildr package check` 与 Candidate/affected 复用 registry，补预算和 diagnostics 测试。
5. 更新覆盖矩阵和维护文档，运行 affected、package aggregate 和完整 Candidate。

若迁移失败，回滚 Candidate registry 调用并恢复原聚合入口；在所有断言完成归属验证前不删除旧 smoke 实现。

## Open Questions

- 领域 integration 最终采用四个独立 steps，还是将低成本 Commands/Rules/Skills 生命周期合并为一个 `package asset lifecycle` step，应以基线耗时和失败定位收益决定。
- `test:affected -- package` 是否直接执行全部 package steps，还是增加内部 selector 供维护者定点重跑，将在实现时结合现有 affected 入口兼容性确定。
