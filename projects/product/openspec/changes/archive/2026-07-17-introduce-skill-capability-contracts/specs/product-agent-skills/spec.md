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
- **AND** 用户 workspace/project Skill 维护 MUST 继续使用 `skills/manifest.yml` 和源目录，而不是编辑 runtime 目录

#### Scenario: 内置能力 Skills 默认 optional
- **WHEN** Buildr 提供 `skills/buildr/*` 能力 Skills
- **THEN** 这些 Skills MUST 默认为 optional
- **AND** 用户 MUST 能够卸载 optional 内置 Skill，卸载时删除源目录和 runtime 投射，并在 `skills/manifest.yml` 保留卸载状态
- **AND** Buildr MUST report any required consumers that become blocked without silently restoring the builtin

## ADDED Requirements

### Requirement: 产品入口识别工作能力适配意图
产品入口 Buildr Skill MUST 识别可能改变 Skill 行为或跨 Skill 协作关系的用户工作意图，并 MUST 将具体资产开发路由到 `capability-adaptation` 管理 Skill。

#### Scenario: 用户不使用 capability 术语
- **WHEN** 用户只表达“采用内部流程”“调整工作方式”“修改默认 Skill 行为”或等价自然语言意图
- **THEN** Buildr Skill MUST 识别这是工作资产维护意图
- **AND** Agent MUST NOT 要求用户先指出 Skill id、capability id、provider 或 binding

#### Scenario: 判断是否形成能力契约
- **WHEN** Agent 准备创建、修改、替换或卸载相关 Skill
- **THEN** Buildr Skill MUST 路由到 `capability-adaptation`
- **AND** 适配流程 MUST 判断目标行为是否被其他 Skill 组合、是否需要替换实现、consumer 是否依赖稳定保证或结果证据，以及生命周期是否需要影响诊断

#### Scenario: 产品入口是能力路由者
- **WHEN** 产品入口根据某个用户意图使用 capability routing evidence
- **THEN** 该 capability MUST 只作为本次意图的 required dependency
- **AND** 单项 capability blocked MUST NOT 阻塞 Buildr Skill 的无关管理意图
- **AND** 产品入口 MUST NOT 作为具有全部 capabilities required dependencies 的 workspace manifest consumer

### Requirement: 产品入口按 capability 路由用户意图
产品入口 Buildr Skill MUST 将跨 Skill 用户意图路由到已解析 capability provider，并 MUST NOT 把 builtin Skill id 当作不可替换入口。

#### Scenario: 完整 sync 注入 routing evidence
- **WHEN** `buildr sync <agent>` 在已初始化 workspace 中同时投射产品入口 Buildr Skill 和 workspace/Project Skills
- **THEN** runtime Buildr Skill MUST 包含按 scope 分组的受管 capability routing evidence
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
