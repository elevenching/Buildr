## MODIFIED Requirements

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
Task verification provider MUST 区分 `minimal`、`affected` 和 `candidate` 三个验证级别，按任务进度、风险及测试能力声明动态执行最低充分检查，并 MUST 防止同一候选状态机械重复已被显式 supersedes 或可信上层入口覆盖的检查。

#### Scenario: 单任务最小反馈
- **WHEN** Agent 完成任务组中的普通实现任务且没有跨越高风险边界
- **THEN** provider MUST 选择直接相关、低成本、环境就绪且已授权的 stable 能力或 legacy 小范围检查
- **AND** provider MUST NOT 默认启动完整 Candidate 验证

#### Scenario: 任务组受影响验证
- **WHEN** 共享实现区域、验证入口或失败影响面的任务组已经完成
- **THEN** provider MUST 选择影响面内的 stable required 能力，并 MAY 执行已授权的 trial/advisory 能力
- **AND** provider MUST NOT 为组内每个任务重复同一专项检查

#### Scenario: 最终候选完整验证
- **WHEN** 全部实现、自然语言资产、生成资产同步和 review 修订已经完成并冻结候选
- **THEN** provider MUST 运行项目要求的完整 Candidate 验证，包括 authoritative 声明中全部适用的 stable required Candidate gates
- **AND** Candidate MUST NOT 根据 Git diff、固定能力数量或技术栈分层缩小权威门禁集合
- **AND** 只有 Candidate evidence 可信、required gates 通过且 Candidate 完整性可确认时才能把结果作为实现完成证据

#### Scenario: 高风险或用户指定即时检查
- **WHEN** 任务跨越安全边界、不可逆迁移或用户明确要求即时检查
- **THEN** provider MUST 在默认批量节奏之外执行必要且已授权的检查
- **AND** 该检查 MUST 继续进入最终 Result Evidence

### Requirement: 验证能力返回并报告标准结果证据
Task verification provider MUST 返回验证级别、状态、policy sources、policy mode、候选 identity、检查结果、能力选择决策、覆盖与环境摘要、授权决策、Candidate 完整性、整体耗时、timing source、最慢检查、失败项、跳过项、evidence reference 和 evidence 生命周期，并 MUST 在直接验证或开发完成回复中向用户披露这些信息。

#### Scenario: 最终候选验证成功
- **WHEN** Candidate 验证成功并产生可信 evidence
- **THEN** provider MUST 报告候选、验证级别、选中能力、通过检查、覆盖摘要、Candidate 完整性、总耗时、最慢检查、失败项为无、跳过项和 evidence reference
- **AND** provider MUST 只有在 `candidateCompleteness: confirmed` 时说明实现具备完整验证证据

#### Scenario: 能力因环境或授权未运行
- **WHEN** 某个适用能力因环境未就绪、副作用未知或缺少授权被跳过或阻塞
- **THEN** provider MUST 在 skippedCapabilities 或 blockedCapabilities 中记录能力 id 与原因
- **AND** required Candidate gate 未执行时 status MUST NOT 为完整通过

#### Scenario: 验证失败
- **WHEN** 任一必要检查失败
- **THEN** provider MUST 报告失败状态、失败检查、退出状态、已完成检查、实际总耗时和 evidence reference
- **AND** provider MUST NOT 将任务描述为验证完成

#### Scenario: 只有较低级别验证
- **WHEN** 当前只完成 `minimal` 或 `affected` 验证
- **THEN** provider MUST 如实报告已完成级别、能力集合、结果和耗时
- **AND** provider MUST 明确指出 Candidate 验证尚未执行
