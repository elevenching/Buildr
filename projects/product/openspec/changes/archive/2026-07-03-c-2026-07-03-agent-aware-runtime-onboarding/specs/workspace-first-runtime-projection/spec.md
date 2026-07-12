## ADDED Requirements

### Requirement: Runtime 投射按 Agent 能力选择
Buildr MVP MUST 区分标准规则资产、规则桥接 runtime 和 Skills runtime，并按当前 Agent 的实际能力选择需要执行的投射动作。

#### Scenario: Agent 原生读取 AGENTS
- **WHEN** 当前 Agent 原生读取 Buildr 标准规则资产 `AGENTS.md`
- **THEN** Buildr onboarding MUST NOT 要求该 Agent 生成额外规则桥接文件

#### Scenario: Agent 需要规则桥接
- **WHEN** 当前 Agent 不能直接读取 `AGENTS.md`，但存在对应规则桥接 adapter
- **THEN** Buildr onboarding MUST 引导 Agent 运行对应 adapter 的 runtime check 和 rules render

#### Scenario: Claude Code 规则桥接只管理 Buildr 区块
- **WHEN** Buildr 渲染或检查 Claude Code 的 `CLAUDE.md`
- **THEN** Buildr MUST 只覆盖和校验 Buildr managed block
- **AND** 用户 MUST 能在 managed block 外保留 Claude Code 专属内容

#### Scenario: Agent 只需要 Skills 投射
- **WHEN** 当前 Agent 原生读取 `AGENTS.md` 但需要额外 Skills runtime
- **THEN** Buildr onboarding MUST 只引导 Agent 执行该 Agent 对应的 Skills render/check

#### Scenario: Adapter 尚未实现
- **WHEN** 当前 Agent 需要某类 runtime 投射但 Buildr 尚未实现对应 adapter
- **THEN** Buildr onboarding MUST 明确跳过该投射动作，并继续使用 Buildr 标准资产完成 workspace 管理
