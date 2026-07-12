## ADDED Requirements

### Requirement: 场景化内置流程以 Skills 发布
Buildr package assets MUST 将由任务意图触发的场景化流程指引发布为内置 Skills，而不是 optional 内置 Rules。

#### Scenario: package 声明场景化流程指引
- **WHEN** Buildr package 包含需要按任务意图、工作流阶段、风险条件或命令流程判断是否适用的指引
- **THEN** `package/manifest.yml` MUST 将该指引声明为内置 Skill
- **AND** 对应默认 workspace baseline MUST 在 `skills/manifest.yml` 中登记该 Skill
- **AND** Buildr MUST NOT 将该指引发布为 optional 内置 Rule

#### Scenario: package 声明 invariant 指引
- **WHEN** Buildr package 包含定义 workspace 模型、源资产边界、必读入口或常驻 invariant 的指引
- **THEN** `package/manifest.yml` MAY 将该指引声明为内置 Rule
- **AND** required 内置 Rules MUST 只包含 Agent 无论任务意图如何都必须读取的指引

### Requirement: 默认 baseline 排除场景化 Rules
Buildr package baseline MUST 不在默认 `rules/buildr/` 资产中发布场景化内置流程指引。

#### Scenario: package check 校验 baseline Rules
- **WHEN** Agent 运行 `buildr package check`
- **THEN** 如果默认 package baseline 将任务分流、OpenSpec 工作流、worktree 工作流或 Git 操作流程发布为 optional 内置 Rules，Buildr MUST 校验失败
- **AND** 当 Buildr 仍随包提供这些流程指引时，Buildr MUST 校验等价指引可通过内置 Skills 获得
