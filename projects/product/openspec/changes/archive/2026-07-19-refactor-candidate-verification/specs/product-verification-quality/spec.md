## MODIFIED Requirements

### Requirement: 产品验证必须提供分层入口
Buildr 产品验证 MUST 提供 fast、affected、workspace 和 candidate 分层入口，使普通任务不默认执行候选版系统级验证、开发者可定点重跑 Workspace E2E，同时保证最终候选仍经过完整门禁。

#### Scenario: 普通任务运行默认测试
- **WHEN** 维护者或 Agent 在 Product checkout 运行 `npm test` 或 `npm run test:fast`
- **THEN** verifier MUST 运行 unit、架构、canonical spec quality/strict 和全部 runtime adapter 低成本契约
- **AND** verifier MUST NOT 创建临时用户 workspace、执行 npm pack/install、访问网络或运行 Workspace E2E

#### Scenario: 任务组运行 affected 验证
- **WHEN** 维护者为一个或多个改动领域运行 `npm run test:affected -- <group...>`
- **THEN** verifier MUST 先运行一次 fast 验证，再运行每个领域声明的专项 verifier
- **AND** 同一 verifier MUST 在该次组合中最多执行一次

#### Scenario: affected 参数无效或只请求帮助
- **WHEN** 维护者传入 `--help` 或未知 affected group
- **THEN** verifier MUST 在运行 fast gate 前完成帮助输出或 fail closed
- **AND** CLI 与 runtime adapter 的昂贵专项验证 MUST 使用独立 group identity

#### Scenario: 开发期间选择 Workspace E2E suite
- **WHEN** 维护者列出 suite 或运行 `npm run test:workspace -- <suite...>`
- **THEN** verifier MUST 使用稳定 suite identity 输出或执行所选 suites
- **AND** 每个所选 suite MUST 使用独立临时状态并保留独立失败结果
- **AND** 未知 selector MUST fail closed，重复 selector MUST 只执行一次

#### Scenario: 最终候选运行完整验证
- **WHEN** 实现、自然语言资产、生成资产和 review 修订已经冻结
- **THEN** 维护者或 CI MUST 运行 `npm run test:candidate`
- **AND** candidate verifier MUST 直接编排全部已登记 Workspace E2E suites，不得使用 selector 缩小覆盖范围
- **AND** candidate verifier MUST 保留产品要求的安全、onboarding、package、runtime adapter、release、managed data 和 OpenSpec 门禁及 timing summary

### Requirement: 候选验证必须避免重复制品和无边界串行执行
Buildr candidate verifier MUST 在同一冻结候选 run 内复用不可变 npm tarball，并 MUST 对已证明使用隔离状态的昂贵 verifier 和 Workspace E2E suites 采用有界并行，同时保持逐阶段失败和 timing 可观察性。

#### Scenario: 多个 verifier 使用候选 tarball
- **WHEN** candidate verifier 运行 tarball inventory、package parity 和 release smoke
- **THEN** orchestrator MUST 只生成一个候选 tarball 和对应 pack metadata
- **AND** 各 verifier MUST 使用该只读制品，但 MUST 继续使用彼此隔离的安装 prefix 和 workspace

#### Scenario: Workspace E2E suites 使用隔离状态
- **WHEN** candidate verifier 编排全部 Workspace E2E suites
- **THEN** 每个 suite MUST 创建和清理自己的临时 workspace、repo 与 diagnostics namespace
- **AND** suite MUST NOT 依赖其他 suite 的执行顺序或可变输出
- **AND** orchestrator MUST 将每个 suite 记录为独立 timing step

#### Scenario: standalone release smoke 没有共享制品
- **WHEN** release smoke 在 macOS、Windows 或独立本地命令中运行且没有收到候选 tarball
- **THEN** verifier MUST 自行执行 npm pack 并完成相同安装后生命周期

#### Scenario: 并行阶段发生失败
- **WHEN** 同一并行批次中的任一 verifier 返回非零状态
- **THEN** candidate verifier MUST 以非零状态失败
- **AND** timing summary MUST 保留失败 step 的名称、exitCode、durationMs 以及该批次已完成 step 的结果

### Requirement: 产品验证必须记录阶段耗时
Buildr 产品总验证 MUST 记录每个阶段和整体 wall-clock elapsed milliseconds，MUST 为 Candidate 总耗时和 Workspace E2E suites 声明目标预算，并 MUST 在成功或失败时生成可供 CI 保存的机器可读 timing summary。

#### Scenario: 完整验证成功
- **WHEN** 产品总验证全部通过
- **THEN** 人类输出 MUST 展示每个阶段的耗时和总耗时
- **AND** verifier MUST 写出包含 schemaVersion、steps、status、durationMs 和 totalDurationMs 的 JSON summary
- **AND** 有预算的 step 和总结果 MUST 同时记录 `budgetMs` 与 `budgetStatus`
- **AND** summary MUST 记录 Node、平台、架构和 CI 环境元数据
- **AND** 每个 Candidate step MUST 将 stdout/stderr 写入可保存的 diagnostics 文件并在 summary 中记录路径

#### Scenario: 某阶段失败
- **WHEN** 产品验证阶段返回非零状态
- **THEN** timing summary MUST 记录失败阶段、非零状态和已完成阶段耗时
- **AND** 产品验证 MUST 保持该阶段的失败退出状态
- **AND** Workspace E2E 独立运行失败时 MUST 保留失败 fixture 或等价诊断证据并输出位置

#### Scenario: 高耗时专项阶段运行
- **WHEN** Candidate 运行 capability、runtime parity、package、OpenSpec fixtures、onboarding 或其他已识别的高耗时阶段
- **THEN** verifier MUST 为该阶段声明非阻断目标预算
- **AND** 预算状态 MUST 与 Workspace E2E 和 Candidate 总预算使用相同语义

#### Scenario: 阶段超过目标预算
- **WHEN** 某个 Workspace E2E suite 或 Candidate 总耗时超过声明预算
- **THEN** verifier MUST 将对应 `budgetStatus` 记录为 `over` 并输出 warning
- **AND** verifier MUST NOT 仅因超过目标预算改变 step status 或候选退出码

#### Scenario: 阶段处于目标预算内
- **WHEN** 有预算的阶段耗时不超过声明预算
- **THEN** timing summary MUST 将对应 `budgetStatus` 记录为 `within`

## ADDED Requirements

### Requirement: 验证覆盖必须具有可追踪 owner
Buildr 产品验证 MUST 维护面向维护者的覆盖职责矩阵，使被删除的聚合 E2E 类别可以追溯到当前 focused verifier 或 Workspace E2E owner。

#### Scenario: 审查旧 MVP 覆盖迁移
- **WHEN** 维护者检查被删除的旧 MVP section
- **THEN** 职责矩阵 MUST 记录该类别的当前主 verifier 和删除或保留交叉覆盖的理由
- **AND** 文档 MUST 区分必要的发布边界交叉与可以继续收缩的重复验证

### Requirement: Workspace E2E 必须只覆盖跨组件黄金路径
Buildr Workspace E2E MUST 只保留必须通过多条真实命令、多个产品组件和同一 workspace 状态演进才能证明的黄金路径，并 MUST 将单命令 contract、全量 help、adapter 实现族 parity、onboarding 分支和 package inventory 交由对应 focused verifier 持有。

#### Scenario: 验证 Workspace 生命周期
- **WHEN** `workspace-lifecycle` suite 运行
- **THEN** verifier MUST 在同一临时 workspace 中完成初始化、Project/Service、代表性资产、Codex sync 和最终 doctor
- **AND** 最终 doctor MUST 没有 error、missing、stale 或 conflict

#### Scenario: 验证 ownership 与恢复
- **WHEN** `ownership-recovery` suite 运行
- **THEN** verifier MUST 验证代表性的受管资产 ownership 拒绝和恢复生命周期
- **AND** 被拒绝的操作 MUST 保留原有受管状态

#### Scenario: 验证 runtime reconciliation
- **WHEN** `runtime-reconciliation` suite 运行
- **THEN** verifier MUST 验证 Codex 主路径、Claude Code bridge 代表路径、workspace 源 Component drift 的 fail-closed 行为和恢复后的收敛状态

#### Scenario: focused verifier 持有单领域覆盖
- **WHEN** 维护者审查 Workspace E2E 覆盖
- **THEN** 全量 help MUST 由 CLI compatibility 持有
- **AND** 全 adapter 生命周期 MUST 由 runtime parity 持有
- **AND** onboarding 异常分支 MUST 由 onboarding integration 持有
- **AND** tarball inventory 和安装后发布生命周期 MUST 分别由 package/open-source verifier 与 release smoke 持有
