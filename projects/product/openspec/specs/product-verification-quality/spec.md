# Buildr 产品验证质量

## Purpose

定义 Buildr 候选版本的 Node/操作系统验证范围、正式 tarball 生命周期 smoke，以及可观察但不阻塞的验证耗时记录。

## Requirements
### Requirement: CI 必须覆盖最低 Node、当前 Node 和目标桌面平台
Buildr CI MUST 在 Linux Node 20 和 Node 22 上运行完整产品候选验证，并 MUST 在 macOS、Windows Node 22 上运行可移植 release smoke；CI MUST NOT 为已经由 Linux Node 22 完整验证覆盖的相同 release lifecycle 建立独立 Linux smoke job。

#### Scenario: 验证最低 Node 版本
- **WHEN** push 或 pull request 触发产品 CI
- **THEN** Linux Node 20 job MUST 安装锁定依赖和支持的 OpenSpec CLI
- **AND** job MUST 运行完整产品候选验证

#### Scenario: 验证当前 Node 与桌面平台
- **WHEN** push 或 pull request 触发产品 CI
- **THEN** Linux Node 22 MUST 运行完整产品候选验证
- **AND** macOS、Windows Node 22 MUST 运行 standalone release smoke
- **AND** 桌面平台 job MUST NOT 重复运行只依赖 Node 和产品源码的 unit tests

### Requirement: release smoke 必须验证安装后生命周期
Buildr MUST 提供不依赖 development checkout runtime 的跨平台 release smoke，使用 standalone npm pack 或同一候选 run 提供的不可变正式 tarball，并使用安装后的 `buildr` 完成初始化、同步、诊断、optional Component 卸载和最终诊断。

#### Scenario: standalone verifier 从候选生成 tarball
- **WHEN** 维护者或跨平台 CI 独立运行 release smoke
- **THEN** verifier MUST 执行 `npm pack` 并将 tarball 安装到隔离 prefix
- **AND** 安装后的 CLI MUST 完成 `init --agent`、独立 `sync` 和 `doctor --json`
- **AND** 安装后的 CLI MUST 卸载一个 optional Component 并再次运行 `doctor --json`
- **AND** 两次 doctor MUST 没有 error

#### Scenario: candidate verifier 提供共享 tarball
- **WHEN** release smoke 收到同一冻结候选 run 生成的 tarball
- **THEN** verifier MUST 直接安装该 tarball，而不是再次执行 npm pack
- **AND** verifier MUST 完成与 standalone 模式相同的安装后生命周期

#### Scenario: release smoke 跨平台运行
- **WHEN** verifier 在 Linux、macOS 或 Windows Node 22 运行
- **THEN** verifier MUST 使用平台对应的 npm executable 和 installed bin 路径
- **AND** verifier MUST NOT 依赖 Bash、Unix-only 临时目录命令或固定 `/tmp` 路径

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

### Requirement: runtime adapter 验证必须按契约和实现族分层
Buildr 产品验证 MUST 对全部 supported runtime adapter 执行低成本 descriptor/plan/evidence 契约，并 MUST 仅按不同投射、skills root、checker 或 cleanup 实现语义选择代表执行昂贵 CLI 生命周期。

#### Scenario: 验证全部 supported adapter
- **WHEN** fast 或 candidate verifier 运行 runtime adapter contract
- **THEN** contract MUST 遍历全部 supported adapter 的 traits、target、activation、capability evidence 和 RuntimePlan 安全边界

#### Scenario: 验证昂贵 adapter 生命周期
- **WHEN** affected CLI 或 candidate verifier 运行 runtime adapter parity
- **THEN** verifier MUST 覆盖 native recursive、per-source reference、same-directory vendor、central vendor 和 root-index bridge 等不同实现族
- **AND** verifier MUST NOT 仅因多个 adapter 品牌复用同一实现而重复完整 install/render/check/idempotency 生命周期

#### Scenario: scoped render 隔离无关 Project
- **WHEN** verifier 对某个 Project 执行 scoped render 和 cleanup
- **THEN** verifier MUST 验证无关 Project 的受管投射仍然存在且内容不变
- **AND** 该回归 MUST 覆盖 same-directory vendor、central vendor 和 root-index bridge cleanup 模型

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

### Requirement: 产品总验证必须包含开源候选门禁
Buildr 产品总验证 MUST 运行开源候选安全 verifier，并 MUST 在公开 metadata、tracked candidate 或 npm tarball inventory 不满足发布边界时失败。

#### Scenario: 验证最终产品候选
- **WHEN** 维护者运行 `tools/verify-buildr-product`
- **THEN** verifier MUST 在最终成功前运行开源候选安全检查
- **AND** timing summary MUST 将该检查记录为独立阶段

### Requirement: Timing summary 必须支持开发完成报告
Buildr verification timing summary MUST 提供总耗时、每阶段名称/状态/耗时和失败退出状态，使 Agent 能确定最慢阶段、失败阶段和 summary 路径。

#### Scenario: Agent 汇报成功验证
- **WHEN** 产品完整验证成功并生成 timing summary
- **THEN** summary MUST 足以确定 totalDurationMs 和耗时最长的 step
- **AND** 产品验证输出 MUST 显示 summary 的绝对路径

#### Scenario: Agent 汇报失败验证
- **WHEN** 产品完整验证失败并生成 timing summary
- **THEN** summary MUST 标记整体失败状态和失败 step
- **AND** 失败 step MUST 保留非零 exitCode 与 durationMs

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
### Requirement: Candidate 必须观测独立 package 验证阶段
Buildr Candidate MUST 将 package static、package workspace smoke 和 package domain integration 作为独立 verification steps 编排，并 MUST 为每个 step 保留稳定 identity、耗时预算和失败诊断。

#### Scenario: Candidate 运行 package 验证
- **WHEN** `npm run test:candidate` 到达 package 验证阶段
- **THEN** timing summary MUST 分别记录每个 package step 的状态、exitCode、durationMs、budgetMs 和 diagnostics 路径
- **AND** Candidate MUST NOT 只记录一个不透明的 `package check` timing step

#### Scenario: 开发期间定点重跑 package verifier
- **WHEN** 维护者通过已登记入口选择 package static、workspace smoke 或 domain integration
- **THEN** 入口 MUST 只运行所选 focused verifier 及其显式前置门禁
- **AND** 未知 selector MUST fail closed

#### Scenario: package steps 并行执行
- **WHEN** 两个 package verifier 使用彼此隔离的只读源码或临时状态
- **THEN** Candidate MAY 在有界并行批次执行它们
- **AND** verifier MUST NOT 依赖同批次其他 step 的可变输出或执行顺序

### Requirement: 产品验证步骤必须由统一 registry 声明
Buildr Product MUST 使用单一 verification registry 声明所有可编排 step 的稳定 id、显示名称、执行命令、输入路径、依赖、profile/group、预算、并发类别和 artifact 需求，并 MUST 在执行前验证 registry 完整性。

#### Scenario: registry 定义合法
- **WHEN** fast、affected、changed 或 Candidate 解析 verification registry
- **THEN** 每个 step id MUST 唯一且引用的依赖、profile、group、concurrency class 和 executor MUST 已登记
- **AND** dependency graph MUST 无环

#### Scenario: registry 定义非法
- **WHEN** registry 存在重复 id、未知依赖、依赖环或缺失执行信息
- **THEN** planner MUST 在启动任何验证进程前 fail closed
- **AND** 诊断 MUST 标识无效 step 与原因

### Requirement: changed 验证必须从 Git diff 生成可解释计划
Buildr Product MUST 提供 `test:changed`，根据默认 Git diff、显式 `--base <ref>` 或显式 Product 路径匹配 registry inputs，展开依赖并去重；规划结果 MUST 解释每个 step 的选择原因和未映射路径。

#### Scenario: 普通文档发生小改动
- **WHEN** changed paths 只匹配普通非发布 Markdown 文档
- **THEN** planner MUST 选择轻量 docs quality step 及其显式依赖
- **AND** planner MUST NOT 选择完整 Candidate、Workspace E2E、tarball install 或 runtime parity

#### Scenario: 使用 Git base 规划
- **WHEN** 维护者运行 `npm run test:changed -- --base <ref>`
- **THEN** planner MUST 使用 `<ref>...HEAD` 的 merge-base diff，并合并 staged、unstaged 和 Product 内 untracked paths
- **AND** 输出 MUST 标识实际 base 与每个 matched path

#### Scenario: 使用显式路径规划
- **WHEN** 维护者向 `test:changed` 传入一个或多个 Product 相对路径
- **THEN** planner MUST 只使用这些规范化路径进行匹配
- **AND** 绝对路径、越界路径或不存在的 selector option MUST fail closed

#### Scenario: 改动路径没有 owner
- **WHEN** 任一 Product changed path 未匹配 registry input 且未被显式 ignore 规则覆盖
- **THEN** planner MUST 在运行步骤前 fail closed
- **AND** 诊断 MUST 列出全部未映射路径并要求补充验证所有权

#### Scenario: 只查看计划
- **WHEN** 维护者使用 `--plan` 或 `--json`
- **THEN** planner MUST 输出规范化 changed paths、按拓扑排序的 steps、依赖展开和选择原因
- **AND** planner MUST NOT 启动验证进程或创建候选制品

### Requirement: 验证 DAG 必须有界调度并保留失败传播
Buildr verification scheduler MUST 只在 step 的全部依赖通过且 concurrency class 有容量时启动该 step，并 MUST 保留 passed、failed 与 blocked step 的独立结果。

#### Scenario: 独立 steps 并发
- **WHEN** 多个 ready steps 使用允许并发的类别且未超过类别和全局上限
- **THEN** scheduler MUST 并行执行它们
- **AND** 输出顺序 MUST 按稳定拓扑顺序呈现，不依赖进程完成先后

#### Scenario: 依赖 step 失败
- **WHEN** 一个 step 返回非零状态
- **THEN** scheduler MUST 将直接或传递依赖该 step 的未启动 steps 标记为 blocked
- **AND** 与失败 step 无依赖关系且已经启动的 steps MUST 保留实际结果
- **AND** 整体执行 MUST 返回非零状态

### Requirement: Candidate 必须使用完整 profile 而不依赖 diff
Buildr Candidate MUST 从统一 registry 选择完整 candidate profile、展开全部依赖并生成一次冻结 tarball artifact；Candidate MUST NOT 根据 Git diff、changed inputs 或人工 selector 缩小发布门禁。

#### Scenario: 运行完整 Candidate
- **WHEN** 维护者运行 `npm run test:candidate`
- **THEN** planner MUST 选择 registry 中完整 candidate profile 的全部 steps
- **AND** Candidate MUST 保留 Workspace、package、runtime、OpenSpec、managed integrity、onboarding、CLI parity 和 release gates
- **AND** 所有 tarball consumer MUST 依赖并复用同一 candidate artifact

#### Scenario: Candidate registry 漂移
- **WHEN** 既有强制 gate 不再属于 candidate profile，或 artifact consumer 未声明 artifact dependency
- **THEN** architecture/registry verification MUST fail before release verification is reported complete
