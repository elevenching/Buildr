## MODIFIED Requirements

### Requirement: Mutation 路径受 scope、ownership 和保护根约束
Buildr MUST 只修改命令声明 scope 内具有明确 ownership 的目标，并保护 workspace 根、Product 根、当前目录、用户 home、文件系统根、资产集合根、独立 Git repo 根及其祖先。

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

#### Scenario: 事务不得覆盖独立 Service 仓树
- **WHEN** workspace 的 `projects/` 下包含一个或多个独立 Git Project 或 Service repo
- **THEN** sync mutation plan MUST 只声明 Buildr 实际管理的精确 metadata、manifest 或资产成员
- **AND** affected paths、snapshot、rollback 和 recover MUST NOT 把整个 `projects/`、已有 Project 根、`services/` 或独立 repo 根作为递归目标

### Requirement: Mutation 在首次写入前完成全量预检
Buildr MUST 为跨文件源资产操作建立封闭 mutation plan，并在第一次持久化写入前验证全部路径、ownership、manifest schema、integrity、repo identity 和并发锁；可预判的用户决策 MUST 在创建 mutation lock、transaction、journal 或 backup 前完成。

#### Scenario: 任一计划步骤冲突
- **WHEN** mutation plan 的任一 write、replace 或 remove 目标无效、冲突、被修改或不属于请求操作
- **THEN** Buildr MUST 使整个操作失败
- **AND** plan 中所有源资产 MUST 保持操作前状态

#### Scenario: 可预判用户决策阻塞
- **WHEN** 只读 preflight 发现 optional Builtin、Component migration 或其他需要用户选择的状态
- **THEN** Buildr MUST 在创建 mutation lock、transaction、journal 或 backup 前停止
- **AND** workspace 文件和 Git 状态 MUST 与 preflight 前完全一致

#### Scenario: 同一 workspace 并发 mutation
- **WHEN** workspace 已存在另一个未完成 mutation 的有效锁或 transaction
- **THEN** Buildr MUST 拒绝新的 source mutation
- **AND** diagnostics MUST 标识现有 operation 和恢复入口

#### Scenario: Preflight 后 workspace 漂移
- **WHEN** mutation 取得 lock 后发现 source plan 与只读 preflight 结果不一致
- **THEN** Buildr MUST 在第一次源资产写入前停止提交
- **AND** Buildr MUST NOT 使用陈旧 plan 覆盖新状态

### Requirement: Source mutation 原子提交或失败回滚
Buildr MUST 使用原子文件替换、目录 staging、backup 和逆序 rollback，使普通进程内失败后的源资产恢复到操作前状态；rollback 和显式 recover MUST 使用有限重试与恢复结果验证，并在无法证明完整恢复时保留诊断材料且 fail closed。

#### Scenario: 多文件提交成功
- **WHEN** mutation plan 的全部 source steps 成功
- **THEN** Buildr MUST 提交完整的新资产与 manifest 状态
- **AND** Buildr MUST 清理 transaction staging、backup 和 lock

#### Scenario: 中间步骤失败
- **WHEN** 任一 source commit step 抛出 I/O 或验证错误
- **THEN** Buildr MUST 逆序回滚已应用步骤
- **AND** 操作结束后源资产 MUST 等于操作前完整状态，或者保留可诊断 transaction 并 fail closed

#### Scenario: 短暂目录删除失败
- **WHEN** rollback 或 recover 删除精确 snapshot 目标时遇到 `ENOTEMPTY`、`EBUSY` 或等价短暂文件系统错误
- **THEN** Buildr MUST 在有限次数和有限时间内重试，并确认目标已经删除后再恢复 backup
- **AND** 重试耗尽时 Buildr MUST 保留 backup、journal 和 lock

#### Scenario: Recover 首次失败后重试
- **WHEN** `mutation recover` 在部分 snapshot 恢复后失败并再次使用同一 transaction ID 执行
- **THEN** Buildr MUST 从保留的完整 backup 重新应用全部恢复计划
- **AND** 成功后 workspace MUST 等于 transaction 前状态

#### Scenario: Recover 成功后重复执行
- **WHEN** 同一 transaction ID 已经成功恢复并再次执行 `mutation recover`
- **THEN** Buildr MUST 将其作为可证明的成功 no-op 报告
- **AND** Buildr MUST NOT 再次删除、复制或修改 workspace 源资产

#### Scenario: 进程异常留下 transaction
- **WHEN** doctor 或后续 mutation 发现未完成 transaction、staging、backup 或 lock
- **THEN** Buildr MUST NOT 猜测成功或自动删除 backup
- **AND** Buildr MUST 输出 operation、受影响路径、已完成步骤和可执行恢复动作

### Requirement: sync 的源资产更新必须使用安全事务
Buildr MUST 让 `sync` 对 Builtin、Builtin 安装回执、Component 和其他受管源资产的更新使用一个由只读 plan 驱动的 workspace mutation 事务，并只 snapshot 与恢复 plan 声明的精确受管路径。

#### Scenario: sync 更新多个源文件
- **WHEN** `sync` 需要新增、更新或删除多个受管源文件
- **THEN** Buildr MUST 在写入前检查完整修改范围并生成确定性的精确 affected paths
- **AND** Builtin 资产、registries 和 `.buildr/builtin-receipts.json` MUST 在同一 source transaction 中提交
- **AND** 任一步骤失败时源资产 MUST 保持操作前状态，或者保留可诊断且停止后续写入的 transaction

#### Scenario: sync 计划包含已有集合或 repo 根
- **WHEN** sync source plan 把整个 `projects/`、已有 Project 根、`services/`、独立 repo 根或其他非精确集合根列为 affected path
- **THEN** Buildr MUST 在创建 transaction 前拒绝该计划
- **AND** Buildr MUST 报告不安全路径且保持 workspace 不变

#### Scenario: Builtin lifecycle 更新回执
- **WHEN** `sync`、`builtin uninstall` 或 `builtin restore` 改变独立 Builtin 状态
- **THEN** 对应资产、manifest 和安装回执 MUST 一起提交或一起回滚

#### Scenario: 源资产提交后同步运行时
- **WHEN** `sync` 已经成功提交源资产修改
- **THEN** Buildr MUST 再根据提交后的源状态同步运行时
- **AND** 运行时同步失败 MUST NOT 回滚已经提交的源资产
