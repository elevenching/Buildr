## Context

当前统一 registry 同时记录 step identity、profile、group、inputs、dependsOn、预算和 executor，执行器已经能够按 DAG 并发调度。问题不在底层缺少抽象，而在上层把三种不同概念平铺成多个 `test:*`：unit/contract/integration 是证据语义，fast/changed/candidate 是门禁策略，affected/package/workspace/release 则是人工 selector。

此外，现有 `dependsOn` 混合了真实数据依赖与门禁顺序。例如 architecture step 并不消费 unit、contract 或 integration 的输出，却依赖三者；package focused step 也不消费 package-static 输出。配合 `tools/**` 等宽泛 inputs，局部 changed plan 会被依赖扩展为接近完整 Fast。Candidate profile 虽然仍然正确，但日常最小反馈失真。

## Goals / Non-Goals

**Goals:**

- 让维护者以三种主门禁理解验证：Fast、Changed、Candidate。
- 让所有局部重跑通过一个 `test:focus` 入口选择 step 或 group，且只展开真实依赖。
- 保持 registry 内部精细 step、独立 diagnostics、预算和并行能力。
- 让 changed inputs 表达真实测试 owner，并让完整 Candidate 无条件包含 docs quality。
- 给 repository onboarding、init onboarding、CLI parity 和 release smoke 明确唯一成功路径职责。

**Non-Goals:**

- 不以减少 Candidate step 数为目标，也不把 focused verifier 合并回串行大脚本。
- 不删除 Unit、Contract、Fast Integration、Package、Runtime、OpenSpec 或 Workspace E2E 的风险覆盖。
- 不改变 Buildr 对外 CLI、npm package 内容、workspace schema 或发布流程。
- 不在本 change 引入覆盖率阈值。

## Decisions

### 1. 三个主门禁，一个统一诊断入口

主要文档只推荐：

- `npm test`：固定低成本门禁；`test:fast` 作为等价别名保留。
- `npm run test:changed`：根据 Git diff 或显式路径自动规划。
- `npm run test:candidate`：冻结候选的完整发布门禁。

新增 `npm run test:focus -- <step-id|group:<group>>...`。它直接从统一 registry 选择 step/group、去重并展开真实依赖，支持列出选择器和只查看计划。`test:affected`、`test:package`、`test:workspace` 不再作为 package scripts 暴露；其执行能力分别由 group 或 step identity 覆盖。`test:release` 仅作为 Product scope 外跨平台 CI 的兼容 wrapper 保留，不进入维护者主入口。Unit、Contract、Fast Integration 的直接 scripts 继续保留，因为它们代表真实测试语义而不是领域 selector。

备选方案是保留全部旧命令并只修改文档，但 `npm run` 仍会展示同一批平级入口，不能真正降低维护者认知成本。另一方案是为 layer、package、workspace 分别增加新命令，会继续扩大表面，因此不采用。

### 2. `dependsOn` 只表达真实运行前置

只有后续 step 必须消费前一步生成的 artifact 或结果时才声明 `dependsOn`。profile 完整性、领域门禁和“希望先通过低成本测试”不属于数据依赖，由 profile/group 选择表达。

Candidate tarball consumers 继续依赖 `candidate-tarball`。其他 verifier 默认可独立执行；OpenSpec quality 与 strict、runtime contract 与 parity、package static 与 domain integration 即使在 Candidate 中共同出现，也不互相伪造执行前置。registry validation 将检查标记 `consumesArtifact` 的 executor 必须声明相应 artifact 依赖。

备选方案是新增 `gateAfter` 等第二种边，但当前 scheduler 不需要门禁顺序即可保持正确，增加边类型只会引入额外复杂度。

### 3. Changed inputs 以测试 owner 而不是目录兜底

Unit、Contract、Fast Integration 只声明其测试文件及实际直接覆盖的生产模块；CLI architecture 只声明它真正审查的架构范围。Product inventory 仍必须被至少一个 owner 或显式 ignore 覆盖，未映射路径继续 fail closed。

对于跨目录风险，优先把具体路径交给 focused verifier，而不是通过 `tools/**` 迫使所有代码变化运行三层低成本测试。新增模块若没有 owner，inventory contract 会要求维护者明确选择，而不是静默继承宽泛兜底。

### 4. Candidate 完整性按 required gates 验证，不冻结数量

Candidate 无条件包含 `docs-quality`。元测试验证：所有标记为 candidate profile 的 required gate 均被选择、所有 artifact consumer 具有真实依赖、registry 合法且 changed inventory 完整。测试不再断言 Candidate 永远恰好为某个 step 数；step 数继续作为可观察结果而不是契约。

### 5. Onboarding 成功路径按分发边界唯一归属

- `init-onboarding` 持有 checkout CLI 的参数、source-only、幂等、冲突和恢复提示。
- `repository-onboarding` 持有干净 Git checkout、本地开发 CLI 安装和 update source 识别，不再重复 init/doctor happy path。
- `cli-package-parity` 只证明 checkout 与 tarball CLI 输出及代表 mutation 结果一致。
- `release-tarball-smoke` 持有安装后 init/sync/doctor/uninstall 生命周期。

交叉步骤可以调用同一命令，但不得重复把“初始化成功”作为自己的主断言。公共 fixture/helper 只在确实减少相同 setup 时提取，不为了代码复用耦合隔离状态。

### 6. Coverage 使用观测语义

将主要入口命名为 `coverage:unit`；它仍只执行 Unit owner 并输出版本化 summary，不进入 Candidate 硬门禁。文档明确它是观测工具，不是第六种验证层。

## Risks / Trade-offs

- [旧的维护命令被本地脚本或个人习惯使用] → 在 release notes 和验证文档给出一对一 `test:focus` 迁移表；历史 CI 使用的 Candidate wrapper 保持不变。
- [收窄 inputs 后遗漏真实影响] → 保留 inventory fail-closed contract，并为 owner mapping 增加正反例测试；实现期间审查所有当前 Product 文件映射。
- [移除假依赖后 focused step 不再自动携带 Fast] → 这是预期行为；日常任务先用 Changed，最终候选用 Candidate，focus 仅用于定位和失败重跑。
- [Candidate 增加 docs quality 后暴露历史问题] → 在本 change 内修复现有文档 finding，Candidate 不能以 diff 为由跳过。
- [减少 onboarding 重复后丢失集成证据] → 先建立每个分发边界的主断言矩阵，再删除重复 assertion；release smoke 仍保留完整安装后黄金路径。

## Migration Plan

1. 先增加 focus planner/入口和测试，证明所有旧 selector 都有等价 step/group。
2. 调整 registry 依赖、inputs、Candidate docs gate 和元测试，保持 Candidate 风险 owner 不减少。
3. 收缩 repository onboarding 重复路径，更新职责矩阵和 release checklist。
4. 移除旧 affected/package/workspace scripts，保留跨平台 CI 消费的 release smoke 兼容 wrapper，更新当前 Product 源码与维护文档引用；归档 artifacts 中的历史命令不改写。
5. 运行 changed plan、focus 代表 selector、Fast、相关 affected 兼容底层检查和最终 Candidate。

若需要回滚，可恢复旧 package scripts 和 registry dependency/input 声明；底层 verifier 文件与风险断言均未删除。

## Open Questions

无。实现确认 Product scope 外的 macOS/Windows CI 仍调用 `test:release`，因此该 script 明确保留为跨平台兼容 wrapper；维护文档和日常定位仍统一使用 Focus。
