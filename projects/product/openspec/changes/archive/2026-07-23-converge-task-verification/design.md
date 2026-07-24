## Context

Buildr 已有统一 verification registry、`test:changed`、`test:focus` 和完整 `test:candidate`，但 Project policy、`task-verification` 与 Task Finish 仍以 Minimal/Affected/Candidate 三级概念对外表达，并由 Task Finish 固定要求 Candidate。与此同时，本机应用 browser smoke 是声明外的单体执行入口，没有进入 changed planner；registry 中若干 `src/**` owner 还会把局部页面改动扩大为无关验证。

本次变化跨越 capability contract、两个 consumer/provider Skills、package/runtime 投射、Product planner 和浏览器测试，必须保持 Buildr 不与 Agent 抢任务理解：Project policy 定义稳定门禁，task-verification 选择并证明验证，Task Finish 只编排交付。

## Goals / Non-Goals

**Goals:**

- 普通开发和普通收尾使用受影响验证；发布、高风险和显式完整验证使用 Candidate。
- 由 task-verification 单点决定 `requiredAssurance`，Task Finish 不复制测试选择或风险政策。
- 把 browser 作为 integration 的一种，拆成可独立路由的四条稳定流程。
- 收窄 Changed owner，减少实现文本断言，用直接低层 owner 与真实用户路径形成互补证据。
- 保持 Candidate 完整性、identity 绑定、计时、复用、失败和 evidence 清理语义。

**Non-Goals:**

- 本 change 不修改 `projects/product/verification.yml`，不提升 browser maturity/enforcement。
- 不删除 Candidate required gates，不让 Candidate 按 diff 缩小。
- 不引入浏览器自动下载、外部服务或新的前端测试框架。
- 不修改 Component 管理的外部 `openspec-*` Skill 源。

## Decisions

### 1. 使用 v2 contract 显式表达所需保证

新增 `buildr.task-verification/v2`，Result Evidence 必须包含 `requiredAssurance: affected | candidate`。默认 provider 改为提供 v2，Task Finish 改为 required consumer v2；v1 源与默认 binding 从 package baseline 移除，避免同一默认流程存在两种结果解释。

选择 major upgrade 而不是给 v1 静默加字段，因为普通 Task Finish 从“必须 Candidate”变为“按 provider 决定”，改变了 consumer 的放行语义与结果证据保证。

### 2. 两个正式保证，minimal 保留为内部反馈动作

- `affected`：普通实现完成、普通 Task Finish 和最终内容变化后的日常交付保证。
- `candidate`：发布、Project 明示高风险、用户明确完整验证的保证。
- `minimal`：实现循环中的快速反馈，不作为 Task Finish 可接受的正式保证。

Project 声明、Rules、OpenSpec 和发布文档仍是风险/门禁 authority。Task Finish 只传递可观察事实，不维护路径名单。

### 3. Task Finish 只比较 requiredAssurance 与 evidence

Task Finish 向 provider 提交任务/change、发布意图、改动范围、候选 identity 与已有 evidence。Provider 返回所需保证、执行或复用决策及 evidence。Task Finish 只有在 `status: passed`、`level == requiredAssurance`、identity 匹配且 `reusable: true` 时继续。

closeout-only metadata 继续独立组合；implementation content 变化时重新请求同一 `requiredAssurance`，不机械升级为 Candidate。

### 4. Browser step 与 fixture 分离

共享 fixture 只负责创建临时 Workspace、启动 loopback server、启动本机 Chrome 和清理资源。四个独立 step 分别持有 Project、Service、Change、Shell 流程，可通过统一 browser runner 和 selector 执行。Candidate 是否包含这些 step 仍由当前 registry profile 决定；在 `verification.yml` 未更新前，不改变其 Project capability maturity。

### 5. Changed registry 是精确执行 authority

为本机应用快速检查和四个 browser step 声明具体 inputs；收窄 CLI architecture、managed mutations 等宽泛 `src/**`。任何新 Product path 仍必须命中真实 owner或显式 ignore，planner 继续 fail closed。

Browser 只验证用户可见接线和关键流程；HTTP 状态、session、revision、路径逃逸等由低层 integration 持有。已有读取源码正则、但不证明行为的断言在建立替代 owner 后删除。

### 6. 对外报告保持简洁，内部 evidence 保持完整

普通用户报告只突出“受影响验证”或“完整候选验证”、结果、耗时和跳过/阻塞风险。能力集合、operation counts、identity 和 retention 等字段继续进入结构化 evidence，供 Task Finish 和诊断使用。

## Risks / Trade-offs

- [风险] 普通收尾不再全量 Candidate，可能降低每次任务的全局回归概率。→ 通过精确 Changed owner、未映射路径 fail closed、高风险政策和发布 Candidate 保持防线。
- [风险] v2 迁移遗漏 package/runtime 副本会导致 consumer blocked。→ 原子更新 contract、manifest、package targets、fixtures 和全部 supported runtime parity 测试。
- [风险] 收窄 `src/**` 后出现漏测。→ 为代表路径增加 planner 断言，并保留全 inventory owner audit。
- [风险] Browser 拆分后 fixture 重复初始化增加总耗时。→ runner 支持显式多个 selector 时在同一进程共享 fixture；单 selector 只执行自身流程。
- [风险] 暂不更新 `verification.yml` 会让声明暂时仍展示旧 browser smoke。→ 本 change 只落地执行能力和 Skill 协作，最终报告明确声明未更新；后续单独审阅成熟度与声明。

## Migration Plan

1. 添加 v2 contract 与 package target，迁移 provider/consumer provides、requires 和 binding。
2. 更新 Skill、fixtures、contract tests 和产品文档，确认所有 runtime adapter binding ready。
3. 拆分 browser runner/steps，补低层 owner并收窄 registry inputs。
4. 运行 focused/changed 验证，确认 `verification.yml` 无 diff。
5. 冻结最终候选后按当前 change 要求运行 Candidate；正式归档和 sync 留给后续“收尾”。

回滚时整体恢复 v1 contract、provider/consumer binding、原 browser command 和 registry；不得只回滚 manifest 或单个 Skill。

## Open Questions

无。Project `verification.yml` 的最终 capability 拆分与 browser maturity 由后续独立审阅决定。
