## MODIFIED Requirements

### Requirement: 产品验证必须提供分层入口
Buildr 产品验证 MUST 将测试证据层、主要门禁和故障定位入口明确分离：维护者主要工作流 MUST 收敛为 fast、changed 和 candidate 三种门禁，Unit、Contract 与 Fast Integration MUST 保留直接定位入口，领域或单 step 重跑 MUST 通过统一 focus 入口选择。

#### Scenario: 普通任务运行默认测试
- **WHEN** 维护者或 Agent 在 Product checkout 运行 `npm test` 或 `npm run test:fast`
- **THEN** verifier MUST 运行 Unit、Contract、Fast Integration、架构、canonical spec quality/strict 和全部 runtime adapter 低成本契约
- **AND** verifier MUST NOT 创建临时用户 workspace、执行 npm pack/install、访问网络或运行 Workspace E2E

#### Scenario: 根据改动运行验证
- **WHEN** 维护者或 Agent 运行 `npm run test:changed`
- **THEN** verifier MUST 根据 Git diff 或显式 Product 路径选择最小验证 DAG
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
- **AND** candidate verifier MUST 直接编排全部 candidate profile steps，不得使用 diff、group 或 step selector 缩小覆盖范围
- **AND** candidate verifier MUST 保留产品要求的文档、安全、onboarding、package、runtime adapter、release、managed data、Workspace E2E、OpenSpec 门禁及 timing summary

### Requirement: 产品验证步骤必须由统一 registry 声明
Buildr Product MUST 使用单一 verification registry 声明所有可编排 step 的稳定 id、显示名称、执行命令、输入路径、真实执行依赖、profile/group、预算、并发类别和 artifact 需求，并 MUST 在执行前验证 registry 完整性；`dependsOn` MUST NOT 用于表达 profile 完整性或建议门禁顺序。

#### Scenario: registry 定义合法
- **WHEN** fast、focus、changed 或 Candidate 解析 verification registry
- **THEN** 每个 step id MUST 唯一且引用的依赖、profile、group、concurrency class 和 executor MUST 已登记
- **AND** dependency graph MUST 无环
- **AND** 声明消费候选 artifact 的 step MUST 依赖对应 artifact producer

#### Scenario: registry 定义非法
- **WHEN** registry 存在重复 id、未知依赖、依赖环、artifact consumer 缺失 producer 依赖或缺失执行信息
- **THEN** planner MUST 在启动任何验证进程前 fail closed
- **AND** 诊断 MUST 标识无效 step 与原因

#### Scenario: step 只需要共同通过而不消费输出
- **WHEN** 两个 verifier 由同一 Fast 或 Candidate profile 选择但彼此不消费输出
- **THEN** registry MUST NOT 仅为了固定运行顺序在二者之间声明 `dependsOn`
- **AND** scheduler MAY 按并发类别并行执行二者

### Requirement: changed 验证必须从 Git diff 生成可解释计划
Buildr Product MUST 提供 `test:changed`，根据默认 Git diff、显式 `--base <ref>` 或显式 Product 路径匹配真实 verifier owner inputs，展开真实依赖并去重；规划结果 MUST 解释每个 step 的选择原因和未映射路径，且通用源码目录 glob MUST NOT 迫使无关 Unit、Contract 与 Fast Integration 同时运行。

#### Scenario: 普通文档发生小改动
- **WHEN** changed paths 只匹配普通非发布 Markdown 文档
- **THEN** planner MUST 选择轻量 docs quality step 及其真实依赖
- **AND** planner MUST NOT 选择完整 Candidate、Workspace E2E、tarball install 或 runtime parity

#### Scenario: 单一实现 owner 发生改动
- **WHEN** changed path 只匹配一个 focused verifier 或一个低成本测试 owner
- **THEN** planner MUST 选择该 owner 及其真实依赖
- **AND** planner MUST NOT 因架构或 profile 建议顺序展开全部低成本测试层

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

### Requirement: Candidate 必须使用完整 profile 而不依赖 diff
Buildr Candidate MUST 从统一 registry 选择完整 candidate profile、展开全部真实依赖并生成一次冻结 tarball artifact；Candidate MUST NOT 根据 Git diff、changed inputs、固定 step 数量或人工 selector 缩小发布门禁，并 MUST 包含轻量文档质量验证。

#### Scenario: 运行完整 Candidate
- **WHEN** 维护者运行 `npm run test:candidate`
- **THEN** planner MUST 选择 registry 中完整 candidate profile 的全部 steps
- **AND** Candidate MUST 保留 docs quality、Workspace、package、runtime、OpenSpec、managed integrity、onboarding、CLI parity 和 release gates
- **AND** 所有 tarball consumer MUST 依赖并复用同一 candidate artifact

#### Scenario: Candidate registry 漂移
- **WHEN** 既有 required gate 不再属于 candidate profile、docs quality 缺失，或 artifact consumer 未声明 artifact dependency
- **THEN** architecture/registry verification MUST fail before release verification is reported complete
- **AND** verifier MUST 根据 required gate identity 判断完整性，不得把某个固定 step 数作为质量契约

## ADDED Requirements

### Requirement: 重复生命周期验证必须声明唯一主 owner
Buildr Product MUST 为 development checkout onboarding、init 行为、checkout/package parity 和安装后 release lifecycle 声明不同的主 verifier；多个 verifier MAY 经过相同命令，但 MUST NOT 重复持有同一 happy-path 结果作为主要证据。

#### Scenario: 验证 development checkout onboarding
- **WHEN** repository onboarding verifier 运行
- **THEN** verifier MUST 证明干净 Git checkout、本地开发 CLI 安装和 development update source 识别
- **AND** verifier MUST NOT 重复持有完整 init/doctor 生命周期

#### Scenario: 验证 init 行为
- **WHEN** init onboarding verifier 运行
- **THEN** verifier MUST 持有 unsupported adapter、source-only、完整 init、幂等、冲突和恢复提示契约
- **AND** verifier MUST 使用 checkout CLI 而不承担 tarball 安装证明

#### Scenario: 验证 checkout 与 package 一致性
- **WHEN** CLI package parity verifier 运行
- **THEN** verifier MUST 比较 checkout 与同一 candidate tarball 的代表输出和 mutation 结果
- **AND** verifier MUST NOT 将单侧初始化成功作为独立发布证据

#### Scenario: 验证安装后发布生命周期
- **WHEN** release tarball smoke 运行
- **THEN** verifier MUST 独占安装后 init、sync、doctor、optional uninstall 和最终 doctor 的发布生命周期证据
