## ADDED Requirements

### Requirement: 随包任务验证能力保持完整可组合
Buildr package MUST 原子交付 `buildr.task-verification/v1` contract、默认 `task-verification` provider、workspace binding、Task Finish consumer dependency 和全部 supported runtime 投射输入，并 MUST 通过产品验证防止验证职责重新耦合到 worktree lifecycle provider。

#### Scenario: 安装默认任务验证能力
- **WHEN** 用户初始化或同步包含默认任务 Skills 的 Buildr workspace
- **THEN** workspace Skills manifest MUST 声明 installed、enabled 的 `task-verification` provider 及 `buildr.task-verification/v1` contract 和 binding
- **AND** `task-finish` MUST 对该 capability 声明 `mode: required`
- **AND** doctor capability graph MUST 将默认 provider 和 consumer 报告为 `ready`

#### Scenario: 七个 runtime 投射任务验证 Skill
- **WHEN** Buildr 为任一 supported runtime render 或 sync workspace Skills
- **THEN** runtime inventory MUST 包含可发现的 `task-verification` Skill
- **AND** `task-finish` runtime binding evidence MUST 指向当前 selected verification provider、contract digest 和 readiness

#### Scenario: 防止验证与 worktree lifecycle 回退耦合
- **WHEN** Buildr 运行随包任务 Skills 契约验证
- **THEN** verifier MUST 确认 `task-worktree` 只提供 `buildr.task-worktree-lifecycle/v1` 并且不拥有三级验证执行与报告政策
- **AND** verifier MUST 确认 `task-verification` 不依赖 Git worktree、Git provider identity 或 Buildr Product 专用验证命令

#### Scenario: 验证 provider 替换后保持组合
- **WHEN** workspace 安装并绑定兼容的内部 `buildr.task-verification/v1` provider
- **THEN** package/runtime verification MUST 确认 `task-finish` 使用 replacement provider 且保持 capability-ready
- **AND** 默认 `task-verification` provider 在不再被选中时 MUST 可安全卸载而不破坏 consumer
