## ADDED Requirements

### Requirement: Buildr 使用严格资产 identity
Buildr MUST 对用于路径、registry key、Component、Project、Service、Rule、Skill、Command collection 和 OpenSpec change/capability 的资产 identity 使用统一严格校验。

#### Scenario: 拒绝路径语义 identity
- **WHEN** mutation 接收到 `.`、`..`、绝对路径、路径分隔符或控制字符组成的 identity
- **THEN** Buildr MUST 在解析目标路径或写入文件前拒绝操作
- **AND** Buildr MUST NOT 创建、替换或删除任何源资产

#### Scenario: 接受普通稳定 identity
- **WHEN** identity 只包含允许的字母、数字、点、下划线和短横线，且不是保留路径段
- **THEN** Buildr MUST 将它作为单个资产 identity 处理
- **AND** identity 中的普通点字符 MUST NOT 被解释为路径导航

### Requirement: Mutation 路径受 scope、ownership 和保护根约束
Buildr MUST 只修改命令声明 scope 内具有明确 ownership 的目标，并保护 workspace 根、Product 根、当前目录、用户 home、文件系统根、资产集合根及其祖先。

#### Scenario: 删除精确受管成员
- **WHEN** Rule、Skill、Builtin 或 Component lifecycle 删除经过验证且位于声明集合根严格后代的受管成员
- **THEN** Buildr MUST 允许删除该精确成员
- **AND** Buildr MUST NOT 因其位于 workspace 根之下而阻止正常卸载

#### Scenario: 拒绝删除集合根或保护根
- **WHEN** 解析后的删除目标等于资产集合根或保护根，或者是保护根的祖先
- **THEN** Buildr MUST 拒绝 mutation
- **AND** Buildr MUST 在零写入状态报告被保护路径和请求操作

#### Scenario: 拒绝符号链接目标
- **WHEN** mutation 目标任一已存在路径 segment 是符号链接
- **THEN** Buildr MUST 拒绝写入或删除
- **AND** Buildr MUST NOT 跟随该链接推断 ownership

### Requirement: Mutation 在首次写入前完成全量预检
Buildr MUST 为跨文件源资产操作建立封闭 mutation plan，并在第一次持久化写入前验证全部路径、ownership、manifest schema、integrity、repo identity 和并发锁。

#### Scenario: 任一计划步骤冲突
- **WHEN** mutation plan 的任一 write、replace 或 remove 目标无效、冲突、被修改或不属于请求操作
- **THEN** Buildr MUST 使整个操作失败
- **AND** plan 中所有源资产 MUST 保持操作前状态

#### Scenario: 同一 workspace 并发 mutation
- **WHEN** workspace 已存在另一个未完成 mutation 的有效锁或 transaction
- **THEN** Buildr MUST 拒绝新的 source mutation
- **AND** diagnostics MUST 标识现有 operation 和恢复入口

### Requirement: Source mutation 原子提交或失败回滚
Buildr MUST 使用原子文件替换、目录 staging、backup 和逆序 rollback，使普通进程内失败后的源资产恢复到操作前状态。

#### Scenario: 多文件提交成功
- **WHEN** mutation plan 的全部 source steps 成功
- **THEN** Buildr MUST 提交完整的新资产与 manifest 状态
- **AND** Buildr MUST 清理 transaction staging、backup 和 lock

#### Scenario: 中间步骤失败
- **WHEN** 任一 source commit step 抛出 I/O 或验证错误
- **THEN** Buildr MUST 逆序回滚已应用步骤
- **AND** 操作结束后源资产 MUST 等于操作前完整状态，或者保留可诊断 transaction 并 fail closed

#### Scenario: 进程异常留下 transaction
- **WHEN** doctor 或后续 mutation 发现未完成 transaction、staging、backup 或 lock
- **THEN** Buildr MUST NOT 猜测成功或自动删除 backup
- **AND** Buildr MUST 输出 operation、受影响路径、已完成步骤和可执行恢复动作

### Requirement: Manifest YAML 保持 schema 内语义
Buildr MUST 使用兼容 YAML 语义的 parser 读取受管 manifest，在写入前校验封闭 schema，并以确定性格式写回。

#### Scenario: quoted 和 escaped scalar round-trip
- **WHEN** manifest 包含合法的 quoted、escaped、boolean、null、number 或 collection 值
- **THEN** Buildr MUST 按 YAML 语义解析并校验
- **AND** 一次无语义变更的读写 MUST NOT 改变 schema 内字段值

#### Scenario: 非法或不支持内容
- **WHEN** manifest 包含 duplicate key、非法 YAML 或 schema 不支持字段
- **THEN** 普通 mutation MUST 在写入前失败
- **AND** 只有现有 spec 明确声明的 convergence 操作 MAY 移除未知字段并通过 transaction 提交

### Requirement: Runtime reconcile 位于 source commit 之后
Buildr MUST 将长期源资产 transaction 与可重建 Agent runtime reconcile 分为两个明确边界。

#### Scenario: Source commit 后 runtime 失败
- **WHEN** source mutation 已完整提交但 runtime render、reconcile 或最终 doctor 失败
- **THEN** Buildr MUST 保留已提交源资产作为事实源并返回失败
- **AND** Buildr MUST 提供 render、sync 或 doctor 修复动作而不是回滚源资产

### Requirement: 生产 mutation 只能使用受审阅写入入口
Buildr MUST 通过产品验证防止新的生产命令绕过安全路径、atomic writer 和 transaction primitives 执行未审阅的直接删除、复制或写入。

#### Scenario: 验证发现直接危险写入
- **WHEN** package check 扫描到生产 mutation 路径新增未列入显式 allowlist 的直接 `rm`、递归 copy 或非原子 write
- **THEN** 产品验证 MUST 失败
- **AND** finding MUST 指向文件和操作类型
