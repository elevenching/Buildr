## MODIFIED Requirements

### Requirement: Runtime 投射按 Agent 能力选择
Buildr MUST 将支持的 Agent runtime 视为从 Buildr 源资产、canonical scope discovery plan 和已启用内置能力生成的 adapter 投射。

#### Scenario: Codex runtime 投射
- **WHEN** Buildr 渲染 Codex adapter
- **THEN** Buildr MUST 保持 discovered `AGENTS.md` files 作为 Codex 原生规则入口
- **AND** Buildr MUST NOT 为 Rules 写入 Codex bridge 文件
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到当前 Codex 打开工作目录的 `.agents/skills/`
- **AND** Buildr MUST 将 `.agents/skills/` 视为 workspace destination 投射产物，而不是长期 Buildr 源资产

#### Scenario: Claude Code runtime 投射
- **WHEN** Buildr 渲染 Claude Code adapter
- **THEN** Buildr MUST 为 discovery plan 中每个 `AGENTS.md` 写入或更新同目录 `CLAUDE.md` 引用桥
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到当前工作目录的 `.claude/skills/`
- **AND** Buildr MUST 将 `CLAUDE.md` 和 `.claude/skills/` 视为 workspace destination 投射产物，而不是长期 Buildr 源资产

#### Scenario: 支持的 adapters
- **WHEN** Buildr syncs or renders Agent runtime
- **THEN** Buildr MUST 支持 `codex` 和 `claude-code`
- **AND** Buildr MUST 清楚报告不支持的 adapter，且不得修改 runtime 文件

#### Scenario: Runtime 准备顺序
- **WHEN** Buildr 渲染 Agent runtime
- **THEN** Buildr MUST 按 `rules/manifest.yml` 暴露和检查 enabled rules
- **AND** Buildr MUST 按 workspace `skills/manifest.yml` 投射 enabled skills
- **AND** Buildr 内置项 MUST 在 manifest 中排在用户项之前
- **AND** rule discovery plan MUST order ancestor sources before descendant sources
- **AND** 在处理 Project scope 时，Buildr MUST 在 workspace 资产之后处理 Project 用户资产与 capability/applicability context
- **AND** 更具体的源资产 MUST 在 Agent 可读入口中更靠后出现

#### Scenario: Rules 语义索引读取
- **WHEN** Agent 进入 Buildr workspace scope
- **THEN** Agent MUST 先读取 applicable `AGENTS.md` 和 `rules/buildr/core.md`
- **AND** Agent MUST 再读取 `rules/manifest.yml`
- **AND** Agent MUST 根据用户目标、修改范围、代码语义、workspace context 和 Rule `description` 判断 enabled user Rules 是否与当前任务相关
- **AND** Agent MUST NOT require `rules/manifest.yml` to contain structured role, path, service, or directory routing tables

#### Scenario: Rule 和 Skill 加载语义
- **WHEN** Buildr exposes Rules and Skills to an Agent runtime
- **THEN** Buildr MUST distinguish Rules and Skills by asset semantics rather than by whether they are always loaded
- **AND** Buildr MUST treat Rules as values, boundaries, and constraints
- **AND** Buildr MUST treat Skills as reusable professional actions and procedures

#### Scenario: Rule manifest 状态消费
- **WHEN** Agent consumes a valid `rules/manifest.yml`
- **THEN** Agent MUST read every enabled、required and installed Rule before performing workspace work
- **AND** Agent MUST inspect the description of every enabled、non-required and installed Rule
- **AND** Agent MUST read an optional Rule body before acting when user goals、changed files、code semantics or workspace context make that Rule relevant
- **AND** Agent MUST NOT use disabled or uninstalled Rules for the current task
- **AND** adapter discovery MUST NOT decide semantic Rule relevance on behalf of the Agent

#### Scenario: 根 sync 递归投射
- **WHEN** Agent runs `buildr sync <agent> --target <root>` without an explicit scope
- **THEN** Buildr MUST use canonical scope `.`
- **AND** Rules projection MUST reconcile all supported `AGENTS.md` in the managed workspace subtree
- **AND** native adapters MUST perform no Rules writes

#### Scenario: 深层 Rules scope 与 Skills source 分离
- **WHEN** Agent renders a Service or deeper canonical scope through the combined `buildr render` command
- **THEN** Rules discovery MUST use the full canonical scope
- **AND** Skills resolution MUST use the workspace source authority and applicable Project capability/applicability context
- **AND** Buildr MUST NOT infer Service-level Skill source support

#### Scenario: Render conflict is validated before writes
- **WHEN** any planned rendered Rules target conflicts with a non-Buildr-managed runtime file
- **THEN** Buildr MUST fail before writing any planned Rules target
- **AND** Buildr MUST report every detected conflict in the selected scope

#### Scenario: Orphan managed bridge cleanup
- **WHEN** a selected scope contains a Buildr-managed rule bridge whose same-directory `AGENTS.md` no longer exists
- **THEN** rendered adapter reconcile MUST remove the orphan bridge
- **AND** Buildr MUST NOT remove non-Buildr-managed runtime files

### Requirement: Skills runtime 区分产品内置 Skill 与 workspace Skill
Buildr runtime projection MUST 区分产品内置 Agent Skills 与 workspace Skill source，并 MUST 将写入 user/workspace destination 的内容视为可重建 runtime 投射产物；Project MUST NOT 构成 Skill source、安装或可见性隔离层。

#### Scenario: 安装产品内置 Skill
- **WHEN** 当前 Agent runtime 支持 Skills 且 Buildr package manifest 声明了适用的产品内置 Agent Skill
- **THEN** `buildr skill install <agent>` MUST 将该 Skill 安装或修复到目标 Agent runtime
- **AND** `buildr skills render <agent>` MUST NOT 安装或修复该产品内置 Skill

#### Scenario: 保持 workspace Skill 解析
- **WHEN** workspace 根定义了 `skills/manifest.yml`
- **THEN** `buildr skills render <agent>` MUST 只从 workspace source authority 解析 enabled Skills
- **AND** Project `capabilities.yml` MUST 只提供 requirements、bindings 与 applicability context
- **AND** Buildr MUST 根据 manifest 条目的本地源、远端 resolved 状态和 install mode 选择 render 方式

#### Scenario: 渲染本地作者型 Skill
- **WHEN** Skill manifest 条目使用 `path`
- **THEN** `buildr skills render <agent>` MUST 从 workspace `skills/<skill-id>/SKILL.md` 读取源内容
- **AND** Buildr MUST 将该 Skill 投射到显式选择的 user 或 workspace destination

#### Scenario: 渲染已解析远端 Skill
- **WHEN** Skill manifest 条目包含 `resolved`
- **AND** install mode 是 `buildr`
- **THEN** `buildr skills render <agent>` MUST 从 resolved 精确安装源拉取 Skill 内容
- **AND** Buildr MUST 支持 `resolved.kind: skill-url`，其中 URL 内容是 raw `SKILL.md`
- **AND** 当 resolved kind 不受当前 CLI 支持时 Buildr MUST 报告错误
- **AND** Buildr MUST 在可用时校验 version 或 integrity
- **AND** Buildr MUST 将该 Skill 投射到显式选择的 destination

#### Scenario: 渲染未解析远端信息源
- **WHEN** Skill manifest 条目只有 `source` 或 install mode 是 `agent`
- **THEN** `buildr skills render <agent>` MUST NOT 将该 Skill 视为已安装
- **AND** Buildr MUST 生成 Buildr managed 的 Agent-readable 安装说明或安装任务
- **AND** 该说明 MUST 包含 manifest 中可用的 source/resolved 信息、Skill id、workspace source 和目标 Agent runtime
- **AND** 该说明 MUST 要求 Agent 阅读 source/resolved 信息、解析精确安装源或按来源指引安装到 Agent runtime

#### Scenario: runtime check 标识 Agent action
- **WHEN** Skill manifest 条目需要 Agent 安装或解析
- **THEN** runtime check 或 doctor MUST 报告该 Skill 需要 Agent action
- **AND** 该状态 MUST NOT 被计为 up to date
- **AND** 诊断结果 MUST 提供下一步建议

#### Scenario: 远端 resolved 缺少 integrity
- **WHEN** Skill manifest 条目包含 resolved 远端安装源
- **AND** manifest 没有声明 integrity
- **THEN** runtime check 或 doctor MUST 报告 warning
- **AND** warning MUST NOT 阻止 render，除非当前 policy 要求完整校验

#### Scenario: runtime 投射不是源资产
- **WHEN** Buildr 将产品内置 Agent Skill 或 workspace Skill 写入 user/workspace destination
- **THEN** 写入结果 MUST 被视为 runtime 投射产物
- **AND** Agent MUST NOT 将写入结果作为 Buildr 产品 Skill 或 workspace Skill 的源资产维护

### Requirement: 新增 adapters 使用各自认证的 Skills root 与 activation
Buildr MUST 将产品 Buildr Skill、workspace Skills 和 Skill install plans 投射到每个新增 runtime 为当前工作目录认证的 workspace destination Skills root，并公开其 activation 与 reload guidance。

#### Scenario: 共享 `.agents` Skills 投射
- **WHEN** Buildr 为 `cursor` 或 `trae` 安装或渲染 Skills
- **THEN** Buildr MUST 使用 `.agents/skills/<skill>/SKILL.md`
- **AND** Skill install plans MUST 位于 `.agents/buildr/skill-install-plans/`

#### Scenario: Vendor Skills 投射
- **WHEN** Buildr 为 `qoder`、`trae-work` 或 `workbuddy` 安装或渲染 Skills
- **THEN** Buildr MUST 分别使用 `.qoder`、`.trae` 或 `.codebuddy` 作为当前工作目录的 runtime root
- **AND** 每个 adapter MUST 继续保留独立 descriptor、activation、evidence 和 contract tests

#### Scenario: Skills 需要 reload 或新会话
- **WHEN** adapter 的 Skills activation 是 `explicit-reload` 或 `session-start`
- **THEN** runtime list、runtime check 和公开 adapter 文档 MUST 提供对应 reload 或新会话 guidance
- **AND** Buildr MUST NOT 将文件已写入描述为当前会话已经加载

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
- **AND** smoke MUST 只验证投射测试无法证明的 scoped Rules 或 bridge traversal 以及 workspace destination Skill discovery
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
