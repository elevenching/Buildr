## MODIFIED Requirements

### Requirement: 产品入口 Buildr Skill 路由任务资产沉淀审查
产品内置 Buildr Skill MUST 帮助 Agent 发现 selected `buildr.task-asset-review/v2` provider，并在非简单 Workspace 任务开始、任务过程出现资产信号、用户明确复盘或任务结束 finalize 时路由到该 provider。

#### Scenario: 非简单任务开始
- **WHEN** Agent 开始探索、设计、诊断、实现或验证非简单 Workspace 任务
- **THEN** Buildr Skill MUST 引导 Agent 使用 selected provider 判断是否维护 observation
- **AND** Buildr Skill MUST NOT 在自身正文复制完整观察流程

#### Scenario: Runtime 找不到 provider
- **WHEN** capability graph 表示 provider 应存在但 runtime 无法发现
- **THEN** Buildr Skill MUST 引导 Agent 检查 builtin、workspace source、binding 和 runtime 投射

#### Scenario: Skill 已卸载
- **WHEN** 用户已显式卸载 optional provider
- **THEN** Buildr Skill MUST 尊重卸载状态并使用 degraded semantics

### Requirement: 产品入口按 capability 路由用户意图
产品入口 Buildr Skill MUST 将资产观察、显式复盘和结束 finalize 路由到 `buildr.task-asset-review/v2` selected provider，并 MUST NOT 将 builtin Skill id 当作不可替换入口。

#### Scenario: 路由任务资产审查
- **WHEN** 用户意图或任务节点需要观察、审查或 finalize
- **THEN** Buildr Skill MUST 使用当前 capability graph 的 v2 selected provider
- **AND** Buildr Skill MUST honor blocked and degraded semantics

#### Scenario: 用户替换 provider
- **WHEN** workspace 绑定兼容的内部 v2 provider
- **THEN** Buildr Skill MUST 路由到该 provider而不要求 `task-asset-review` Skill id
