## ADDED Requirements

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
