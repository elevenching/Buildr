## MODIFIED Requirements

### Requirement: 产品验证步骤必须由统一 registry 声明
Buildr Product MUST 使用单一 verification registry 声明所有可编排 step 的稳定 id、显示名称、执行命令、输入路径、真实执行依赖、profile/group、预算、并发类别、可选调度成本和 artifact 需求，并 MUST 在执行前验证 registry 完整性；`dependsOn` MUST NOT 用于表达 profile 完整性或建议门禁顺序。

#### Scenario: registry 定义合法
- **WHEN** fast、focus、changed 或 Candidate 解析 verification registry
- **THEN** 每个 step id MUST 唯一且引用的依赖、profile、group、concurrency class 和 executor MUST 已登记
- **AND** 可选 `schedulingCostMs` MUST 是正整数
- **AND** dependency graph MUST 无环
- **AND** 声明消费候选 artifact 的 step MUST 依赖对应 artifact producer

#### Scenario: registry 定义非法
- **WHEN** registry 存在重复 id、未知依赖、依赖环、artifact consumer 缺失 producer 依赖、缺失执行信息或非法 `schedulingCostMs`
- **THEN** planner MUST 在启动任何验证进程前 fail closed
- **AND** 诊断 MUST 标识无效 step 与原因

#### Scenario: step 只需要共同通过而不消费输出
- **WHEN** 两个 verifier 由同一 Fast 或 Candidate profile 选择但彼此不消费输出
- **THEN** registry MUST NOT 仅为了固定运行顺序在二者之间声明 `dependsOn`
- **AND** scheduler MAY 按并发类别和可选调度成本并行执行二者

### Requirement: 验证 DAG 必须有界调度并保留失败传播
Buildr verification scheduler MUST 只在 step 的全部依赖通过且 concurrency class 有容量时启动该 step，MUST 在当前 ready steps 中优先选择已声明调度成本较高者，并 MUST 保留 passed、failed 与 blocked step 的独立结果。

#### Scenario: 独立 steps 并发
- **WHEN** 多个 ready steps 使用允许并发的类别且未超过类别和全局上限
- **THEN** scheduler MUST 优先启动 `schedulingCostMs` 较高且容量可用的 step
- **AND** 相同成本或未声明成本的 steps MUST 保持 plan 中的稳定相对顺序
- **AND** 输出顺序 MUST 按稳定拓扑顺序呈现，不依赖启动或完成先后

#### Scenario: 高成本 step 尚未 ready
- **WHEN** 一个高成本 step 的依赖尚未全部通过，但其他低成本 step 已 ready 且有容量
- **THEN** scheduler MUST 启动容量可用的 ready step
- **AND** scheduler MUST NOT 为等待高成本 step 而空置可用槽位

#### Scenario: 依赖 step 失败
- **WHEN** 一个 step 返回非零状态
- **THEN** scheduler MUST 将直接或传递依赖该 step 的未启动 steps 标记为 blocked
- **AND** 与失败 step 无依赖关系且已经启动的 steps MUST 保留实际结果
- **AND** 整体执行 MUST 返回非零状态

#### Scenario: 对比调度模式
- **WHEN** 维护者在同一冻结 Candidate tree 上选择 cost 或 declaration 调度模式
- **THEN** 两种模式 MUST 使用相同 registry、profile、依赖、并发上限和 executors
- **AND** timing summary MUST 记录实际 `schedulingMode`
- **AND** 未知模式 MUST 在启动 verifier 子进程前 fail closed
