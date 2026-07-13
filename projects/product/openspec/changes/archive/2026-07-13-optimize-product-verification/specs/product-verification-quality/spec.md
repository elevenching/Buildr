## ADDED Requirements

### Requirement: 产品验证必须提供分层入口
Buildr 产品验证 MUST 提供 fast、affected 和 candidate 三层入口，使普通任务不默认执行候选版系统级验证，同时保证最终候选仍经过完整门禁。

#### Scenario: 普通任务运行默认测试
- **WHEN** 维护者或 Agent 在 Product checkout 运行 `npm test` 或 `npm run test:fast`
- **THEN** verifier MUST 运行 unit、架构、canonical spec quality/strict 和全部 runtime adapter 低成本契约
- **AND** verifier MUST NOT 创建临时用户 workspace、执行 npm pack/install、访问网络或运行 MVP E2E

#### Scenario: 任务组运行 affected 验证
- **WHEN** 维护者为一个或多个改动领域运行 `npm run test:affected -- <group...>`
- **THEN** verifier MUST 先运行一次 fast 验证，再运行每个领域声明的专项 verifier
- **AND** 同一 verifier MUST 在该次组合中最多执行一次

#### Scenario: 最终候选运行完整验证
- **WHEN** 实现、自然语言资产、生成资产和 review 修订已经冻结
- **THEN** 维护者或 CI MUST 运行 `npm run test:candidate`
- **AND** candidate verifier MUST 保留产品要求的安全、onboarding、package、runtime adapter、MVP、release、managed data 和 OpenSpec 门禁及 timing summary

### Requirement: 候选验证必须避免重复制品和无边界串行执行
Buildr candidate verifier MUST 在同一冻结候选 run 内复用不可变 npm tarball，并 MUST 对已证明使用隔离状态的昂贵阶段采用有界并行，同时保持逐阶段失败和 timing 可观察性。

#### Scenario: 多个 verifier 使用候选 tarball
- **WHEN** candidate verifier 运行 tarball inventory、package parity、MVP installed lifecycle 和 release smoke
- **THEN** orchestrator MUST 只生成一个候选 tarball 和对应 pack metadata
- **AND** 各 verifier MUST 使用该只读制品，但 MUST 继续使用彼此隔离的安装 prefix 和 workspace

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

## MODIFIED Requirements

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
