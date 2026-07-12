## ADDED Requirements

### Requirement: Rule 与 Skill 语义边界
Buildr Skill MUST 按 asset semantics 定义 Rules 与 Skills，而不是按它们是否总会被加载定义。

#### Scenario: 解释 Rule 与 Skill
- **WHEN** 用户询问 Rules 与 Skills 的区别
- **THEN** Buildr Skill MUST explain that Rules control Agent values, boundaries, and constraints
- **AND** Buildr Skill MUST explain that Skills encapsulate reusable professional actions and procedures
- **AND** Buildr Skill MUST NOT define the primary distinction as whether the artifact is required or lazily loaded

#### Scenario: Agent 判断相关 Rules
- **WHEN** Agent works on a task that may touch user-managed Rules
- **THEN** Buildr Skill MUST require Agent to use Rule descriptions, user goals, files being changed, code semantics, and workspace context to judge relevant Rules
- **AND** Buildr Skill MUST NOT require users to preconfigure roles, paths, service names, or other routing tables for Rules relevance

## MODIFIED Requirements

### Requirement: Buildr 技能引导工具型资产维护
Buildr 内置技能 MUST 引导 Agent 使用 Buildr 源资产维护规则、技能和命令行工具清单，并区分源资产维护与运行环境投射。

#### Scenario: 维护规则
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的 root/Organization 规则
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `rules add/remove` 维护 `rules/manifest.yml`
- **AND** Buildr 技能 MUST 引导 Agent 直接编辑 `AGENTS.md` 或 `rules/` 中的 Markdown 正文来维护规则内容
- **AND** Buildr 技能 MUST 说明 Rule description 是 Agent 判断规则语义相关性的索引，而不是人维护的路径或角色路由表
- **AND** Buildr 技能 MUST 引导 Agent 在需要时运行 doctor、runtime check 或 rules render

#### Scenario: 维护技能
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的技能
- **THEN** Buildr 技能 MUST 引导 Agent 区分本地源目录 Skill 与引用型 Skill
- **AND** 对于需要组织直接维护内容的 Skill，Buildr 技能 MUST 引导 Agent 使用 `skills add/remove` 装载或移除完整 Skill 源目录
- **AND** 对于由产品包或受支持外部来源维护的 Skill，Buildr 技能 MUST 引导 Agent 维护 `skills/manifest.yml` 中的引用型条目
- **AND** Buildr 技能 MUST 说明 workspace/project 技能源资产至少由 `skills/manifest.yml` 组成，本地作者型 Skill 还包含 `skills/<skill-id>/` 目录
- **AND** 本地技能目录 MUST 至少包含 `SKILL.md`
- **AND** Buildr 技能 MUST 引导 Agent 按当前 Agent runtime 能力运行对应 render 或 runtime check

#### Scenario: 从零创建技能内容
- **WHEN** 用户要求从零设计一个新 Skill
- **THEN** Buildr 技能 MUST 引导 Agent 直接在目标 scope 的 `skills/<skill-id>/SKILL.md` 和配套目录中维护源内容
- **AND** Buildr 技能 MAY 引导 Agent 在内容完成后使用 `skills add --source <scope>/skills/<skill-id>` 登记为本地源目录条目

### Requirement: Buildr Skill 引导场景化内置 Skills
产品内置 Buildr Skill MUST 在用户意图匹配相关工作流时，引导 Agent 使用场景化内置 Skills。

#### Scenario: 用户询问 Rules 与 Skills
- **WHEN** 用户询问如何维护或重组 Buildr rules 和 skills
- **THEN** Buildr Skill MUST 说明任务触发型流程应归入 Skills
- **AND** Buildr Skill MUST 将 Rules 视为 Agent 价值观、边界和约束的承载位置
- **AND** Buildr Skill MUST 将 Skills 视为可复用专业动作和操作流程的承载位置

#### Scenario: Agent runtime 找不到场景化 Skill
- **WHEN** 某个工作流应由内置场景化 Skill 处理，但当前 Agent runtime 找不到该 Skill
- **THEN** Buildr Skill MUST 引导 Agent 检查 workspace Skills 源资产和 runtime 投射状态
- **AND** Buildr Skill MUST 优先引导 `skills render`、`sync` 或 doctor 指导的修复，而不是把工作流文本复制到 Rules
