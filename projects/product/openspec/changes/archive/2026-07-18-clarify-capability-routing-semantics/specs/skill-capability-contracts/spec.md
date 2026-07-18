## ADDED Requirements

### Requirement: Capability 关系必须按路由、依赖和执行协作分层
Buildr MUST 将 Agent Skill 意图发现、capability catalog、consumer dependency graph、产品入口内部路由和 Agent 执行协作视为相关但不同的关系，并 MUST NOT 将 capability dependency 定义为具体 Skill 之间的方法调用。

#### Scenario: 用户意图先命中入口 Skill
- **WHEN** 用户目标与已投射 Skill 的 description 语义匹配
- **THEN** Agent MUST 通过当前 runtime 的 Skill 发现机制选择并加载入口 Skill
- **AND** Buildr MUST NOT 声称产品入口 Buildr Skill 会在所有用户意图之前运行或拦截 prompt

#### Scenario: Consumer 加载后解析依赖 provider
- **WHEN** 已加载的入口 Skill 是声明 `requires` 的 consumer
- **THEN** Agent MUST 读取该 consumer runtime 中的受管 capability binding evidence
- **AND** Agent MUST 在执行 provider-dependent action 前读取相关 contract 和 selected provider
- **AND** 首次 Skill 意图发现 MUST NOT 被伪装成 manifest dependency edge

#### Scenario: Consumer 依赖能力保证而不是 Skill identity
- **WHEN** 一个 Skill 无法在缺少另一项能力的最低保证或结果证据时安全完成自身意图
- **THEN** consumer MUST 通过 `requires` 依赖 capability contract
- **AND** consumer MUST NOT 声明对具体 provider Skill id、命令或调用顺序的静态调用依赖

#### Scenario: Capability 只作为顶层可替换入口
- **WHEN** capability 已登记并可绑定，但当前没有 manifest consumer 通过 `requires` 依赖它
- **THEN** 该 capability MUST 继续存在于 capability catalog
- **AND** selected provider MUST 通过自身 Skill description 或已经加载的明确产品入口保持可发现
- **AND** Buildr MUST NOT 为了让 capability 出现在 consumer dependency graph 中创建空洞 consumer

#### Scenario: 替换顶层入口 provider
- **WHEN** Agent 将顶层入口 capability 改绑到新的 selected provider
- **THEN** 激活流程 MUST 验证新 provider 已投射到当前 runtime 且 description 覆盖对应用户意图
- **AND** 激活流程 MUST 检查旧入口或其他 Skill 是否造成同一意图的歧义
- **AND** binding ready MUST NOT 单独作为顶层入口可发现的充分证据

#### Scenario: Consumer dependency graph 只包含 requires 边
- **WHEN** Buildr 生成 capability dependency graph
- **THEN** graph MUST 只使用 installed consumers 的 `requires` 和 selected providers 计算 required/optional readiness
- **AND** 产品入口内部路由、description 命中和 Agent 在执行期间读取多个 Skills MUST NOT 被伪装成 manifest dependency edges

#### Scenario: Agent 调解真实执行协作
- **WHEN** 产品入口内部路由或 consumer dependency 已解析 selected provider
- **THEN** Agent MUST 读取相关 contract、provider playbook、授权和任务上下文后执行专业动作
- **AND** Buildr MUST NOT 仅凭结构 routing evidence 声称发生了确定性方法调用、provider behavior verified 或 execution succeeded
