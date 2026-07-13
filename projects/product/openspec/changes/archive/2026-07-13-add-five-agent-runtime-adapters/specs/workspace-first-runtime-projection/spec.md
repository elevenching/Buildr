## ADDED Requirements

### Requirement: Buildr 支持五个新增 Agent runtime adapters
Buildr MUST 将 `cursor`、`qoder`、`trae`、`trae-work` 和 `workbuddy` 注册为五个独立 supported runtime adapter，并为每个 adapter 完整实现 `rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans` 和 `runtime-check`。

#### Scenario: Runtime list 返回新增 adapters
- **WHEN** Agent 运行 `buildr runtime list --json`
- **THEN** `supportedAgents` MUST 包含 `cursor`、`qoder`、`trae`、`trae-work` 和 `workbuddy`
- **AND** 每个 id MUST 对应独立 descriptor、traits、capability metadata、recommended commands 和 capability evidence
- **AND** Buildr MUST NOT 将任一新增 id alias 或 fallback 到其他 runtime

#### Scenario: 新增 adapter 契约不完整
- **WHEN** 任一新增 adapter 缺少 required capability、使用未注册 implementation、缺少 runtime-specific evidence 或不能覆盖 Buildr recursive Rules scope
- **THEN** adapter validation MUST fail
- **AND** Buildr MUST NOT 将该 adapter 报告为 supported

### Requirement: 新增 adapters 按目标 runtime 机制投射 Rules
Buildr MUST 为每个新增 adapter 使用已经认证的目标 runtime Rules 入口，同时保持 Buildr ancestor-before-descendant、scope ancestor chain、scope subtree 和 sibling isolation 语义。

#### Scenario: Cursor scoped project rule files
- **WHEN** Buildr render 或 check `cursor`
- **THEN** Buildr MUST 将每个 discovered `AGENTS.md` 确定性转换为同 source scope `.cursor/rules/buildr.mdc`
- **AND** nested rules MUST 依靠 Cursor nested project rules 目录作用域限定到对应 subtree，不依赖 native nested `AGENTS.md` 或中央 glob
- **AND** metadata MUST 将 Rules activation 描述为 `path-read`

#### Scenario: Qoder vendor rule files
- **WHEN** Buildr render `qoder`
- **THEN** Buildr MUST 将 discovered `AGENTS.md` 确定性转换为 `.qoder/rules` 下的 Buildr-managed rule files
- **AND** 转换结果 MUST 保留 source identity、scope 和 ancestor-before-descendant 顺序
- **AND** Buildr MUST NOT 依赖未认证的 Qoder native nested `AGENTS.md` 行为来补足 Rules scope

#### Scenario: TRAE vendor rule files
- **WHEN** Buildr render `trae`
- **THEN** Buildr MUST 将每个 discovered `AGENTS.md` 投射到该 source scope 可生效的 `.trae/rules` Buildr-managed target
- **AND** nested target MUST 只在对应目录或子树工作时应用
- **AND** sibling scope 的规则 MUST NOT 被投射为当前 sibling 的适用规则

#### Scenario: TRAE Work root reference bridge
- **WHEN** Buildr render `trae-work`
- **THEN** Buildr MUST 生成 TRAE Work 桌面版可导入的 Buildr-managed root reference bridge
- **AND** bridge MUST 明确要求 Agent 读取 root `AGENTS.md` 与当前工作路径 ancestor chain 中适用的 nested `AGENTS.md`
- **AND** runtime check MUST 报告 Rules import toggle 与新会话 activation guidance

#### Scenario: WorkBuddy root CODEBUDDY bridge
- **WHEN** Buildr render `workbuddy`
- **THEN** Buildr MUST 在 workspace root 生成短小的 Buildr-managed `CODEBUDDY.md` reference bridge
- **AND** bridge MUST 明确要求 Agent 读取 root `AGENTS.md` 与当前工作路径 ancestor chain 中适用的 nested `AGENTS.md`
- **AND** bridge MUST 不超过 WorkBuddy 5.2.5 已观察到的 8000 字符 project guidance 上限
- **AND** metadata MUST 将 Rules activation 描述为 `session-start`

### Requirement: Vendor rule files 与 root bridge 遵守通用 runtime 安全边界
Buildr MUST 让新增 Rules planners 只生成声明式 `RuntimePlan`，并复用通用 target validation、冲突预检、managed ownership、orphan cleanup 和 reconcile。

#### Scenario: 用户文件占用新增 adapter target
- **WHEN** Cursor、Qoder、TRAE、TRAE Work 或 WorkBuddy 的任一计划 target 已存在非 Buildr 管理内容
- **THEN** Buildr MUST 在写入任何计划 target 前失败
- **AND** Buildr MUST 保留全部用户内容并报告所有冲突

#### Scenario: 新增 adapter 重复同步
- **WHEN** 用户在 source assets、adapter、scope 和 target 不变时连续运行两次相同的新增 adapter render 或 sync
- **THEN** 第二次执行 MUST 不新增、更新或删除 runtime 文件

#### Scenario: 新增 adapter source 被删除
- **WHEN** Buildr-managed vendor rule file 或 bridge 已失去对应 source
- **THEN** 下一次相同范围 reconcile MUST 删除 orphan managed target 或从 root index 移除对应 source entry
- **AND** Buildr MUST NOT 删除非 Buildr 管理文件

### Requirement: 新增 adapters 使用各自认证的 Skills root 与 activation
Buildr MUST 将产品 Buildr Skill、workspace/Project Skills 和 Skill install plans 投射到每个新增 runtime 实际发现的 project-level Skills root，并公开其 activation 与 reload guidance。

#### Scenario: 共享 `.agents` Skills 投射
- **WHEN** Buildr 为 `cursor` 或 `trae` 安装或渲染 Skills
- **THEN** Buildr MUST 使用 `.agents/skills/<skill>/SKILL.md`
- **AND** Skill install plans MUST 位于 `.agents/buildr/skill-install-plans/`

#### Scenario: Vendor Skills 投射
- **WHEN** Buildr 为 `qoder`、`trae-work` 或 `workbuddy` 安装或渲染 Skills
- **THEN** Buildr MUST 分别使用 `.qoder`、`.trae` 或 `.codebuddy` 作为 project runtime root
- **AND** 每个 adapter MUST 继续保留独立 descriptor、activation、evidence 和 contract tests

#### Scenario: Skills 需要 reload 或新会话
- **WHEN** adapter 的 Skills activation 是 `explicit-reload` 或 `session-start`
- **THEN** runtime list、runtime check 和公开 adapter 文档 MUST 提供对应 reload 或新会话 guidance
- **AND** Buildr MUST NOT 将文件已写入描述为当前会话已经加载

### Requirement: 新增 adapters 的 checker 报告环境与前置条件事实
Buildr MUST 让每个新增 adapter 的 `runtime-check` 区分投射状态、安装/版本 probe 状态和 activation prerequisite，并且只执行随产品静态声明的有限时无 shell probe。

#### Scenario: Environment probe 可自动执行
- **WHEN** descriptor 声明静态 command installation 或 version probe
- **THEN** runtime check MUST 使用静态 executable 和 arguments 在有限超时内执行
- **AND** 输出 MUST 包含 probe 状态与可审计 evidence

#### Scenario: Environment 只能人工确认
- **WHEN** 目标 surface 没有稳定、安全、跨安装形态的 command probe
- **THEN** descriptor MUST 使用 `manual` probe 并给出确认 guidance
- **AND** runtime check MUST NOT 把该项报告为自动检查成功

#### Scenario: Adapter-specific prerequisite 未确认
- **WHEN** TRAE Work Rules import toggle、reference bridge 读取或目标版本 reload 行为无法由文件系统投射自动证明
- **THEN** runtime check MUST 返回明确 finding 和下一步
- **AND** Buildr MUST NOT 静默把该 prerequisite 计为 `ok`

### Requirement: 每个新增 adapter 保留独立兼容证据与分层验证状态
Buildr MUST 为每个新增 adapter 记录 runtime-specific 官方文档、本机观察或安装包源码证据，并使用 `documented` 或 `verified` 表达验证等级。supported descriptor 的 Rules、Skills 与 activation 路径至少 MUST 达到 `documented`；真实 runtime marker smoke 通过后 MAY 提升为 `verified`。

#### Scenario: 自动 contract evidence
- **WHEN** 产品验证检查新增 adapter
- **THEN** 每个 adapter MUST 有独立 capability evidence 和 contract fixture
- **AND** 共享 primitive 的测试结果 MUST NOT 代替具体 adapter 的五项 capability evidence
- **AND** 自动 tests MUST 覆盖投射格式、scope 顺序、兄弟隔离、Skills root、冲突保护、清理和 checker

#### Scenario: 真实产品 smoke 尚未完成
- **WHEN** 某个新增 adapter 已有足够官方资料、随包资料、discovery 源码或可重复本机观察，但尚未完成目标产品 marker smoke
- **THEN** descriptor 与权威文档 MUST 将验证等级标记为 `documented`，smoke 标记为 `pending`
- **AND** 产品 MUST NOT 把该状态描述为真实 runtime 已观察通过
- **AND** `pending` MUST NOT 要求 Buildr 自动点击 GUI、抓取应用私有数据库或重复验证 reload

#### Scenario: 一次性 trait smoke
- **WHEN** 维护者需要把 adapter 从 `documented` 提升为 `verified`
- **THEN** Buildr MUST 生成一个只读临时 workspace 和一份一次性 `SMOKE_PROMPT.md`
- **AND** smoke MUST 只验证投射测试无法证明的 scoped Rules 或 bridge traversal 以及 project Skill discovery
- **AND** activation/reload MUST 默认依据独立文档证据和 checker guidance，只有存在稳定 reload 命令或证据冲突时才额外实测
- **AND** GUI 产品 MAY 由维护者手工提交一次 Prompt，不要求产品级 UI automation

#### Scenario: 真实产品 smoke 与既有证据矛盾
- **WHEN** marker smoke 明确显示声明的 Rules 或 Skills 路径不生效
- **THEN** adapter MUST NOT 保持 `verified` 或把失败改写为 `pending`
- **AND** Buildr MUST 停止对应 capability 的 supported 声明，直到 descriptor、文档或实现被修正

#### Scenario: Reference bridge smoke
- **WHEN** 维护者验证 `trae-work` 或 `workbuddy` 的 `rules-entry`
- **THEN** smoke MUST 证明目标 Agent 实际读取 bridge 引用的 root 和当前 scope `AGENTS.md`
- **AND** smoke MUST 证明 sibling marker 未进入不相关任务
- **AND** 仅证明 bridge 文件存在 MUST NOT 视为 `rules-entry` 已通过
