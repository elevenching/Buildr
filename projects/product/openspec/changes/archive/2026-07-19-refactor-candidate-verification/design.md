## Context

Candidate orchestrator 已将 unit、OpenSpec、package、runtime、onboarding、release 等 verifier 分批执行，并复用同一候选 tarball。遗留的 `verify-buildr-product-mvp` 则把二十多个 section 放在同一 shell 进程和共享 `$tmp` 中：它既承担真实 workspace 状态演进，也重复检查 help、adapter parity、onboarding 分支和 package inventory。该结构使一个失败只能重跑整段流程，也阻止 Candidate 把内部阶段作为独立 timing step 编排。

本变更只调整 Buildr Product 的维护验证框架。产品文档中的“Buildr MVP”仍表示产品能力边界；测试套件不再使用容易混淆的 MVP 名称。

## Goals / Non-Goals

**Goals:**

- 以少量黄金路径保留跨命令、跨资产、同一 workspace 状态演进的 E2E 保障。
- 将 Workspace E2E 拆成拥有独立临时状态和清理逻辑的 suites，由 Candidate 直接编排。
- 允许维护者列出、单独选择或组合执行 suites，且完整 Candidate 永远运行全部 suites。
- 明确 focused verifier 与 Workspace E2E 的覆盖所有权，删除 help、onboarding、runtime parity 和 package inventory 的重复断言。
- 在 timing summary 中记录阶段预算、预算状态和非阻断 warning，为后续优化建立稳定比较边界。

**Non-Goals:**

- 本 change 不实现基于 Git diff 的自动 `test:changed` planner；affected 仍由维护者选择 group。
- 不改变 Buildr CLI 命令、workspace 资产格式、runtime adapter 行为或发布生命周期。
- 不把耗时预算升级为 release 阻断阈值，也不承诺所有机器达到相同绝对耗时。
- 不保留历史 MVP shell 的逐断言一一映射；只有具有独立契约价值的覆盖才迁移到 focused verifier 或黄金路径。

## Decisions

### 1. Candidate 是唯一完整门禁，Workspace E2E 是可复用 suite 集合

新增稳定维护入口 `npm run test:workspace -- [suite...]`。无参数时运行全部 suites，`--list` 输出机器稳定的 suite id；未知或重复 selector fail closed/去重。Candidate 不通过 selector 调用“默认集合”，而是从同一 suite registry 显式取得全部 suite definitions，以防未来默认行为漂移导致完整门禁漏测。

备选方案是保留 `test:mvp` 并为 shell section 增加跳转开关。该方案仍依赖共享 `$tmp` 和隐式前置状态，不能证明独立重跑，因此不采用。

### 2. Workspace E2E 只保留三个黄金路径

- `workspace-lifecycle`：`init → project/service → representative assets → sync → doctor`，证明主要领域可在同一真实 workspace 中组合。
- `ownership-recovery`：验证代表性的 Component/内置资产 ownership 拒绝、冲突保护和可恢复生命周期。
- `runtime-reconciliation`：验证 Codex 主路径、Claude bridge 代表路径，以及 workspace 源 Component drift 阻断 reconciliation 与恢复。

正式 tarball 的 `install → init → sync → doctor → optional component uninstall → doctor` 已由 `release-smoke.mjs` 持有；package inventory 由 open-source candidate/package checks 持有；因此不再放入 Workspace E2E。全量 help 由 CLI compatibility 持有，全 adapter 生命周期由 runtime parity 持有，onboarding 的 unsupported/idempotency/conflict 分支由 onboarding integration 持有。

### 3. 每个 suite 使用独立进程和临时根

suite 使用 Node verifier 实现，统一通过共享 helper 创建临时根、执行 CLI、捕获诊断并在 finally 中清理。suite 不使用固定 `/tmp/buildr-product-mvp-*` 路径、不共享安装 prefix、不修改主 worktree，因此 Candidate 可以在有界批次中并行执行。

备选方案是继续 source shell fragments 并复制基础 fixture。它会复制大量环境变量、锁、后台 HTTP server 和 hard-coded diagnostics，隔离证明成本高于重建三条黄金路径，因此不采用。

### 4. 覆盖迁移以职责矩阵和架构检查约束

维护文档记录每类行为的唯一主 verifier。CLI architecture verifier 检查遗留 MVP 入口/目录已移除、Workspace suite registry 完整、Candidate 使用全部 suite definitions、package scripts 暴露 selector，并阻止重新引入固定 MVP diagnostic path。

删除旧断言前按类别审查：已有 focused verifier 的重复覆盖直接删除；没有 focused 覆盖且仍属于关键契约的行为迁入对应 suite 或 verifier；只验证历史文案/实现细节且不再代表契约的断言删除。

### 5. 预算是机器可读目标，不是失败条件

预算定义与 suite registry/candidate config 同源，至少包含 Candidate 总预算和每个 Workspace E2E suite 的阶段预算。timing summary 为每个有预算的 step 输出 `budgetMs` 与 `budgetStatus`（`within` 或 `over`），总结果输出相同字段；超预算时 stdout/stderr 给出 warning，但 step status 和候选 exit code 只由功能验证结果决定。

初始预算用于表达优化目标并允许后续根据 CI 历史单独调整。未来若要把预算变成阻断门禁，必须通过新的 OpenSpec change 定义运行环境、统计窗口和容差。

### 6. Candidate 诊断必须是可保存的真实产物

Candidate 为每个 step 把 stdout/stderr 写入 diagnostics directory，并在 timing summary 中记录对应路径；summary 同时记录 Node、平台、架构和 CI 标识。Workspace E2E 直接运行失败时默认保留失败 fixture 并输出位置，成功时继续清理。CI 只在失败时上传 diagnostics，但本地完整 Candidate 无论成功失败都可从 summary 定位 step 日志。

### 7. affected 在执行前完成参数规划

`test:affected` 在启动 fast gate 前处理 `--help`、校验全部 group 并去重；未知 group 不应先消耗一次 fast。`cli` 只持有 CLI surface/parity，昂贵 runtime adapter parity 使用独立 `runtime` group。该入口继续是人工领域选择器；diff-aware planner 留给后续独立批次。

### 8. 覆盖迁移留下持久职责证据

维护文档以旧 MVP section 类别为粒度记录 focused verifier owner、Workspace E2E 代表路径和删除理由。矩阵不要求逐条复制历史 shell assertion，但必须让维护者能够判断某一类契约由谁持有，并明确有意保留的边界交叉。

## Risks / Trade-offs

- [删除大型 MVP 后遗漏罕见集成分支] → 建立覆盖职责矩阵，并在删除前把仍具契约价值但无 focused owner 的断言迁移到对应 verifier。
- [独立 suites 重复初始化带来固定成本] → Candidate 有界并行；每个 suite 只准备自身最小 fixture，不共享可变 workspace。
- [并行进程争用磁盘导致耗时波动] → 预算只 warning；timing 保留独立阶段，便于区分真实回归与环境抖动。
- [selector 被误用来证明完整候选] → Candidate 从 registry 强制运行全部 suites，文档明确 selector 仅用于开发反馈。
- [旧脚本路径被外部调用] → `test:candidate` 和历史 `tools/verify-buildr-product` 保持兼容；内部 `verify-buildr-product-mvp` 明确不是公开接口，不提供兼容 wrapper。

## Migration Plan

1. 建立 suite registry、runner、共享测试 helper 和 selector contract tests。
2. 实现三个独立黄金路径，并用 focused verifier 补齐审查后仍必要的覆盖。
3. Candidate 改为直接并行编排全部 suites，timing reporter 增加预算字段和 warning。
4. 删除旧 MVP shell 入口与 fragments，更新 architecture verifier、package scripts 和维护文档。
5. 先运行 affected CLI/package/OpenSpec 验证，再在最终冻结 tree 上运行完整 Candidate；如新 suites 失败，可用 selector 单独复现。

回滚时可恢复旧 MVP 聚合入口和 Candidate 单 step 调用；该变更不迁移用户数据，也不影响发布包运行时资产。

## Open Questions

无。预算在本 change 中仅作为可调整的维护配置，不作为产品兼容承诺。
