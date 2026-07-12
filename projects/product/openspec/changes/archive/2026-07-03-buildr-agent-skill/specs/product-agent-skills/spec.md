## ADDED Requirements

### Requirement: 产品内置 Agent Skills
Buildr MUST 支持产品随包内置 Agent Skills，用于向支持 Skills runtime 的 Agent 提供 Buildr 产品能力入口。

#### Scenario: 声明 Buildr 内置 Skill
- **WHEN** Buildr 产品包包含 Buildr 使用能力的 Agent Skill
- **THEN** 该 Skill MUST 以产品随包资产形式维护
- **AND** 默认源路径 MUST 为 `product/package/agent-skills/buildr/SKILL.md` 或 manifest 中等价声明的产品随包路径

#### Scenario: 不混入 workspace skills 源
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST NOT 将产品内置 Agent Skill 复制到目标 workspace 的 `skills/` 目录作为用户源资产

#### Scenario: Skill 内容覆盖 Buildr 基础流程
- **WHEN** Buildr 维护内置 Buildr Skill
- **THEN** `SKILL.md` MUST 指导 Agent 使用 `buildr init`、`doctor --json`、`project create`、`service create`、runtime check/render 和可复用信息保存流程

#### Scenario: Skill 与 bootstrap guide 遵循同步契约
- **WHEN** Buildr 校验产品随包资产
- **THEN** Buildr MUST 校验 Buildr Skill 和 bootstrap guide 都覆盖 onboarding contract 声明的关键命令、Agent 分支和禁用入口

### Requirement: 内置 Agent Skills 通过现有 render 体系投射
Buildr MUST 使用现有 `buildr skills render <agent>` 体系渲染产品内置 Agent Skills，不得新增独立 bootstrap Skill 安装命令。

#### Scenario: 渲染 Claude Code Buildr Skill
- **WHEN** Agent 执行 `buildr skills render claude-code --scope <scope> --target <dir>`
- **THEN** Buildr MUST 将适用于 Claude Code 的产品内置 Agent Skills 渲染到 `<dir>/.claude/skills/`
- **AND** Buildr MUST 同时保留现有 workspace/root/project Skills 的渲染能力

#### Scenario: 禁止新增 bootstrap install-skill
- **WHEN** Buildr 提供 Buildr Skill 安装或渲染能力
- **THEN** Buildr MUST NOT 引入 `buildr bootstrap install-skill` 或等价的独立安装入口

#### Scenario: 未实现 adapter 时跳过
- **WHEN** 当前 Agent 没有对应 Skills adapter
- **THEN** Buildr MUST 明确跳过产品内置 Agent Skills 的 runtime 投射
- **AND** Agent MUST 继续通过 `AGENTS.md`、bootstrap guide 和 Buildr CLI 使用 workspace

### Requirement: 内置 Agent Skill 来源冲突必须显式处理
Buildr MUST 在产品内置 Agent Skills 与 workspace/root/project Skills 发生 id 冲突时报告错误，而不是静默覆盖。

#### Scenario: Buildr Skill id 冲突
- **WHEN** workspace 或 project Skills manifest 声明了与产品内置 Agent Skill 相同的 `id`
- **THEN** `buildr skills render <agent>` MUST 报告冲突
- **AND** 输出 MUST 说明冲突来源包含产品内置 Skill 和 workspace/project Skill
