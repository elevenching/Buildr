# product-agent-skills Specification

## Purpose
定义 Buildr 产品入口 Agent Skill、workspace / Project Skills 源资产、runtime 投射和场景化工作流引导契约。
## Requirements
### Requirement: 产品内置 Agent Skills
Buildr MUST 支持面向支持 runtime 的产品内置 Agent Skills，并将其作为 workspace sync 的一部分进行同步。

#### Scenario: 产品内置 Buildr Skill
- **WHEN** Buildr 产品包包含 Buildr 使用 Skill
- **THEN** 该 Skill MUST 由 package 的产品入口 Skill 声明管理
- **AND** `buildr skill install <agent>`、`buildr sync <agent>` 和首次 `buildr init --agent <agent>` MUST 能够为支持的 Agent runtime 安装或修复该 Skill
- **AND** 该 Skill MUST NOT 写入 workspace 的 `skills/manifest.yml`

#### Scenario: Buildr Skill 感知 Buildr 产品入口更新意图
- **WHEN** 用户要求 Agent“更新 Buildr”“同步 Buildr”或表达明确等价意图，且没有限定只更新 CLI
- **THEN** 产品内置 Buildr Skill 的 description 和正文 MUST 将这些表达统一识别为更新 Buildr CLI 与产品入口 Buildr Skill
- **AND** Buildr Skill MUST 引导 Agent 先运行 `buildr update`
- **AND** update 成功后 Agent MUST 重新解析当前 `buildr` 入口，再运行 `buildr skill install <agent> --target <dir>`
- **AND** Agent MUST NOT 因该意图同步其他 workspace 产品能力或执行完整 workspace sync

#### Scenario: Buildr Skill 感知只更新 CLI 意图
- **WHEN** 用户明确要求“只更新 CLI”、不要安装或修复 Buildr Skill，或表达明确等价限制
- **THEN** Buildr Skill MUST 引导 Agent 只运行 `buildr update`
- **AND** Agent MUST NOT 追加 Skill install、sync、runtime render 或 workspace doctor

#### Scenario: Buildr Skill 感知 Git 管理的 workspace 同步意图
- **WHEN** 用户要求 Agent“更新 workspace”“同步 workspace”或表达明确等价意图，且 workspace root 由 Git 管理
- **THEN** Buildr Skill MUST 引导 Agent 先复用 Git Ops 检查当前分支、upstream 和工作区状态，并安全更新本地 workspace checkout
- **AND** Git 更新成功后 Agent MUST 直接运行 `buildr sync <agent> --target <dir>`，不得因 sync 再次询问授权
- **AND** Agent MUST NOT 先运行 `buildr update`
- **AND** Agent MUST 使用 sync 的最终 doctor 结果判断 workspace 同步是否完成

#### Scenario: Git workspace 无法安全更新
- **WHEN** workspace Git 更新遇到本地改动、分叉、冲突、缺少 upstream 或其他需要用户决策的状态
- **THEN** Agent MUST 停止并说明实际状态和可执行选项
- **AND** Agent MUST NOT 自动 stash、rebase、覆盖或继续执行 `buildr sync`

#### Scenario: Buildr Skill 感知非 Git workspace 同步意图
- **WHEN** 用户要求 Agent“更新 workspace”“同步 workspace”或表达明确等价意图，且 workspace root 不由 Git 管理
- **THEN** Buildr Skill MUST 直接运行 `buildr sync <agent> --target <dir>`
- **AND** Agent MUST NOT 先运行 `buildr update`
- **AND** Agent MUST 使用 sync 的最终 doctor 结果判断 workspace 同步是否完成

#### Scenario: CLI update 受阻时停止 Buildr 产品入口更新
- **WHEN** `buildr update` 返回 Git、registry、权限或来源决策点
- **THEN** Buildr Skill MUST 向用户说明阻塞事实和可执行选项
- **AND** Agent MUST NOT 使用旧 CLI 继续安装 Buildr Skill

#### Scenario: Buildr Skill 感知首次初始化意图
- **WHEN** 用户要求 Agent 首次使用 Buildr 管理尚未初始化的目录，且 runtime adapter 已确认
- **THEN** Buildr Skill MUST 引导 Agent 使用 `buildr init --agent <agent>` 完成源资产初始化、产品 Buildr Skill 安装、runtime render 和 doctor
- **AND** Buildr Skill MUST NOT 把独立 `skill install` 或 `sync` 列为完成首次 onboarding 的额外必需步骤

#### Scenario: Buildr Skill 与用户 Skills 保持区分
- **WHEN** Buildr 同步产品内置 Skills
- **THEN** Buildr MUST 将产品入口 Buildr Skill 与 `skills/buildr/*` 能力 Skills 区分开
- **AND** 用户 workspace/project Skill 维护 MUST 继续使用 `skills/manifest.yml` 和源目录，而不是编辑 runtime 目录

#### Scenario: 内置能力 Skills 默认 optional
- **WHEN** Buildr 提供 `skills/buildr/*` 能力 Skills
- **THEN** 这些 Skills MUST 默认为 optional
- **AND** 用户 MUST 能够卸载 optional 内置 Skill，卸载时删除源目录和 runtime 投射，并在 `skills/manifest.yml` 保留卸载状态

### Requirement: 内置 Agent Skills 通过现有 render 体系投射
Buildr MUST 提供 `buildr skill install <agent>` 作为产品内置 Buildr Skill 的独立安装入口，并保留 `buildr skills render <agent>` 作为 workspace/root/project Skills 的 scope 投射能力。

#### Scenario: 安装 Claude Code Buildr Skill
- **WHEN** Agent 执行 `buildr skill install claude-code --target <dir>`
- **THEN** Buildr MUST 将适用于 Claude Code 的产品内置 Buildr Skill 安装到 `<dir>/.claude/skills/buildr/SKILL.md`
- **AND** Buildr MUST NOT 要求存在 workspace scope

#### Scenario: 渲染 Claude Code workspace Skills
- **WHEN** Agent 执行 `buildr skills render claude-code --scope <scope> --target <dir>`
- **THEN** Buildr MUST 渲染适用于该 scope 的 workspace/root/project Skills
- **AND** Buildr MUST NOT 通过该命令安装或修复产品内置 Buildr Skill
- **AND** 产品内置 Buildr Skill MUST 通过 `buildr skill install claude-code --target <dir>` 安装或修复

#### Scenario: 禁止新增 bootstrap install-skill
- **WHEN** Buildr 提供 Buildr Skill 安装或渲染能力
- **THEN** Buildr MUST NOT 引入 `buildr bootstrap install-skill`

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

### Requirement: Rule 与 Skill 语义边界
Buildr Skill MUST 按 asset semantics 定义 Rules 与 Skills，而不是按它们是否总会被加载定义，并且 MUST 说明 Rule manifest state 如何控制 Agent consumption。

#### Scenario: 解释 Rule 与 Skill
- **WHEN** 用户询问 Rules 与 Skills 的区别
- **THEN** Buildr Skill MUST explain that Rules control Agent values, boundaries, and constraints
- **AND** Buildr Skill MUST explain that Skills encapsulate reusable professional actions and procedures
- **AND** Buildr Skill MUST NOT define the primary distinction as whether the artifact is required or lazily loaded

#### Scenario: Agent 判断相关 Rules
- **WHEN** Agent works on a task that may touch user-managed Rules
- **THEN** Buildr Skill MUST require Agent to use Rule descriptions, user goals, files being changed, code semantics, and workspace context to judge relevant Rules
- **AND** Buildr Skill MUST NOT require users to preconfigure roles, paths, service names, or other routing tables for Rules relevance

#### Scenario: 解释 Rule manifest 状态
- **WHEN** 用户或 Agent 询问 enabled、required or state 如何影响 Rule 加载
- **THEN** Buildr Skill MUST explain that enabled、required and installed Rules are always read
- **AND** Buildr Skill MUST explain that enabled、non-required and installed Rules are semantically evaluated from description and read when relevant
- **AND** Buildr Skill MUST explain that disabled or uninstalled Rules do not participate in the current task
- **AND** Buildr Skill MUST distinguish runtime source discovery from Agent semantic relevance judgment

#### Scenario: Git 提交规则与技能边界
- **WHEN** Buildr Skill explains where Git commit guidance belongs
- **THEN** reusable Conventional Commits format、type selection and message generation procedure MUST belong to the Git operations Skill
- **AND** Buildr default commit language MUST belong to required Core so it remains independent of the Git operations Skill lifecycle
- **AND** more specific Project、Service or repository rules MUST be allowed to override the Core language default

### Requirement: Git Ops 生成精简提交信息
Buildr Git Ops Skill MUST 提供精简的 Conventional Commits 提交信息生成规则，并遵循 Core 和更具体的提交语言约定。

#### Scenario: 生成提交主题
- **WHEN** Agent 为已确认提交范围生成 commit message
- **THEN** subject MUST 使用 `<type>(<scope>): <subject>` 格式，其中 scope 可选
- **AND** type MUST 从 `feat`、`fix`、`docs`、`style`、`refactor`、`perf`、`test`、`build`、`ci`、`chore`、`revert` 中选择
- **AND** Agent MUST 基于实际提交内容选择 type 和 scope，不得猜测不明确的 scope

#### Scenario: 补充正文或破坏性变更
- **WHEN** 变更动机、行为差异或破坏性影响需要补充说明
- **THEN** Agent MUST 使用可选正文说明动机和行为差异
- **AND** 破坏性变更 MUST 使用 `BREAKING CHANGE:` 说明
- **AND** 不需要补充信息时 MUST 保持仅一行 subject

#### Scenario: 应用提交语言约定
- **WHEN** Agent 使用 Git Ops 生成 commit message
- **THEN** Git Ops MUST 遵循 Core 的默认提交语言和当前 scope 的更具体约定
- **AND** Git Ops MUST NOT 在 Skill 正文中复制 Core 的语言约束

#### Scenario: 仓库已有明确格式
- **WHEN** 项目或仓库规则定义了比 Git Ops 默认格式更具体的提交约定
- **THEN** Agent MUST 遵循更具体的项目或仓库约定

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
- **THEN** Buildr 技能 MUST 引导 Agent 先判断该技能是本地作者型 Skill 还是远端发布型 Skill
- **AND** 对于本地作者型 Skill，Buildr 技能 MUST 引导 Agent 使用 `skills add --source` 装载或登记完整 Skill 源目录
- **AND** 对于远端发布型 Skill，Buildr 技能 MUST 引导 Agent 使用 `skills add --remote-source` 登记来源
- **AND** 当 Agent 能从远端 source 中解析出精确安装源时，Buildr 技能 MUST 引导 Agent 使用 `skills add --resolved-source` 精确维护安装信息
- **AND** Buildr 技能 MUST 引导 Agent 按当前 Agent runtime 能力运行对应 render 或 runtime check

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
- **AND** 当可获得 version 或 integrity 时 Buildr 技能 MUST 引导 Agent 一并登记

#### Scenario: 维护命令行工具清单
- **WHEN** 用户要求组织使用某个外部命令行工具且该需求需要沉淀或复用
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `commands add/remove` 维护 `commands/manifest.yml`
- **AND** Buildr 技能 MUST 引导 Agent 运行 `commands check` 或 `doctor --json`

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
- **THEN** Buildr 技能 MUST 引导 Agent 先检查 Buildr workspace/project Skills manifest、source / resolved 状态和 runtime 状态
- **AND** 当 manifest 条目存在但 runtime 未同步或已过期时，Buildr 技能 MUST 引导 Agent 按当前 adapter 执行 Skills render 或 runtime check
- **AND** 当源资产不存在且该技能需要沉淀复用时，Buildr 技能 MUST 引导 Agent 先维护 Buildr Skills 源资产
- **AND** Buildr 技能 MUST NOT 引导 Agent 直接把 Agent runtime 目录当作源资产维护

#### Scenario: 本机找不到未声明的命令行工具
- **WHEN** 本机找不到用户所需命令行工具，且命令行工具清单没有对应组织声明
- **THEN** Buildr 技能 MUST 引导 Agent 判断该工具是否需要组织复用
- **AND** 当需要组织复用时，Buildr 技能 MUST 引导 Agent 先用 `commands add` 登记源资产，再运行 `commands check`
- **AND** 当只需一次性本机操作时，Buildr 技能 MUST NOT 要求写入 Buildr 命令行工具清单

### Requirement: Buildr Skill 引导安装对象路由
Buildr 产品内置 Skill MUST 帮助 Agent 根据用户明确意图和安装对象的实际资源组成，选择单项资产维护或 workspace Component 生命周期。

#### Scenario: 用户明确要求 Component
- **WHEN** 用户明确要求将某个对象作为 Component 安装或管理
- **THEN** Buildr Skill MUST 引导 Agent 使用 Component 流程
- **AND** 即使该 Component 只有一个 Rule、Skill 或 Command collection，Agent MUST NOT 擅自降级为单项资产安装

#### Scenario: 用户明确要求单项资产
- **WHEN** 用户明确要求安装或登记一个 Rule、Skill 或 Command，且没有要求 Component 生命周期
- **THEN** Buildr Skill MUST 引导 Agent使用对应资产维护入口
- **AND** Buildr Skill MUST NOT 无理由包装为 Component

#### Scenario: 用户只要求安装某个对象
- **WHEN** 用户只表达“安装 X”而没有说明资产类型
- **THEN** Buildr Skill MUST 引导 Agent 阅读权威来源并识别会增加的 Rules、Skills、Commands 和其他资源
- **AND** 当结果跨越多个 Buildr 资产类型或需要统一版本、更新和卸载时，Agent MUST 创建或选择 Component
- **AND** 当只有单一资产且没有统一生命周期需求时，Agent MUST 使用对应单项资产入口

#### Scenario: 安装对象组成不明
- **WHEN** Agent 无法可靠确认安装对象包含哪些资源或这些资源是否属于同一生命周期
- **THEN** Agent MUST 向用户说明未知点或继续调查
- **AND** Agent MUST NOT 要求 Buildr CLI 根据名称、目录或网页内容猜测 Component 边界

### Requirement: Buildr Skill 引导 Component 安装闭环
Buildr Skill MUST 将 Component definition 视为 Agent 已完成语义分析后的确定性输入，并引导 CLI 完成源资产、runtime 和 doctor 闭环。

#### Scenario: 使用随包 Component
- **WHEN** Buildr package 已提供匹配用户目标的 Component
- **THEN** Agent MUST 优先检查并复用其版本、来源、成员和 integrity 定义
- **AND** Agent MUST 在执行前向用户说明将安装的资产类型和外部 Command 要求

#### Scenario: 创建 workspace-owned Component
- **WHEN** 上游未提供 Buildr Component，但用户意图或资源组成要求统一生命周期
- **THEN** Buildr Skill MUST 引导 Agent 在 workspace `components/` 中创建完整定义
- **AND** 定义 MUST 记录可验证的来源、版本、成员和 integrity
- **AND** Agent MUST 在定义通过 Buildr 检查后再执行安装

#### Scenario: 安装或卸载完成检查
- **WHEN** Agent 执行 Component install 或 uninstall
- **THEN** Buildr Skill MUST 要求提供当前受支持 Agent id
- **AND** Buildr Skill MUST 要求完成 runtime reconcile 和最终 `doctor --agent <agent> --json`
- **AND** 仍有 error 时 Agent MUST NOT 报告任务完成

#### Scenario: 外部 CLI 差异
- **WHEN** Component Command collection 声明的外部 CLI 缺失或版本不匹配
- **THEN** Buildr Skill MUST 使用 Commands 检查结果和 `installHint` 向用户说明差异
- **AND** Buildr Skill MUST NOT 声称 Component 安装会自动修改本机 CLI

### Requirement: Buildr Skill 引导对象级卸载确认
Buildr 产品内置 Skill MUST 在用户只表达卸载对象而未明确 Component 范围时，先识别该对象的 Component 所有权，并在 Component 卸载前获得针对完整范围的二次确认。

#### Scenario: 卸载对象是 Component
- **WHEN** 用户表达“卸载 OpenSpec”或等价对象级卸载意图
- **AND** Component registry 或 `component check` 表明该对象由 Component 管理
- **THEN** Agent MUST 将卸载动作解释为 Component lifecycle operation
- **AND** Agent MUST NOT 直接调用单项 `skills remove`、`commands remove` 或 `builtin uninstall`

#### Scenario: 展示 Component 卸载范围
- **WHEN** Agent 已确认卸载对象是 Component
- **THEN** Agent MUST 在执行前展示 Component id、source、version 和 workspace scope
- **AND** Agent MUST 列出将删除的 Rules、Skills、Command collections 和当前 Agent runtime 投射
- **AND** Agent MUST 明确说明本机外部 CLI 和 Project 中已有内容不会被删除

#### Scenario: 二次确认后执行
- **WHEN** Agent 已展示完整 Component 卸载范围
- **THEN** Agent MUST 再次请求用户明确确认
- **AND** 只有用户确认该范围后 Agent MUST 执行 `buildr component uninstall`
- **AND** 用户拒绝、未确认或改变范围时 Agent MUST NOT 修改源资产或 runtime

#### Scenario: 卸载对象不是 Component
- **WHEN** Component registry 和 ownership 检查表明卸载对象不属于 Component
- **THEN** Buildr Skill MUST 引导 Agent 使用对应单项资产卸载协议
- **AND** Agent MUST NOT 为了执行卸载临时创建 Component

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
