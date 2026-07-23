# task-verification Specification

## Purpose
定义 Buildr 如何通过可替换的任务验证能力解析项目政策、执行分层验证，并生成绑定候选身份、包含真实耗时且具备明确生命周期的结果证据。
## Requirements
### Requirement: 任务验证能力独立于任务环境生命周期
Buildr MUST 提供 `buildr.task-verification/v1` capability contract 和默认 workspace provider，负责验证政策解析、分层执行、候选身份绑定、耗时测量与结果报告，并 MUST NOT 把 Git worktree 作为使用该能力的前置条件。

#### Scenario: 在 task worktree 中验证候选
- **WHEN** Agent 在 canonical task worktree 中完成实现并请求最终候选验证
- **THEN** selected task-verification provider MUST 对准备交付的候选身份执行当前 workspace 或 Project 定义的 Candidate 验证
- **AND** provider MUST 返回可与该候选比较的验证证据

#### Scenario: 在没有 worktree 的项目中验证
- **WHEN** 当前任务没有 Git worktree，但 workspace 或 Project 定义了适用验证入口和候选边界
- **THEN** selected task-verification provider MUST 能独立执行并报告验证
- **AND** provider MUST NOT 要求安装或调用 `buildr.task-worktree-lifecycle/v1`

### Requirement: 验证政策由当前 workspace 或 Project 定义
Task verification provider MUST 优先解析当前已登记 Project 的可选测试能力声明，再从当前 scope 的 Rules、明确 Project context、OpenSpec artifacts、项目开发或发布文档以及公开项目入口解析 legacy policy，并 MUST NOT 根据技术栈名称猜测命令或把 Buildr Product 验证入口固定为其他项目的默认值。

#### Scenario: Project 定义任意测试能力集合
- **WHEN** 当前 Project 存在有效 `verification.yml`
- **THEN** provider MUST 按声明模式、任务级别、成熟度、适用范围、环境和授权选择能力
- **AND** Result Evidence MUST 记录实际采用的声明和其他 policy sources

#### Scenario: Project 没有测试声明
- **WHEN** 当前 Project 没有 `verification.yml`
- **THEN** provider MUST 保持现有 AGENTS、POM、项目文档和公开测试入口发现行为
- **AND** provider MUST NOT 因缺少新声明增加失败、阻塞或自动启动新的 Spring、端到端及外部环境测试

#### Scenario: 无法确定完整候选入口
- **WHEN** 用户要求判断开发是否完整验证，但声明与 legacy policy 都无法确认 Candidate policy
- **THEN** provider MUST 返回 `incomplete` 并说明已验证范围、缺失政策或入口
- **AND** provider MUST NOT 将最小反馈或受影响范围结果表述为完整候选验证

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

### Requirement: 验证证据绑定候选身份并随内容变化失效
Task verification Result Evidence MUST 记录当前环境能够证明的候选 identity、验证级别、状态和检查结果；无法建立足够身份时 MUST 标记 evidence 不可复用，候选内容变化后旧 evidence MUST 失效。

#### Scenario: Git 候选生成可复用证据
- **WHEN** provider 对 Git 管理的候选执行验证
- **THEN** evidence MUST 记录 repository root 以及可用于比较当前内容的 tree、fingerprint 或等价稳定 identity
- **AND** commit、checkout 或 push 仅改变提交容器而候选内容相同时 MAY 复用该 evidence

#### Scenario: 验证后候选内容变化
- **WHEN** rebase 冲突解决、后续编辑、生成资产更新或其他动作改变已验证内容
- **THEN** 原 evidence MUST 失效
- **AND** Agent MUST 在交付前对新候选重新运行适当验证

#### Scenario: 非 Git 候选无法建立稳定快照
- **WHEN** provider 无法为非 Git 候选建立可比较的 snapshot identity
- **THEN** provider MUST 明确标记 evidence 不可跨状态复用
- **AND** consumer MUST NOT 将其作为后续已变化候选的完成证据

### Requirement: 验证能力测量真实 wall-clock 耗时
Task verification provider MUST 为每次执行记录整体 wall-clock 耗时和 timing source，优先使用已核对的 verifier summary，否则使用进程外单调时钟测量，并 MUST NOT 通过相加并行检查耗时推算总耗时。

#### Scenario: Verifier 提供可信 timing summary
- **WHEN** 验证入口输出可核对状态、候选 identity 和总耗时的 summary
- **THEN** provider MUST 使用该 summary 并将 timing source 标记为 `verifier-reported`
- **AND** provider MUST 保留 summary path 或等价 evidence reference

#### Scenario: 普通命令没有 timing summary
- **WHEN** 验证入口只返回进程状态和输出
- **THEN** provider MUST 从进程启动前到退出后测量单次 wall-clock 并标记为 `wrapper-measured`
- **AND** provider MUST NOT 声称不存在的逐阶段耗时

#### Scenario: 验证进程仍在运行
- **WHEN** 执行工具返回 session、cell、process id 或仍在运行状态
- **THEN** provider MUST wait、poll 或 resume 同一进程直到结束
- **AND** provider MUST NOT 因暂时无输出重复启动相同验证

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

### Requirement: Provider operation 与验证执行分离计数
Task verification provider MUST 区分 `inspect`、`execute` 和 `cleanup` operation；consumer 调用 provider 核对或清理 evidence MUST NOT 被表述或计数为重新执行验证。

#### Scenario: 收尾核对已有 Candidate
- **WHEN** Task Finish 提供当前 implementation Candidate identity 和可复用的成功 Candidate evidence
- **THEN** provider MUST 执行 `inspect` 并返回 reuse decision
- **AND** provider MUST NOT 启动验证命令，`taskVerificationExecuteCalls` 和 `candidateExecutorCalls` MUST 均保持 `0`

#### Scenario: 收尾清理已消费 evidence
- **WHEN** Task Finish 在所有 consumer 完成后请求清理 transient evidence
- **THEN** provider MUST 执行 `cleanup`
- **AND** cleanup MUST NOT 增加 verification execute 或 Candidate executor count

#### Scenario: 实现候选确实改变
- **WHEN** consumer 将 transition 证明为 `implementation-changed` 或无法证明为 `same-content`/`closeout-metadata-only`
- **THEN** provider MUST 执行 `execute` 并按请求级别启动验证命令
- **AND** Result Evidence MUST 记录本次 operation 和实际 executor invocation count

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

### Requirement: 落盘验证证据具有显式生命周期
Task verification provider MUST 为落盘 evidence 返回 `evidenceRetention`、`cleanupAfter`、`cleanupStatus` 和可用时的 `cleanupReference`，并 MUST 在所有消费者使用完毕前保留当前有效 Candidate evidence。

#### Scenario: 默认临时 evidence
- **WHEN** verifier 在系统临时目录创建本次 run 的 summary 和 diagnostics
- **THEN** provider MUST 将 evidence 标记为 `transient` 并记录受边界约束的精确 cleanup reference
- **AND** provider MUST NOT 把系统临时目录描述为长期持久存储

#### Scenario: 新证据替代旧成功证据
- **WHEN** 新 Candidate evidence 已核对通过并替代同一任务的旧成功 evidence
- **THEN** provider MAY 清理不再被任何 consumer 引用的旧 transient run
- **AND** provider MUST 保留当前有效 evidence

#### Scenario: 收尾后清理临时 evidence
- **WHEN** Task Finish 已捕获最终验证摘要、完成集成与推送且确认没有后续 consumer
- **THEN** Task Finish MUST 请求 selected verification provider 清理 transient evidence
- **AND** 最终报告 MUST 说明 cleanup status，不得把已删除路径表述为长期可访问引用

#### Scenario: 调用方管理的 evidence
- **WHEN** 调用方显式指定稳定输出路径或 CI 上传 artifact
- **THEN** provider MUST 将 evidence 标记为 `caller-managed`
- **AND** provider MUST NOT 在没有明确生命周期授权时删除该 evidence

#### Scenario: 清理失败
- **WHEN** provider 无法证明 cleanup reference 属于本次 transient run 或删除失败
- **THEN** provider MUST 保留现场并返回 `cleanupStatus: retained`
- **AND** Task Finish MUST 报告保留路径与原因，但不得回滚已经完成的交付

### Requirement: Candidate evidence 与验证结果元数据 transition 分离
Task verification provider MUST 继续将 Candidate evidence 绑定实际验证的 implementation identity；consumer MAY 仅在 Project policy 明确定义且 transition evidence 完整时，将该 evidence 与 `verification-result-metadata-only` transition 组合用于收尾。

#### Scenario: Consumer 核对受限 metadata transition
- **WHEN** consumer 提供与 Candidate identity 一致的 source identity，以及同一会话内唯一最终 Candidate task checkbox 的完整 transition evidence
- **THEN** provider MUST 以 `inspect` 核对原 Candidate evidence，且 `taskVerificationExecuteCalls` 与 `candidateExecutorCalls` MUST 均保持 `0`
- **AND** Result Evidence MUST 保持原 `candidateIdentity`，不得改写为 target delivery identity

#### Scenario: Consumer 缺少可审计 transition evidence
- **WHEN** consumer 只有变化后的 tree 或最终 diff，无法证明同一会话动作、唯一任务和精确 marker transition
- **THEN** provider MUST 将原 Candidate evidence 标记为不可直接复用于变化后的 implementation candidate
- **AND** consumer MUST 请求新的 Candidate execution 或报告 incomplete

#### Scenario: Transition evidence 仅在当前会话存在
- **WHEN** verification-result metadata transition 没有 versioned 持久化 receipt
- **THEN** consumer MUST 将 transition evidence 标记为 `session-only`
- **AND** 跨会话丢失该证据后 MUST NOT 从路径或 checkbox 状态反推可复用性
