## MODIFIED Requirements

### Requirement: 产品入口按 capability 路由用户意图
产品入口 Buildr Skill MUST 将跨 Skill 用户意图路由到已解析 capability provider，并 MUST NOT 把 builtin Skill id 当作不可替换入口；尚未声明 capability contract 的当前 builtin MUST 使用无歧义的当前 identity routing，并 MUST 将 legacy 名称意图收敛到当前入口。

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

#### Scenario: 未进入 capability contracts 的当前 builtin
- **WHEN** 用户意图路由到 `task-triage`、`task-board` 或其他尚未声明 capability contract 的当前 builtin
- **THEN** 产品入口 Buildr Skill MUST 使用当前 identity routing
- **AND** Buildr MUST NOT 声称该 builtin 已支持透明 provider substitution

#### Scenario: 旧任务驾驶舱意图路由到当前入口
- **WHEN** 用户仍使用“任务驾驶舱”或 `task-cockpit` 表达复杂任务可视化意图
- **THEN** 产品入口 Buildr Skill MUST 路由到 `task-board`
- **AND** runtime discovery MUST NOT 同时提供可被误选的受管 `task-cockpit` 入口
