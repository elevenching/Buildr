## MODIFIED Requirements

### Requirement: 任务验证能力独立于任务环境生命周期
Buildr MUST 提供 `buildr.task-verification/v2` capability contract 和默认 Workspace provider，负责验证政策解析、分层执行、候选身份绑定、耗时测量与结果报告，并 MUST NOT 把 Git worktree 或 task environment 作为使用该能力的前置条件；当 consumer 声明 task environment context 时，provider MUST 验证并绑定该 context。

#### Scenario: 在 task environment 中验证候选
- **WHEN** Agent 在 canonical task environment 中完成一个或多个 repository 的实现并请求正式验证
- **THEN** selected task-verification provider MUST 对准备交付的 environment repository candidate set 执行当前 Workspace 或 Project 定义的所需验证
- **AND** provider MUST 返回可与该 task environment、实际 execution roots 和各 repository candidate 比较的验证证据

#### Scenario: 在没有 task environment 的项目中验证
- **WHEN** 当前任务没有 Git worktree/task environment，但 Workspace 或 Project 定义了适用验证入口和候选边界
- **THEN** selected task-verification provider MUST 能独立执行并报告验证
- **AND** provider MUST NOT 要求安装或调用 `buildr.task-worktree-lifecycle/v1`

## ADDED Requirements

### Requirement: Task environment 验证证据必须绑定实际执行上下文
当 consumer 提供 task environment context 时，task-verification provider MUST 在启动正式验证前核对 environment owner、repository set、允许执行根和当前 candidates，并 MUST 将实际命令 cwd 与 multi-repository candidate identity 写入 evidence。无法证明一致时 MUST 返回 `incomplete`，不得执行错误 checkout 的正式验证或复用其 evidence。

#### Scenario: 单仓 environment 验证
- **WHEN** task environment 只包含 Workspace root repository
- **THEN** evidence MUST 记录 task id、environment root、execution root、repository checkout、branch、HEAD、dirty/fingerprint 和 context identity
- **AND** candidate identity MUST 来自该 environment checkout 而不是原 Workspace checkout

#### Scenario: 多仓 environment 验证
- **WHEN** 所需验证覆盖多个 environment member repositories
- **THEN** evidence MUST 记录有序 repository candidate set 及每项的 checkout root、branch、HEAD 和 tree/fingerprint
- **AND** 每个 check MUST 记录实际 cwd 或可核验的 execution root
- **AND** `reusable: true` MUST 要求当前 environment identity 与全部 required repository candidates 仍匹配

#### Scenario: 命令 cwd 位于环境外
- **WHEN** 验证计划的 cwd 解析到原 Workspace checkout、其他 task environment 或未登记路径
- **THEN** provider MUST 在启动该命令前返回 `incomplete`
- **AND** MUST 报告错误 cwd、预期 environment roots 和修复动作

#### Scenario: Evidence 来自另一个 worktree
- **WHEN** 已有 evidence 的 repository content 与当前候选碰巧相同，但 task environment identity 或 execution root 不同
- **THEN** provider MUST NOT 将其作为当前 task environment 的执行证据复用
- **AND** consumer MAY 仅在非 task-environment policy 明确允许内容等价复用时按普通 candidate identity 重新判断，不得抹去来源差异

### Requirement: 多仓验证必须按 Project policy 和 repository ownership 组合
Task verification provider MUST 根据显式 Project context、各 repository ownership 和 Project `verification.yml` 选择验证能力；跨 Project binding、cwd 或 policy 无法消歧时 MUST fail closed，不得以 Workspace root 的单仓测试代替全部成员验证。

#### Scenario: 多个 Service 属于同一 Project
- **WHEN** task environment 包含同一 Project 的多个 Service repositories
- **THEN** provider MUST 以该 Project policy 解析适用 capabilities
- **AND** MUST 根据每个 capability 的 inputs/cwd 覆盖实际受影响 repositories

#### Scenario: 多个 Project policy 一致
- **WHEN** task environment 跨多个 Projects 且它们的 selected provider/policy 可以明确组合
- **THEN** provider MUST 返回每个 Project 的 policy source、selected capabilities 和 repository coverage
- **AND** overall evidence MUST 只在全部 required checks 通过时 passed

#### Scenario: 跨 Project policy 无法组合
- **WHEN** 多个 Project 对同一 capability binding、环境或 required gate 存在无法消歧的冲突
- **THEN** provider MUST 返回 `incomplete` 和 `cross_project_binding_ambiguous` 或等价稳定原因
- **AND** MUST 要求拆分验证动作或取得明确选择

### Requirement: 验证必须精确披露非 Git 隔离状态
Task environment verification evidence MUST 区分 source checkout 隔离、Git shared metadata、Buildr-owned namespaced state、Project 既有外部环境和共享可变状态副作用；不得要求只读或已有独立环境的外部依赖为 worktree 复制环境。

#### Scenario: 只产生 task-local 临时文件
- **WHEN** selected capability 的 effects 为 `none` 或已声明 task-local temporary，且 cwd 位于 environment
- **THEN** provider MAY 按常规授权执行
- **AND** evidence MUST 记录 task-local cleanup/retention 边界

#### Scenario: 修改共享可变状态
- **WHEN** capability 会让并发任务修改同一数据库、队列、对象存储、第三方业务数据或其他共享状态，或 effects 为 unknown
- **THEN** provider MUST 标记该资源不是由 Git worktree 自动隔离
- **AND** MUST 按现有副作用授权政策阻塞或取得明确授权
