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

#### Scenario: 产品验证覆盖 Buildr Skill 操作手册
- **WHEN** Agent 运行产品级临时 workspace 端到端验收
- **THEN** 验收 MUST 安装产品内置 Buildr Skill 到支持的 Agent runtime
- **AND** 验收 MUST 检查安装后的 Buildr Skill 仍包含 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产入口
- **AND** 验收 MUST 检查安装后的 Buildr Skill 以 `doctor --json` 作为默认事实入口
- **AND** 验收 MUST 检查安装后的 Buildr Skill 未退化为完整 CLI reference 或旧的独立命令地图结构
