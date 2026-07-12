## MODIFIED Requirements

### Requirement: MVP 先通过 Buildr Skill 和基础命令闭环
Buildr MVP MUST 通过 Buildr Skill、bootstrap guide 兜底、带 Agent identity 的高层 `init`、`project create`、`service create`、`doctor` 和按 Agent 类型选择的 runtime 动作完成 onboarding 闭环，不得要求先实现 `buildr use` 等额外入口。

#### Scenario: Agent 获取 Buildr 使用指南
- **WHEN** Agent 通过 README、安装说明、`buildr --help` 或本地 CLI 发现 Buildr，但当前 workspace 尚未初始化且当前 runtime adapter 已确认
- **THEN** Agent MUST 优先使用 `buildr init --agent <agent>` 初始化 workspace 并安装产品 Buildr Skill
- **AND** 当 Buildr Skill 仍不可用时，Agent MUST 能通过 `buildr bootstrap guide` 理解基础命令和 onboarding 兜底路径

#### Scenario: Agent 使用 Buildr Skill
- **WHEN** 当前 Agent runtime 已安装 Buildr Skill
- **THEN** Agent MUST 通过 Buildr Skill 理解 Buildr workspace onboarding、项目创建、服务接入、诊断和 runtime 处理约束
- **AND** Buildr Skill MUST 以轻约束和命令地图引导 Agent 自主编排，而不是规定固定交互脚本

#### Scenario: service create 维护服务资产
- **WHEN** Agent 需要创建或维护 service metadata 与 service repo 引用
- **THEN** Agent MUST 使用 `buildr service create`
- **AND** bootstrap guide MUST NOT 将 `service link` 描述为主命令

#### Scenario: 共享服务创建项目
- **WHEN** 用户希望接入共享、基础或平台 service repo
- **THEN** Agent MUST 引导用户选择或创建一个 Project 来承载这些 services
- **AND** Agent MUST NOT 引导用户维护 root `shared/`

#### Scenario: 渐进式引导项目和服务
- **WHEN** Agent 完成 `buildr init --agent <agent>` 或其他 Buildr 状态变更
- **THEN** Agent MUST 基于该命令的最终 doctor 结果和用户回答，逐步引导创建项目、接入 service repo 和执行必要的 runtime 维护

#### Scenario: Agent 根据自身 runtime 选择动作
- **WHEN** Agent 准备执行 `buildr init --agent <agent>`
- **THEN** bootstrap guide 和 Buildr Skill MUST 引导 Agent 先确认自身 runtime adapter
- **AND** 对原生读取 `AGENTS.md` 的 Agent MUST NOT 要求执行独立 rules render

#### Scenario: Codex 使用 Buildr workspace
- **WHEN** Codex Agent 在 Buildr workspace 中工作
- **THEN** Agent MUST 直接使用 `AGENTS.md` 作为规则入口
- **AND** Agent MUST NOT 为规则入口执行 `buildr rules render claude-code`

#### Scenario: Claude Code 使用 Buildr workspace
- **WHEN** Claude Code Agent 在 Buildr workspace 中工作
- **THEN** Agent MUST 使用 Claude Code adapter 的 runtime check/render 来维护 `CLAUDE.md` 和 `.claude/skills/`

#### Scenario: 纯源资产初始化保持兼容
- **WHEN** Agent 执行不带 `--agent` 的 `buildr init`
- **THEN** Buildr MUST 只创建 Buildr workspace 源资产
- **AND** Buildr MUST NOT 自动渲染 Buildr Skill、`CLAUDE.md` 或其他 Agent runtime 文件

#### Scenario: 高层初始化准备当前 Agent runtime
- **WHEN** Agent 执行 `buildr init --agent <agent> --target <dir>`
- **THEN** Buildr MUST 在创建 workspace 源资产后执行等价于 `buildr sync <agent> --target <dir>` 的完整 reconcile
- **AND** Buildr MUST 以指定 Agent 的最终 doctor 通过作为 onboarding 完成条件
- **AND** Agent MUST NOT 需要再执行独立的 `skill install`、`render`、`sync` 或 `doctor` 才完成首次 onboarding

#### Scenario: 高层初始化参数预检
- **WHEN** `buildr init --agent <agent>` 收到不支持或无效的 Agent id
- **THEN** Buildr MUST 在写入 workspace 源资产或 Agent runtime 前失败
- **AND** Buildr MUST 输出 supported runtime guidance

#### Scenario: 高层初始化 sync 失败
- **WHEN** workspace 源资产已经初始化，但 `init --agent` 的后续 sync 或 doctor 未通过
- **THEN** Buildr MUST 保留已初始化的 workspace 源资产
- **AND** Buildr MUST NOT 报告 onboarding 成功
- **AND** Buildr MUST 引导 Agent 修复问题后运行 `buildr sync <agent> --target <dir>`

#### Scenario: 产品 Skill 安装不同于 workspace Skills 投射
- **WHEN** Agent 只需要让当前 runtime 学会使用 Buildr
- **THEN** Agent MUST 使用 `buildr skill install <agent>`
- **AND** 当 Agent 需要投射 workspace/project Skills 时，Agent MUST 使用 `buildr skills render <agent>`

#### Scenario: 讨论其他更高层入口
- **WHEN** 需要评估 `buildr use` 等其他更高层入口
- **THEN** 该能力 MUST 在 `init --agent` onboarding 效果被验证后再单独设计

### Requirement: 开发仓库安装必须形成 Agent 可用闭环
Buildr MUST 提供与当前 GitHub 仓库结构一致的开发 checkout 安装路径，使 Agent 在没有预装 `node_modules` 或 Buildr Skill 的干净 clone 中能够准备 CLI，并用单个高层初始化命令完成 workspace 源资产、当前 runtime 和诊断闭环。

#### Scenario: Agent 从干净开发仓库开始
- **WHEN** Agent 在 Buildr GitHub 仓库的干净 clone 中按公开 README 安装 Buildr
- **THEN** 安装说明 MUST 使用仓库中真实存在的产品目录和安装脚本
- **AND** 安装流程 MUST 确定性准备 lockfile 声明的运行依赖
- **AND** Agent MUST 能运行 `buildr runtime list --json`

#### Scenario: Agent 完成首次 runtime 准备
- **WHEN** CLI 已从开发 checkout 或已安装 npm package 可用，且 Agent 已从 supported runtime list 选择自身 adapter
- **THEN** 公开 onboarding MUST 引导 Agent 运行 `buildr init --agent <agent>`
- **AND** 该单个命令 MUST 创建源资产、安装产品 Buildr Skill、投射 workspace Skills 并运行最终 doctor
- **AND** 最终 doctor MUST 不包含需要立即处理的 error

#### Scenario: 开发仓库安装回归验证
- **WHEN** 产品完整验证运行 repository onboarding smoke test
- **THEN** verifier MUST 使用不包含 `node_modules` 和 Agent runtime 产物的临时候选树
- **AND** verifier MUST 从公开安装入口完成 CLI 安装并仅用 `buildr init --agent <agent>` 完成 workspace/runtime onboarding
- **AND** verifier MUST 独立读取 doctor JSON 证明最终状态可用
