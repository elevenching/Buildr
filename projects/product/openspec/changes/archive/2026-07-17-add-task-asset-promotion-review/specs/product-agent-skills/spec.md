## ADDED Requirements

### Requirement: 产品入口 Buildr Skill 路由任务资产沉淀审查
产品内置 Buildr Skill MUST 帮助 Agent 发现 `task-asset-review`，并在用户意图或任务证据匹配时路由到该场景化 Skill。

#### Scenario: 用户要求复盘或沉淀
- **WHEN** 用户要求复盘任务、总结可沉淀的技能或规则、把本次工作方法留给后续 Agent 或表达等价意图
- **THEN** Buildr Skill MUST 引导 Agent 使用 `task-asset-review`
- **AND** Buildr Skill MUST NOT 在自身正文复制完整的沉淀审查流程

#### Scenario: Agent runtime 找不到任务资产审查 Skill
- **WHEN** 当前 workspace 应提供 `task-asset-review` 但 Agent runtime 无法发现它
- **THEN** Buildr Skill MUST 引导 Agent检查 builtin、workspace Skill 源和 runtime 投射状态
- **AND** Agent MUST 优先根据 doctor 运行 sync、render 或 builtin restore，而不是把该 Skill 的正文临时写入 Rule

#### Scenario: Skill 已卸载
- **WHEN** 用户已经显式卸载 optional `task-asset-review`
- **THEN** Buildr Skill MUST 尊重卸载状态
- **AND** Agent MUST NOT 把缺少该 Skill 描述为必须立即修复的错误
