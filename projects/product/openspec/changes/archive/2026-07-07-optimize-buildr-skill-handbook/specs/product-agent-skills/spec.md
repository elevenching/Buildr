## MODIFIED Requirements

### Requirement: 产品内置 Agent Skills
Buildr MUST 支持产品随包内置 Agent Skills，用于向支持 Skills runtime 的 Agent 提供 Buildr 产品能力入口。

#### Scenario: 声明 Buildr 内置 Skill
- **WHEN** Buildr 产品包包含 Buildr 使用能力的 Agent Skill
- **THEN** 该 Skill MUST 以产品随包资产形式维护
- **AND** 默认源路径 MUST 为 `package/agent-skills/buildr/SKILL.md` 或 manifest 中等价声明的产品随包路径

#### Scenario: 不混入 workspace skills 源
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST NOT 将产品内置 Agent Skill 复制到目标 workspace 的 `skills/` 目录作为用户源资产

#### Scenario: 单独安装 Buildr 产品内置 Skill
- **WHEN** Agent 执行 `buildr skill install claude-code --target <dir>`
- **THEN** Buildr MUST 将产品内置 Buildr Skill 安装到 `<dir>/.claude/skills/buildr/SKILL.md`
- **AND** 该命令 MUST NOT 要求目标目录已经初始化为 Buildr workspace
- **AND** 该命令 MUST NOT 读取 workspace 或 project 的 `skills/manifest.yml`
- **AND** 当目标文件已存在且不是 Buildr managed 文件时 MUST 拒绝覆盖

#### Scenario: Skill 内容提供操作协议
- **WHEN** Buildr 维护内置 Buildr Skill
- **THEN** `SKILL.md` MUST 指导 Agent 使用 Buildr CLI 完成用户指令
- **AND** `SKILL.md` MUST 要求 workspace 完成 `init`，并根据当前 Agent 需要完成 Buildr Skill 安装、`rules render` 和 `skills render`
- **AND** `SKILL.md` MUST 要求 Agent 以 `buildr doctor --json` 作为默认事实和诊断入口
- **AND** `SKILL.md` MUST 引导 Agent 根据诊断结果帮助用户创建 Project 和接入 Service

#### Scenario: Skill 与 bootstrap guide 遵循入口契约
- **WHEN** Buildr 校验产品随包资产
- **THEN** Buildr MUST 校验 Buildr Skill 和 bootstrap guide 满足 bootstrap contract 声明的入口守卫
- **AND** bootstrap contract MUST 以 Buildr Skill 为主入口，bootstrap guide 为发现和恢复入口
- **AND** bootstrap contract MUST NOT 要求 bootstrap guide 覆盖 Buildr Skill 的完整资产维护细节

#### Scenario: 产品仓维护 Buildr Skill
- **WHEN** 产品仓维护 `package/agent-skills/buildr/SKILL.md`
- **THEN** 根 `AGENTS.md` MUST 提供简短的 Buildr Skill 维护原则
- **AND** 该原则 MUST 定位 `package/agent-skills/buildr/SKILL.md` 为 Agent 使用 Buildr 的操作手册
- **AND** 该原则 MUST 要求维护内容帮助 Agent 判断任务归属、源资产入口、CLI 主路径、诊断方式和必要的后续读取
- **AND** 该原则 MUST 要求 `doctor --json` 作为默认事实入口，专项检查命令只作为更细诊断入口
- **AND** 该原则 MUST NOT 成为完整的 Buildr Skill 维护手册或 CLI 参考

#### Scenario: Buildr Skill 作为 Agent 操作手册
- **WHEN** Agent 读取 Buildr Skill 来操作 Buildr workspace
- **THEN** Buildr Skill MUST 直接提供操作流程和决策规则
- **AND** Buildr Skill MUST 按 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类 Buildr 资产组织相关概念、命令和判断规则
- **AND** Buildr Skill 的命令说明 MUST 服务于 Agent 决策
- **AND** Buildr Skill MUST NOT 要求单独命令地图或展开复杂参数的完整说明
- **AND** Buildr Skill MUST 引导 Agent 在需要细节时读取当前 manifest、对应资产章节、CLI 帮助或 CLI 错误输出

### Requirement: Buildr 技能引导工具型资产维护
Buildr 内置技能 MUST 引导 Agent 使用 Buildr 源资产维护规则、技能和命令行工具清单，并区分源资产维护与运行环境投射。

#### Scenario: 维护规则
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的规则
- **THEN** Buildr 技能 MUST 引导 Agent 修改当前 scope 的 `AGENTS.md` 或 `rules/`
- **AND** Buildr 技能 MUST NOT 引导 Agent 使用不存在的 `rules add/remove`
- **AND** Buildr 技能 MUST 引导 Agent 在需要时运行 `doctor --json`、runtime check 或 rules render

#### Scenario: 维护技能
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的技能
- **THEN** Buildr 技能 MUST 引导 Agent 先判断该技能是本地作者型 Skill 还是远端发布型 Skill
- **AND** 对于本地作者型 Skill，Buildr 技能 MUST 引导 Agent 使用 `skills add --source` 装载或登记完整 Skill 源目录
- **AND** 对于远端发布型 Skill，Buildr 技能 MUST 引导 Agent 使用 `skills add --remote-source` 登记来源
- **AND** 当 Agent 能从远端 source 中解析出精确安装源时，Buildr 技能 MUST 引导 Agent 使用 `skills add --resolved-source` 精确维护安装信息
- **AND** Buildr 技能 MUST 引导 Agent 优先通过 `doctor --json` 判断当前 Agent runtime 状态，并在需要时执行对应 render 或专项 runtime check

#### Scenario: 从零创建技能内容
- **WHEN** 用户要求从零设计一个新 Skill
- **THEN** Buildr 技能 MUST 引导 Agent 直接在目标 scope 的 `skills/<skill-id>/SKILL.md` 和配套目录中维护源内容
- **AND** Buildr 技能 MUST 在内容完成后引导 Agent 使用 `skills add --source <scope>/skills/<skill-id>` 登记到 manifest
- **AND** Buildr 技能 MUST NOT 将 `skills add` 描述为自动生成高质量 Skill 内容的命令

#### Scenario: 登记远端信息源
- **WHEN** 用户提供一个可能包含 Skill 的网页、README、GitHub 页面、registry 页面或其他 URL
- **THEN** Buildr 技能 MUST 引导 Agent 先用 `skills add --remote-source` 登记该 source
- **AND** Buildr 技能 MUST NOT 假设该 source 是可直接安装的 Skill 包

#### Scenario: 解析远端信息源
- **WHEN** Agent 从远端 source 中识别出 raw `SKILL.md` 或当前 CLI 已支持的其他精确安装源
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `skills add --resolved-source --replace` 更新对应 manifest 条目
- **AND** 当可获得版本或 integrity 时 Buildr 技能 MUST 引导 Agent 一并登记

#### Scenario: 维护命令行工具清单
- **WHEN** 用户要求团队使用某个外部命令行工具且该需求需要沉淀或复用
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `commands add/remove` 维护 `commands/manifest.yml`
- **AND** Buildr 技能 MUST 引导 Agent 运行 `doctor --json` 或 `commands check`

#### Scenario: 区分产品内置技能安装和 workspace 技能维护
- **WHEN** Agent 需要安装或修复 Buildr 产品内置技能
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `buildr skill install <agent>`
- **AND** Buildr 技能 MUST NOT 将 `buildr skill install <agent>` 描述为新增、装载或维护 workspace/project 技能的入口

#### Scenario: 本机缺少命令行工具
- **WHEN** 命令行工具清单检查报告本机缺少命令或版本不满足要求
- **THEN** Buildr 技能 MUST 引导 Agent 根据清单中的 `installHint` 向用户说明差异
- **AND** Buildr 技能 MUST NOT 要求 Buildr 自动安装该命令行工具

#### Scenario: Agent runtime 找不到 workspace/project 技能
- **WHEN** 当前 Agent runtime 找不到用户所需技能
- **THEN** Buildr 技能 MUST 引导 Agent 先检查 Buildr workspace/project Skills manifest、source/resolved 状态和 doctor 报告的 runtime 状态
- **AND** 当 manifest 条目存在但 runtime 未同步或已过期时，Buildr 技能 MUST 引导 Agent 按当前 adapter 执行 Skills render 或专项 runtime check
- **AND** 当源资产不存在且该技能需要沉淀复用时，Buildr 技能 MUST 引导 Agent 先维护 Buildr Skills 源资产
- **AND** Buildr 技能 MUST NOT 引导 Agent 直接把 Agent runtime 目录当作源资产维护

#### Scenario: 本机找不到未声明的命令行工具
- **WHEN** 本机找不到用户所需命令行工具，且命令行工具清单没有对应团队声明
- **THEN** Buildr 技能 MUST 引导 Agent 判断该工具是否需要团队复用
- **AND** 当需要团队复用时，Buildr 技能 MUST 引导 Agent 先用 `commands add` 登记源资产，再运行 `doctor --json` 或 `commands check`
- **AND** 当只需一次性本机操作时，Buildr 技能 MUST NOT 要求写入 Buildr 命令行工具清单
