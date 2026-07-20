## MODIFIED Requirements

### Requirement: 产品内置 Agent Skills
Buildr MUST 支持面向支持 runtime 的产品内置 Agent Skills，将其作为 workspace sync 的一部分进行同步，并 MUST 通过 capability contracts 路由可替换的 workspace 专业动作。

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
- **THEN** Buildr Skill MUST resolve `buildr.git-workspace-update/v1` and use the selected provider to inspect branch、upstream 和 working tree state and safely update the local checkout
- **AND** Git 更新成功后 Agent MUST 直接运行 `buildr sync <agent> --target <dir>`，不得因 sync 再次询问授权
- **AND** Agent MUST NOT 先运行 `buildr update`
- **AND** Agent MUST 使用 sync 的最终 doctor 结果判断 workspace 同步是否完成

#### Scenario: Git workspace update provider 不可用
- **WHEN** `buildr.git-workspace-update/v1` consumer readiness is `blocked`
- **THEN** Buildr Skill MUST stop before changing the checkout
- **AND** Agent MUST report the readiness reason and executable provider or binding nextActions
- **AND** Agent MUST NOT silently fall back to the uninstalled builtin `git-ops`

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
- **AND** 用户 Skill MUST 只在 workspace `skills/manifest.yml` 和 workspace 源目录维护
- **AND** Project 专用语义 MUST 由 capability/applicability context 表达，而不是编辑 runtime 或 Project Skill source

#### Scenario: 内置能力 Skills 默认 optional
- **WHEN** Buildr 提供 `skills/buildr/*` 能力 Skills
- **THEN** 这些 Skills MUST 默认为 optional
- **AND** 用户 MUST 能够卸载 optional 内置 Skill，卸载时删除源目录和 runtime 投射，并在 `skills/manifest.yml` 保留卸载状态
- **AND** Buildr MUST report any required consumers that become blocked without silently restoring the builtin

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
- **THEN** Buildr 技能 MUST 引导 Agent 直接在 workspace `skills/<skill-id>/SKILL.md` 和配套目录中维护源内容
- **AND** Buildr 技能 MUST 在内容完成后引导 Agent 使用 `skills add --source skills/<skill-id>` 登记到 workspace manifest
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
- **AND** Buildr 技能 MUST NOT 将 `buildr skill install <agent>` 描述为新增、装载或维护 workspace 技能的入口

#### Scenario: 本机缺少命令行工具
- **WHEN** 命令行工具清单检查报告本机缺少命令或版本不满足要求
- **THEN** Buildr 技能 MUST 引导 Agent 根据清单中的 `installHint` 向用户说明差异
- **AND** Buildr 技能 MUST NOT 要求 Buildr 自动安装该命令行工具

#### Scenario: Agent runtime 找不到 workspace 技能
- **WHEN** 当前 Agent runtime 找不到用户所需技能
- **THEN** Buildr 技能 MUST 引导 Agent 先检查 workspace Skills manifest、source / resolved 状态、Project capability/applicability context 和 runtime destination 状态
- **AND** 当 manifest 条目存在但 runtime 未同步或已过期时，Buildr 技能 MUST 引导 Agent 按当前 adapter 执行 Skills render 或 runtime check
- **AND** 当源资产不存在且该技能需要沉淀复用时，Buildr 技能 MUST 引导 Agent 先维护 workspace Skills 源资产
- **AND** Buildr 技能 MUST NOT 引导 Agent 直接把 Agent runtime 目录或 Project 目录当作源资产维护

#### Scenario: 本机找不到未声明的命令行工具
- **WHEN** 本机找不到用户所需命令行工具，且命令行工具清单没有对应组织声明
- **THEN** Buildr 技能 MUST 引导 Agent 判断该工具是否需要组织复用
- **AND** 当需要组织复用时，Buildr 技能 MUST 引导 Agent 先用 `commands add` 登记源资产，再运行 `commands check`
- **AND** 当只需一次性本机操作时，Buildr 技能 MUST NOT 要求写入 Buildr 命令行工具清单

### Requirement: 产品入口按 capability 路由用户意图
产品入口 Buildr Skill MUST 将跨 Skill 用户意图路由到已解析 capability provider，并 MUST NOT 把 builtin Skill id 当作不可替换入口。

#### Scenario: 完整 sync 注入 routing evidence
- **WHEN** `buildr sync <agent>` 在已初始化 workspace 中同时投射产品入口 Buildr Skill 和 workspace Skills
- **THEN** runtime Buildr Skill MUST 包含按适用 Project context 分组的受管 capability routing evidence
- **AND** evidence MUST 记录 contract、selected provider、provider runtime path、readiness、reason、contract digest 和 provenance

#### Scenario: Routing evidence 已陈旧
- **WHEN** existing runtime projection check 发现当前 scope/runtime 的 capability routing evidence 与重新解析结果不一致
- **THEN** evidence MUST 被标记为 stale
- **AND** 产品入口 Buildr Skill MUST 使用当前 workspace doctor 取得最新 capability graph 后再路由
- **AND** Agent MUST NOT 因存在旧 evidence 而继续使用已卸载或已改绑 provider
- **AND** Buildr MUST reuse the existing managed runtime content hash rather than introduce a separate graph digest protocol

#### Scenario: 独立 Skill install 没有当前 binding evidence
- **WHEN** 产品入口 Buildr Skill 由独立 `buildr skill install <agent>` 安装，或现有 routing evidence 不适用于当前 scope
- **THEN** Buildr Skill MUST NOT 猜测 builtin provider 或依赖静态 Skill id
- **AND** 在已初始化 workspace 中 MUST 使用当前 workspace doctor 的 capability graph 解析 provider 后再路由
- **AND** v1 MUST NOT 为此新增独立 capability dispatch CLI

#### Scenario: 路由单项 Git 意图
- **WHEN** 用户通过产品入口表达明确单项 Git 意图
- **THEN** Buildr Skill MUST route it to the bound `buildr.git-single-operation/v1` provider
- **AND** runtime routing evidence or current doctor result MUST identify the selected provider and scope

#### Scenario: 路由任务工作流意图
- **WHEN** 用户表达 worktree、完整收尾或资产审查意图
- **THEN** Buildr Skill MUST route to the bound `buildr.task-worktree-lifecycle/v1`、`buildr.task-finish/v1` or `buildr.task-asset-review/v1` provider as applicable
- **AND** Buildr Skill MUST honor blocked and degraded semantics

#### Scenario: 用户替换 builtin provider
- **WHEN** a workspace or Project binding selects an internal Skill with a different id
- **THEN** Buildr Skill MUST route to that provider without requiring an identically named builtin
- **AND** provider substitution MUST survive update、sync and runtime render

#### Scenario: 未进入首批 contracts 的 builtin
- **WHEN** 用户意图路由到 `task-triage`、`task-cockpit` 或其他尚未声明 capability contract 的 builtin
- **THEN** 产品入口 Buildr Skill MUST 继续使用现有 identity routing
- **AND** Buildr MUST NOT 声称该 builtin 已支持透明 provider substitution

### Requirement: Buildr Skill 使用 workspace source 与两种 render destination
产品入口 Buildr Skill MUST 将 Skill 源资产维护统一路由到 workspace，并 MUST 根据用户意图区分 user 与 workspace render destination。

#### Scenario: 用户创建项目专用 Skill
- **WHEN** 用户要求沉淀只适用于某个 Project 的 Skill
- **THEN** Buildr Skill MUST 在 workspace `skills/` 创建或登记该 Skill
- **AND** MUST 在 Project capability/applicability context 中记录项目语义
- **AND** MUST NOT 创建 Project `skills/` 源目录

#### Scenario: 用户要求当前工作目录使用 Skill
- **WHEN** 用户只要求当前 workspace 使用已登记 Skill
- **THEN** Buildr Skill MUST 使用 `buildr skills render <agent> --destination workspace`
- **AND** MUST NOT 修改用户级 Skills root

#### Scenario: 用户要求其他 workspace 也可使用 Skill
- **WHEN** 用户明确要求全局或个人级安装
- **THEN** Buildr Skill MUST 说明来源仍是当前 workspace
- **AND** MUST 在取得用户级写入授权后使用 `buildr skills render <agent> --destination user`

#### Scenario: init 和 sync 保持 workspace destination
- **WHEN** Agent 执行 init、sync 或未显式选择 destination 的 render
- **THEN** Buildr Skill MUST 只维护 workspace destination
- **AND** MUST NOT 隐式修改用户级 Skills

#### Scenario: Agent runtime 找不到所需 Skill
- **WHEN** 当前 Agent runtime 找不到用户所需 Skill
- **THEN** Buildr Skill MUST 检查 workspace Skill source、Project capability/applicability context 和当前 destination receipt
- **AND** 当 source 存在但 runtime 未同步或已过期时，MUST 引导 Agent执行对应 Skills render 或 runtime check
- **AND** MUST NOT 引导 Agent 直接把 Agent runtime 目录或 Project 目录当作 Skill source 维护
