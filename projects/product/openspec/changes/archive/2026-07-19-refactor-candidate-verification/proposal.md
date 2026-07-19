## Why

当前 Candidate verification 已具备顶层分层与并行编排，但 Workspace E2E 仍以一个共享临时 workspace 的大型 MVP shell 串行运行，导致失败后难以定点重跑、职责与 CLI compatibility/onboarding/runtime parity 重叠，阶段耗时也只有观测数据而没有明确预算。现在需要把端到端生命周期保障收敛为 Candidate 内可独立编排的 suites，在不削弱完整候选门禁的前提下缩短反馈路径并提高失败定位质量。

## What Changes

- 将 `MVP E2E` 的维护概念替换为 `Workspace E2E suites`，按 workspace lifecycle、ownership recovery 和 runtime reconciliation 三条独立状态边界拆分；packed onboarding 由现有 release smoke 独立持有。
- 让 Candidate orchestrator 直接编排全部 Workspace E2E suites，并保留完整候选必须执行全部 suites 的 fail-closed 语义。
- 提供面向开发期的 Workspace E2E suite 列表与 selector，支持单独执行、组合执行和失败后定点重跑；selector 不改变完整 Candidate 的覆盖范围。
- 把全量 help、onboarding 分支和 runtime adapter parity 等重复断言收敛到各自 focused verifier，Workspace E2E 只保留必须依赖跨组件连续状态演进的黄金路径。
- 为 Candidate 与 Workspace E2E 阶段建立机器可读的目标预算和 warning 输出；0.1 阶段预算只用于趋势与优化，不因普通耗时波动阻断候选。
- 修复 Candidate 诊断产物、affected 参数预校验和高耗时阶段预算，使文档、CI artifact 与实际行为一致，并用持久覆盖职责矩阵记录旧 MVP assertions 的迁移归属。
- 更新维护文档、架构检查和验证入口测试，移除 `MVP` 作为测试套件名称；产品功能的 MVP 边界不受影响。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 调整完整 Candidate 的 Workspace E2E 覆盖契约，新增独立 suite selector、重复覆盖边界和阶段耗时预算语义。
- `npm-cli-package`: 将安装后 package lifecycle 的验证 owner 从旧 MVP 入口迁移到独立 release smoke，并保持 Candidate 聚合覆盖。

## Impact

- 影响 `tools/verification/candidate.mjs`、`tools/verify-buildr-product-mvp`、`tools/verify/mvp/`、timing reporter、验证架构检查和 `package.json` 测试入口。
- 影响 `docs/cli-architecture.md`、`docs/release-checklist.md` 及验证质量 canonical spec。
- 新增面向维护者的 verification ownership 文档；后续拆分 `package check`、建立 verification DAG 和探索 unit 覆盖率由任务驾驶舱分批跟踪，不在本 change 中提前实现。
- 不改变 Buildr CLI 的用户命令、JSON schema、workspace 资产语义或 npm package 的公开运行时内容。
