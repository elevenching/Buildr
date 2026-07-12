## ADDED Requirements

### Requirement: Buildr 技能引导工具型资产维护
Buildr 内置技能 MUST 引导 Agent 使用 Buildr 源资产维护规则、技能和命令行工具清单，并区分源资产维护与运行环境投射。

#### Scenario: 维护规则
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的规则
- **THEN** Buildr 技能 MUST 引导 Agent 修改当前 scope 的 `AGENTS.md` 或 `rules/`
- **AND** Buildr 技能 MUST 引导 Agent 在需要时运行 runtime check 或 rules render

#### Scenario: 维护技能
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的技能
- **THEN** Buildr 技能 MUST 引导 Agent 修改当前 scope 的 `skills/manifest.yml` 和 `skills/<skill-id>/` 技能目录
- **AND** 技能目录 MUST 至少包含 `SKILL.md`
- **AND** Buildr 技能 MUST 引导 Agent 运行对应 Agent adapter 的 skills render

#### Scenario: 维护命令行工具清单
- **WHEN** 用户要求团队使用某个外部命令行工具且该需求需要沉淀或复用
- **THEN** Buildr 技能 MUST 引导 Agent 维护 `commands/manifest.yml`
- **AND** Buildr 技能 MUST 引导 Agent 运行 `commands check` 或 `doctor --json`

#### Scenario: 区分产品内置技能安装和 workspace 技能维护
- **WHEN** Agent 需要安装或修复 Buildr 产品内置技能
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `buildr skill install <agent>`
- **AND** Buildr 技能 MUST NOT 将 `buildr skill install <agent>` 描述为新增或维护 workspace/project 技能的入口

#### Scenario: 本机缺少命令行工具
- **WHEN** 命令行工具清单检查报告本机缺少命令或版本不满足要求
- **THEN** Buildr 技能 MUST 引导 Agent 根据清单中的最小安装提示或官方链接向用户说明差异
- **AND** Buildr 技能 MUST NOT 要求 Buildr 自动安装该命令行工具
