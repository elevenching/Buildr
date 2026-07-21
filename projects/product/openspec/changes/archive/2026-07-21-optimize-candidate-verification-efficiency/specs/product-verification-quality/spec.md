## MODIFIED Requirements

### Requirement: 产品验证必须提供分层入口
Buildr 产品验证 MUST 将测试证据层、主要门禁和故障定位入口明确分离：维护者主要工作流 MUST 收敛为 fast、changed 和 candidate 三种门禁，Unit、Contract 与 Fast Integration MUST 保留直接定位入口；Fast MUST 只包含可频繁执行的低成本证据，需要多轮真实 workspace/Git 演进、大量 CLI 子进程或失败恢复矩阵的 verifier MUST 使用独立 Candidate-only step identity，并 MUST 仍可由 changed/focus 定点选择。

#### Scenario: 普通任务运行默认测试
- **WHEN** 维护者或 Agent 在 Product checkout 运行 `npm test` 或 `npm run test:fast`
- **THEN** verifier MUST 运行 Unit、Contract、低成本 Fast Integration、架构、canonical spec quality/strict 和全部 runtime adapter 低成本契约
- **AND** verifier MUST NOT 执行 builtin replacement/migration/recovery 失败矩阵、多轮真实 workspace/Git 演进、npm pack/install、网络访问或 Workspace E2E

#### Scenario: 根据改动运行验证
- **WHEN** 维护者或 Agent 运行 `npm run test:changed`
- **THEN** verifier MUST 根据 Git diff 或显式 Product 路径选择最小验证 DAG
- **AND** 实现路径命中重型 recovery/migration 主 owner 时 MUST 选择对应 Candidate-only focused step，不得因其不属于 Fast 而跳过
- **AND** 计划 MUST 解释每个 step 的选择原因并对未映射路径 fail closed

#### Scenario: 定点重跑 step 或领域
- **WHEN** 维护者运行 `npm run test:focus -- <step-id|group:<group>>...`
- **THEN** verifier MUST 从统一 registry 选择并去重对应 step
- **AND** verifier MUST 只展开真实执行依赖，不得无条件附加完整 Fast
- **AND** 未知 selector MUST 在启动验证进程前 fail closed

#### Scenario: 定位低成本测试层
- **WHEN** 维护者直接运行 Unit、Contract 或 Fast Integration script
- **THEN** 每个入口 MUST 只执行对应证据层
- **AND** 这些入口 MUST NOT 被描述为独立发布门禁

#### Scenario: 最终候选运行完整验证
- **WHEN** 实现、自然语言资产、生成资产和 review 修订已经冻结
- **THEN** 维护者或 CI MUST 运行 `npm run test:candidate`
- **AND** candidate verifier MUST 直接编排全部 candidate profile steps，包括从 Fast 拆出的 recovery/migration 和真实 workspace/Git steps
- **AND** candidate verifier MUST NOT 使用 diff、group 或 step selector 缩小覆盖范围
- **AND** candidate verifier MUST 保留产品要求的文档、安全、onboarding、package、runtime adapter、release、managed data、Workspace E2E、OpenSpec 门禁及 timing summary

### Requirement: runtime adapter 验证必须按契约和实现族分层
Buildr 产品验证 MUST 对全部 supported runtime adapter 执行低成本 descriptor/plan/capability evidence 契约，并 MUST 从 runtime trait/implementation registry 生成实现族覆盖矩阵；昂贵 CLI 生命周期 MUST 仅按不同投射、skills root、checker、activation 或 cleanup 实现语义选择代表，不得因品牌数量重复共享实现的完整生命周期；Candidate MUST NOT 生成或执行真实 Agent marker smoke workspace。

#### Scenario: 验证全部 supported adapter
- **WHEN** fast 或 candidate verifier 运行 runtime adapter contract
- **THEN** contract MUST 遍历全部 supported adapter 的 traits、target、activation、capability evidence、inventory assurance 和 RuntimePlan 安全边界
- **AND** contract MUST 输出实现族覆盖矩阵并在新 adapter 没有代表性 parity owner 时 fail closed

#### Scenario: 验证昂贵 adapter 生命周期
- **WHEN** affected CLI 或 candidate verifier 运行 runtime adapter parity
- **THEN** verifier MUST 覆盖 native recursive、per-source reference、same-directory vendor、central vendor 和 root-index bridge 等不同实现族
- **AND** 每个实现族代表 MUST 保留 install、render、runtime check、幂等、orphan/uninstall/restore/cleanup 等该实现族适用的黑盒证据
- **AND** 品牌特有 path、checker probe 或 activation 差异 MUST 保留定点断言
- **AND** verifier MUST NOT 仅因多个 adapter 品牌复用同一实现而重复完整 install/render/check/idempotency 生命周期

#### Scenario: 共享 parity 准备
- **WHEN** 多个实现族验证需要相同 package source、descriptor 或不变解析结果
- **THEN** verifier MAY 在同一 parity run 中共享这些只读准备
- **AND** 每个涉及 mutation 的 adapter/implementation family MUST 继续使用独立 workspace、receipt 和 target namespace

#### Scenario: scoped render 隔离无关 Project
- **WHEN** verifier 对某个 Project 执行 scoped render 和 cleanup
- **THEN** verifier MUST 验证无关 Project 的受管投射仍然存在且内容不变
- **AND** 该回归 MUST 覆盖 same-directory vendor、central vendor 和 root-index bridge cleanup 模型

#### Scenario: Agent runtime marker smoke 暂不属于 Candidate
- **WHEN** Candidate 编排 runtime adapter 验证
- **THEN** registry MUST NOT 包含 Agent runtime marker smoke workspace generator 或真实 Agent invocation step
- **AND** contract tests MUST NOT 固化某个品牌的历史 smoke status、marker result、product version 或 surface 快照
- **AND** npm release smoke、package smoke 和 workspace lifecycle E2E MUST 保持各自既有 owner 与覆盖

## ADDED Requirements

### Requirement: Candidate 调度必须避免资源饱和型 verifier 互相放大
Buildr verification registry 和 scheduler MUST 能表达子进程/文件系统饱和型 verifier 的资源约束，并 MUST 在当前执行策略下防止这些 steps 超过已验证的同时运行上限；调度策略 MUST 被 timing summary 记录，且 MUST NOT 改变 Candidate required step 集合。

#### Scenario: 资源受限 CI 运行 Candidate
- **WHEN** Candidate 在已声明资源受限的 CI execution profile 下运行
- **THEN** scheduler MUST 使用该 profile 已验证的 global/class/饱和型并发上限
- **AND** `integration-fast` 拆分后的重型 owner 与 `runtime-adapter-parity` MUST NOT 在超过该上限时同时扩张子进程
- **AND** summary MUST 记录 execution profile、并发上限、step 调度时间线与 queue duration

#### Scenario: 本地维护者运行 Candidate
- **WHEN** Candidate 在本地默认 execution profile 下运行
- **THEN** scheduler MUST 使用已登记且可观测的本地并发策略
- **AND** 本地与 CI profile MUST 使用相同 registry、required steps、dependencies 和 executors

#### Scenario: 未知调度 profile
- **WHEN** 调用方请求未登记的 verification execution profile 或非法并发上限
- **THEN** planner/scheduler MUST 在启动任何 verifier 前 fail closed
- **AND** 诊断 MUST 标识未知 profile 或无效限制

### Requirement: 验证效率优化必须用同 tree 多轮证据验收
Buildr Product MUST 在改变 Fast 边界、Candidate 调度或 runtime parity 覆盖矩阵时，使用同一冻结 Candidate tree 的多轮成功 timing 证据对比基线与候选策略，并 MUST 同时验证 owner/required step/关键场景覆盖不减少；性能结果 MUST 保持非阻断观察语义。

#### Scenario: 对比 Candidate 调度策略
- **WHEN** 维护者评估新的 concurrency class/profile 或饱和型互斥策略
- **THEN** 对照与候选 runs MUST 绑定同一 repository、Product root 和 Candidate tree/fingerprint
- **AND** 每种策略 MUST 记录多轮成功的整体 wall-clock、重项 executor duration、queue duration、中位数与波动范围
- **AND** 候选策略 MUST 保留与基线相同的 Candidate required step identities 与关键覆盖断言

#### Scenario: 性能证据波动或单次超预算
- **WHEN** 单次 run 超过目标预算或不同 runs 出现环境波动
- **THEN** verifier MUST 保留 warning、timing 和环境元数据
- **AND** verifier MUST NOT 仅因该耗时结果把已通过的正确性 step 改为 failed
