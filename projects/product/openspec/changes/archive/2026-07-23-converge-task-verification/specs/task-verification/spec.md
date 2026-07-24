## MODIFIED Requirements

### Requirement: 实现验证采用三级反馈协议
Task verification provider MUST 将实现循环中的 `minimal` 作为内部快速反馈动作，并 MUST 将 `affected` 与 `candidate` 作为 consumer 可请求的正式保证；provider MUST 根据任务上下文、Project policy、风险和用户意图返回 `requiredAssurance: affected | candidate`，且 MUST 防止同一候选状态机械重复已被显式 supersedes 或可信上层入口覆盖的检查。

#### Scenario: 单任务最小反馈
- **WHEN** Agent 完成任务组中的普通实现步骤且尚未请求正式交付保证
- **THEN** provider MUST 选择直接相关、低成本、环境就绪且已授权的 stable 能力或 legacy 小范围检查
- **AND** minimal 结果 MUST NOT 被 Task Finish 作为正式交付 evidence

#### Scenario: 普通开发或普通收尾要求受影响保证
- **WHEN** 普通实现任务达到完成节点或 Task Finish 提交非发布、未命中 Project 高风险政策的收尾上下文
- **THEN** provider MUST 返回 `requiredAssurance: affected` 并选择影响面内的 stable required 能力
- **AND** provider MAY 执行已授权的 trial/advisory 能力，但 MUST NOT 默认启动完整 Candidate

#### Scenario: 发布高风险或显式完整验证要求候选保证
- **WHEN** 任务属于发布、命中 Project 明示高风险政策或用户明确要求完整验证
- **THEN** provider MUST 返回 `requiredAssurance: candidate` 并运行项目要求的完整 Candidate 验证
- **AND** Candidate MUST NOT 根据 Git diff、固定能力数量或技术栈分层缩小权威门禁集合

#### Scenario: 高风险或用户指定即时检查
- **WHEN** 任务跨越安全边界、不可逆迁移或用户明确要求即时检查
- **THEN** provider MUST 在默认批量节奏之外执行必要且已授权的检查
- **AND** 即时检查 MUST 进入 Result Evidence，但 MUST NOT 在 Project policy 未要求时自行把普通收尾升级为 Candidate

### Requirement: 验证能力返回并报告标准结果证据
Task verification provider MUST 返回 `requiredAssurance`、验证级别、状态、policy sources、policy mode、候选 identity、检查结果、能力选择决策、覆盖与环境摘要、授权决策、Candidate 完整性、整体耗时、timing source、最慢检查、失败项、跳过项、evidence reference 和 evidence 生命周期，并 MUST 在直接验证或开发完成回复中以“受影响验证”或“完整候选验证”作为主要用户表述。

#### Scenario: 受影响验证成功
- **WHEN** 普通任务的 affected 验证成功并产生与当前候选一致的 evidence
- **THEN** provider MUST 报告受影响范围、实际能力、总耗时、失败项、跳过项和 evidence reference
- **AND** provider MUST 明确该证据满足普通交付保证，但不把它描述为完整 Candidate

#### Scenario: 最终候选验证成功
- **WHEN** Candidate 验证成功并产生可信 evidence
- **THEN** provider MUST 报告候选、完整验证、选中能力、Candidate 完整性、总耗时、最慢检查、失败项为无、跳过项和 evidence reference
- **AND** provider MUST 只有在 `candidateCompleteness: confirmed` 时说明实现具备完整候选证据

#### Scenario: 能力因环境或授权未运行
- **WHEN** 某个适用能力因环境未就绪、副作用未知或缺少授权被跳过或阻塞
- **THEN** provider MUST 记录能力 id 与原因
- **AND** 所需保证中的 required gate 未执行时 status MUST NOT 为通过

#### Scenario: 验证失败
- **WHEN** 任一必要检查失败
- **THEN** provider MUST 报告失败状态、失败检查、退出状态、已完成检查、实际总耗时和 evidence reference
- **AND** provider MUST NOT 将任务描述为满足所需保证

### Requirement: 验证在完成节点自动触发
Task verification provider MUST 同时支持用户直接验证意图、实现工作流自动验证节点和 Task Finish consumer，并 MUST NOT 要求用户主动说出 Skill、capability 或内部验证级别名称。

#### Scenario: 用户直接要求验证
- **WHEN** 用户要求运行测试、验证改动、判断验证是否完成或报告验证耗时
- **THEN** Agent runtime MUST 能根据 provider description 发现 task-verification 入口
- **AND** provider MUST 按当前任务阶段和 Project policy执行最低充分验证

#### Scenario: Agent 准备声称实现完成
- **WHEN** 实现型任务的候选已经稳定且 Agent 准备向用户声称实现完成
- **THEN** Agent MUST 在完成回复前调用 selected task-verification provider 获得与当前候选一致的 evidence
- **AND** 普通任务默认请求 affected，发布、高风险或显式完整验证请求 candidate

#### Scenario: Task Finish 消费验证能力
- **WHEN** 用户要求收尾且 Task Finish 提交任务、发布意图、改动范围、候选 identity 和已有 evidence
- **THEN** Task Finish MUST 通过 capability binding 调用 selected task-verification provider
- **AND** provider MUST 返回 `requiredAssurance` 和匹配该保证的执行或复用结论，binding MUST NOT 被解释为顶层意图发现机制
