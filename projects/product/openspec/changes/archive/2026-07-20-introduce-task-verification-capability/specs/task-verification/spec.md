## ADDED Requirements

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
Task verification provider MUST 从当前 scope 的 Rules、明确 Project context、OpenSpec artifacts、项目开发或发布文档以及公开项目入口解析具体验证政策，并 MUST NOT 根据技术栈名称猜测命令或把 Buildr Product 验证入口固定为其他项目的默认值。

#### Scenario: Project 定义完整验证入口
- **WHEN** 当前 Project 明确定义最小反馈、受影响范围或完整候选验证入口
- **THEN** provider MUST 按任务级别和候选范围选择对应入口
- **AND** Result Evidence MUST 记录实际采用的 policy sources

#### Scenario: 无法确定完整候选入口
- **WHEN** 用户要求判断开发是否完整验证，但当前 scope 没有可确认的 Candidate policy
- **THEN** provider MUST 返回 `incomplete` 并说明缺失的政策或入口
- **AND** provider MUST NOT 将最小反馈或受影响范围结果表述为完整候选验证

### Requirement: 实现验证采用三级反馈协议
Task verification provider MUST 区分 `minimal`、`affected` 和 `candidate` 三个验证级别，按任务进度和风险执行最低充分检查，并 MUST 防止同一候选状态机械重复已被可信上层入口覆盖的检查。

#### Scenario: 单任务最小反馈
- **WHEN** Agent 完成任务组中的普通实现任务且没有跨越高风险边界
- **THEN** provider MUST 只运行语法、类型或直接相关的小范围检查
- **AND** provider MUST NOT 默认启动完整 Candidate 验证

#### Scenario: 任务组受影响验证
- **WHEN** 共享实现区域、验证入口或失败影响面的任务组已经完成
- **THEN** provider MUST 集中运行一次受影响范围验证
- **AND** provider MUST NOT 为组内每个任务重复同一专项检查

#### Scenario: 最终候选完整验证
- **WHEN** 全部实现、自然语言资产、生成资产同步和 review 修订已经完成并冻结候选
- **THEN** provider MUST 运行项目要求的完整 Candidate 验证
- **AND** 只有 Candidate evidence 可信且通过时才能把验证状态作为实现完成证据

#### Scenario: 高风险或用户指定即时检查
- **WHEN** 任务跨越安全边界、不可逆迁移或用户明确要求即时检查
- **THEN** provider MUST 在默认批量节奏之外执行必要检查
- **AND** 该检查 MUST 继续进入最终 Result Evidence

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
Task verification provider MUST 返回验证级别、状态、policy sources、候选 identity、检查结果、整体耗时、timing source、最慢检查、失败项、跳过项、evidence reference 和 evidence 生命周期，并 MUST 在直接验证或开发完成回复中向用户披露这些信息。

#### Scenario: 最终候选验证成功
- **WHEN** Candidate 验证成功并产生可信 evidence
- **THEN** provider MUST 报告候选、验证级别、通过检查、总耗时、最慢检查、失败项为无、跳过项和 evidence reference
- **AND** provider MUST 明确说明实现具备完整验证证据

#### Scenario: 验证失败
- **WHEN** 任一必要检查失败
- **THEN** provider MUST 报告失败状态、失败检查、退出状态、已完成检查、实际总耗时和 evidence reference
- **AND** provider MUST NOT 将任务描述为验证完成

#### Scenario: 只有较低级别验证
- **WHEN** 当前只完成 `minimal` 或 `affected` 验证
- **THEN** provider MUST 如实报告已完成级别、结果和耗时
- **AND** provider MUST 明确指出 Candidate 验证尚未执行

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
Task verification provider MUST 同时支持用户直接验证意图和实现工作流自动验证节点，并 MUST NOT 要求用户主动说出 Skill 或 capability 名称。

#### Scenario: 用户直接要求验证
- **WHEN** 用户要求运行测试、验证改动、判断验证是否完成或报告验证耗时
- **THEN** Agent runtime MUST 能根据 provider description 发现 task-verification 入口
- **AND** provider MUST 按当前任务阶段执行最低充分验证

#### Scenario: Agent 准备声称实现完成
- **WHEN** 实现型任务的候选已经稳定且 Agent 准备向用户声称实现完成
- **THEN** Agent MUST 在完成回复前调用 selected task-verification provider 获得与当前候选一致的 evidence
- **AND** 用户 MUST NOT 需要另行要求运行验证

#### Scenario: Task Finish 消费验证能力
- **WHEN** 用户要求完整收尾且 Task Finish 需要核对或补齐 Candidate evidence
- **THEN** Task Finish MUST 通过 capability binding 调用 selected task-verification provider
- **AND** binding MUST NOT 被解释为顶层意图发现机制

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
