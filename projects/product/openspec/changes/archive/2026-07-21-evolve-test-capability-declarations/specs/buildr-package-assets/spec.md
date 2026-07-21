## MODIFIED Requirements

### Requirement: 随包任务验证能力保持完整可组合
Buildr package MUST 原子交付 `buildr.task-verification/v1` contract、默认 `task-verification` provider、测试能力声明参考/模板、workspace binding、Task Finish consumer dependency 和全部 supported runtime 投射输入，并 MUST 通过产品验证防止验证职责重新耦合到 worktree lifecycle provider或具体团队测试分层。

#### Scenario: Package 声明 task-verification provider
- **WHEN** package static validation 读取随包能力声明
- **THEN** workspace Skills manifest MUST 声明 installed、enabled 的 `task-verification` provider 及 `buildr.task-verification/v1` contract 和 binding
- **AND** `task-finish` MUST 继续以 required consumer dependency 引用该 capability，而不是固定 provider id

#### Scenario: Package 交付测试声明资料
- **WHEN** package static validation 检查 `task-verification` 完整目录
- **THEN** provider MUST 包含可读取的 schema 参考和初始化模板
- **AND** 资料 MUST 使用通用能力集合、成熟度、阶段、环境、副作用和授权模型，不得包含鲜肉或其他团队的固定测试层级

#### Scenario: Runtime 可发现验证入口
- **WHEN** 临时 workspace 为任一 supported runtime 完成 sync 或 render
- **THEN** runtime inventory MUST 包含可发现的 `task-verification` Skill
- **AND** description MUST 同时覆盖直接测试、实现完成节点、Candidate evidence、初始化测试声明和测试能力演进意图

#### Scenario: Provider contract 组合验证
- **WHEN** Buildr 运行随包任务 Skills 契约验证
- **THEN** verifier MUST 同时覆盖直接验证、自动完成节点、Task Finish consumer、零配置 legacy、augment 声明、authoritative Candidate 和增量演进路径
- **AND** verifier MUST 确认 `task-verification` 不依赖 Git worktree、Git provider identity、Buildr Product 专用验证命令或固定团队分层

#### Scenario: 替换默认验证 provider
- **WHEN** workspace 安装并绑定兼容的内部 `buildr.task-verification/v1` provider
- **THEN** Task Finish MUST 通过 binding 使用新 provider 而不修改 consumer Skill
- **AND** 默认 `task-verification` provider 在不再被选中时 MUST 可安全卸载而不破坏 consumer
