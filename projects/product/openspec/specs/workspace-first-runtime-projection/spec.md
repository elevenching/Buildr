# workspace-first runtime 投射规范

## Purpose

定义 Buildr 标准规则资产与 Agent runtime 投射产物的边界，以及 MVP 以 workspace runtime 为主路径的行为。
## Requirements
### Requirement: Buildr 标准规则资产独立于 Agent runtime
Buildr MVP MUST 将 `AGENTS.md` 作为 Buildr 标准规则资产，并将 Agent runtime 目录视为可重建投射产物。

#### Scenario: 管理标准规则资产
- **WHEN** Buildr 管理组织、项目或服务级规则
- **THEN** Buildr MUST 以 `AGENTS.md` 或 Buildr 资产源文件作为长期规则资产

#### Scenario: 管理 Agent runtime 目录
- **WHEN** Buildr 为 Claude Code、Codex、Trae、Cursor 或其他 Agent 渲染 runtime
- **THEN** Buildr MUST 将 `.claude/`、`.codex/`、`.trae/`、`.cursor/` 等目录视为投射产物，而不是组织或项目资产源

### Requirement: workspace runtime 是 MVP 主路径
Buildr MVP MUST 优先保证 Buildr workspace 入口处的 Agent runtime 可用。

#### Scenario: 初始化 workspace runtime
- **WHEN** Agent 完成 Buildr workspace 初始化
- **THEN** Buildr MUST 能为当前 Agent 渲染或检查 workspace 级 runtime 桥接文件

#### Scenario: 多 Agent 使用同一 workspace
- **WHEN** 不同用户分别使用 Claude Code、Codex 或 Trae 打开同一个 Buildr workspace
- **THEN** 每个 Agent MUST 能基于 Buildr 标准资产生成自己的 runtime 投射，而不要求这些 runtime 目录成为共享资产源

### Requirement: service repo 不作为 MVP 独立 Agent runtime 入口
Buildr MVP MUST 将 Buildr workspace 作为 Agent 工作入口，不得将 service repo runtime 作为 service 接入的默认或必需能力。

#### Scenario: 只接入 service repo
- **WHEN** Agent 通过 `service create` 接入 project service repo
- **THEN** Buildr MUST NOT 向该 service repo 写入 `CLAUDE.md`、`.claude/` 或其他 Agent runtime 文件

#### Scenario: 用户只打开 service repo
- **WHEN** 用户只在 service repo 目录中打开 Agent
- **THEN** Buildr MVP MUST NOT 将该目录视为完整 Buildr workspace 入口

#### Scenario: 用户权限被裁剪
- **WHEN** 用户只拥有某个项目或服务的权限
- **THEN** Buildr MUST 通过裁剪后的 Buildr workspace 资产提供上下文，而不是要求用户脱离 workspace 在 service repo 中工作

### Requirement: Buildr 作为 Agent 时代的项目契约
Buildr MVP MUST 将 Buildr 使用方式定义为跨 Agent 的项目协作契约。

#### Scenario: Agent 原生支持 Buildr
- **WHEN** 用户使用的 Agent 产品原生支持 Buildr
- **THEN** Agent MUST 能直接按 Buildr workspace 资产和规则工作

#### Scenario: Agent 未原生支持 Buildr
- **WHEN** 用户使用的 Agent 产品未原生支持 Buildr
- **THEN** 用户 MUST 能通过自然语言触发 Buildr bootstrap guide，让 Agent 学会使用 Buildr CLI 和 workspace 资产

### Requirement: Runtime 投射按 Agent 能力选择
Buildr MUST 将支持的 Agent runtime 视为从 Buildr 源资产、canonical scope discovery plan 和已启用内置能力生成的 adapter 投射。

#### Scenario: Codex runtime 投射
- **WHEN** Buildr 渲染 Codex adapter
- **THEN** Buildr MUST 保持 discovered `AGENTS.md` files 作为 Codex 原生规则入口
- **AND** Buildr MUST NOT 为 Rules 写入 Codex bridge 文件
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到当前 Codex 打开项目根目录的 `.agents/skills/`
- **AND** Buildr MUST 将 `.agents/skills/` 视为 runtime 投射产物，而不是长期 Buildr 源资产

#### Scenario: Claude Code runtime 投射
- **WHEN** Buildr 渲染 Claude Code adapter
- **THEN** Buildr MUST 为 discovery plan 中每个 `AGENTS.md` 写入或更新同目录 `CLAUDE.md` 引用桥
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到 `.claude/skills/`
- **AND** Buildr MUST 将 `CLAUDE.md` 和 `.claude/skills/` 视为 runtime 投射产物，而不是长期 Buildr 源资产

#### Scenario: 支持的 adapters
- **WHEN** Buildr syncs or renders Agent runtime
- **THEN** Buildr MUST 支持 `codex` 和 `claude-code`
- **AND** Buildr MUST 清楚报告不支持的 adapter，且不得修改 runtime 文件

#### Scenario: Runtime 准备顺序
- **WHEN** Buildr 渲染 Agent runtime
- **THEN** Buildr MUST 按 `rules/manifest.yml` 暴露和检查 enabled rules
- **AND** Buildr MUST 按 `skills/manifest.yml` 投射 enabled skills
- **AND** Buildr 内置项 MUST 在 manifest 中排在用户项之前
- **AND** rule discovery plan MUST order ancestor sources before descendant sources
- **AND** 在处理 Project scope 时，Buildr MUST 在 workspace 资产之后处理 Project 用户资产
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

#### Scenario: 深层 Rules scope 与 Skills scope 分离
- **WHEN** Agent renders a Service or deeper canonical scope through the combined `buildr render` command
- **THEN** Rules discovery MUST use the full canonical scope
- **AND** Skills resolution MUST use the owning workspace or Project scope
- **AND** Buildr MUST NOT infer Service-level Skills support

#### Scenario: Render conflict is validated before writes
- **WHEN** any planned rendered Rules target conflicts with a non-Buildr-managed runtime file
- **THEN** Buildr MUST fail before writing any planned Rules target
- **AND** Buildr MUST report every detected conflict in the selected scope

#### Scenario: Orphan managed bridge cleanup
- **WHEN** a selected scope contains a Buildr-managed rule bridge whose same-directory `AGENTS.md` no longer exists
- **THEN** rendered adapter reconcile MUST remove the orphan bridge
- **AND** Buildr MUST NOT remove non-Buildr-managed runtime files

### Requirement: Skills runtime 区分产品内置 Skill 与 workspace Skill
Buildr runtime projection MUST 区分产品内置 Agent Skills、workspace/root Skills 和 project Skills，并将它们都视为可重建 runtime 投射产物。

#### Scenario: 安装产品内置 Skill
- **WHEN** 当前 Agent runtime 支持 Skills 且 Buildr package manifest 声明了适用的产品内置 Agent Skill
- **THEN** `buildr skill install <agent>` MUST 将该 Skill 安装或修复到目标 Agent runtime
- **AND** `buildr skills render <agent>` MUST NOT 安装或修复该产品内置 Skill

#### Scenario: 保持 workspace Skill 解析
- **WHEN** workspace 或 project 定义了 Skills manifest
- **THEN** `buildr skills render <agent>` MUST 继续按现有 scope 规则解析并渲染 workspace/root/project Skills
- **AND** Buildr MUST 根据 manifest 条目的本地源、远端 resolved 状态和 install mode 选择 render 方式

#### Scenario: 渲染本地作者型 Skill
- **WHEN** Skill manifest 条目使用 `path`
- **THEN** `buildr skills render <agent>` MUST 从本地 `skills/<skill-id>/SKILL.md` 读取源内容
- **AND** Buildr MUST 将该 Skill 安装或更新到目标 Agent runtime

#### Scenario: 渲染已解析远端 Skill
- **WHEN** Skill manifest 条目包含 `resolved`
- **AND** install mode 是 `buildr`
- **THEN** `buildr skills render <agent>` MUST 从 resolved 精确安装源拉取 Skill 内容
- **AND** Buildr MUST 支持 `resolved.kind: skill-url`，其中 URL 内容是 raw `SKILL.md`
- **AND** 当 resolved kind 不受当前 CLI 支持时 Buildr MUST 报告错误
- **AND** Buildr MUST 在可用时校验 version 或 integrity
- **AND** Buildr MUST 将该 Skill 安装或更新到目标 Agent runtime

#### Scenario: 渲染未解析远端信息源
- **WHEN** Skill manifest 条目只有 `source` 或 install mode 是 `agent`
- **THEN** `buildr skills render <agent>` MUST NOT 将该 Skill 视为已安装
- **AND** Buildr MUST 生成 Buildr managed 的 Agent-readable 安装说明或安装任务
- **AND** 该说明 MUST 包含 manifest 中可用的 source/resolved 信息、Skill id、scope 和目标 Agent runtime
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
- **WHEN** Buildr 将产品内置 Agent Skill 或 workspace/project Skill 写入目标 Agent runtime 目录
- **THEN** 写入结果 MUST 被视为 runtime 投射产物
- **AND** Agent MUST NOT 将写入结果作为 Buildr 产品 Skill 或用户 workspace Skill 的源资产维护

### Requirement: AGENTS.md 是 scope 规则入口
Buildr MUST 将 `AGENTS.md` 定义为 Buildr scope 规则入口，同时允许支持它的 Agent 原生消费。

#### Scenario: 根 AGENTS required block
- **WHEN** Buildr 初始化或更新 workspace root
- **THEN** 根 `AGENTS.md` MUST 包含 Buildr required block
- **AND** required block MUST 引用 `rules/buildr/core.md`

#### Scenario: Adapter 格式转换
- **WHEN** 某个 Agent 需要特殊 include 格式
- **THEN** 对应 adapter MUST 在 runtime render 阶段转换
- **AND** Buildr 源资产 MUST NOT 把 Claude Code 的 `@` 当作通用语义

### Requirement: Agent runtime adapter discovery
Buildr MUST 提供 Agent-readable 的方式，用于发现已支持的 Agent runtime adapter、每个 adapter 实现的 render 能力以及 Rules source discovery semantics。

#### Scenario: Agent lists supported runtime adapters
- **WHEN** Agent 运行 `buildr runtime list --json`
- **THEN** Buildr MUST 输出包含已支持 Agent runtime id 的 JSON
- **AND** 当 `claude-code` 和 `codex` adapter 已实现时，输出 MUST 包含 `claude-code` 和 `codex`
- **AND** 输出 MUST 包含 `requiredRenderCapabilities`
- **AND** 输出 MUST 描述每个已支持 adapter 的 render 能力、实现模式和 runtime-specific 推荐命令

#### Scenario: Rules entry discovery metadata
- **WHEN** `runtime list --json` 描述 supported adapter 的 `rules-entry`
- **THEN** metadata MUST identify canonical scope syntax as workspace-relative paths
- **AND** metadata MUST describe recursive `**/AGENTS.md` source discovery and ancestor inclusion
- **AND** metadata MUST identify whether projection is native or rendered
- **AND** metadata MUST identify whether the capability writes files
- **AND** rendered projection MUST describe its target pattern

#### Scenario: Runtime list includes recommended command templates
- **WHEN** Buildr 输出 supported Agent runtime adapter 信息
- **THEN** 每个 supported adapter MAY 包含 `recommendedCommands`
- **AND** `recommendedCommands` MUST be treated as Agent execution guidance rather than a complete CLI schema
- **AND** `recommendedCommands` MUST NOT replace command help as the complete CLI reference
- **AND** recommended scope examples MUST use canonical workspace-relative paths

#### Scenario: Runtime list is available outside workspace
- **WHEN** Agent 在非 Buildr workspace 目录运行 `buildr runtime list --json`
- **THEN** Buildr MUST 返回当前 CLI 支持的 runtime adapter 矩阵
- **AND** Buildr MUST NOT 要求目标目录已经初始化为 Buildr workspace

#### Scenario: Human lists supported runtime adapters
- **WHEN** 用户运行 `buildr runtime list`
- **THEN** Buildr MUST 输出人类可读的 supported Agent runtime adapter 摘要
- **AND** 摘要 MUST 说明每个 supported runtime 可使用的 render、sync、Skill install 和 runtime check 命令族

### Requirement: Adapter render capability checklist
Buildr MUST 定义一个 supported Agent adapter 需要实现的 render 能力清单。

#### Scenario: Required render capabilities
- **WHEN** Buildr 报告 supported Agent runtime adapters
- **THEN** Buildr MUST 将 `rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans` 和 `runtime-check` 列为 required render capabilities
- **AND** 每个 supported adapter MUST 报告自己是否支持每个 required render capability

#### Scenario: Render capability implementation modes
- **WHEN** Buildr 描述某个 adapter render capability
- **THEN** Buildr MUST 允许该能力通过 native behavior、file render、Skill install、install-plan render 或 diagnostic check 实现
- **AND** Buildr MUST NOT 要求每个 render capability 都写文件

#### Scenario: Codex native rules entry
- **WHEN** Buildr 描述 Codex 的 `rules-entry` capability
- **THEN** Buildr MUST 描述该能力由 Codex 原生消费 `AGENTS.md` 实现
- **AND** Buildr MUST 表明 rules render 不会写入 Codex bridge 文件

### Requirement: Unsupported Agent runtime guidance
Buildr MUST 清楚地区分 unsupported Agent runtime 和 supported runtime 中缺失 render 结果的情况。

#### Scenario: Unsupported Agent runtime is discovered
- **WHEN** Agent 判断自己的 runtime id 不在 `buildr runtime list --json` 输出中
- **THEN** Agent MUST NOT 使用该 unsupported runtime id 运行 `render`、`sync`、`skill install` 或 `runtime check`
- **AND** Agent MUST NOT 使用 supported fallback adapter 代替
- **AND** Agent MUST 警示用户 Buildr 暂不支持当前 Agent runtime 的自动渲染
- **AND** Agent MUST 告诉用户联系 Buildr 作者反馈该 Agent

#### Scenario: Unsupported Agent guidance in runtime list
- **WHEN** Buildr 输出 `buildr runtime list --json`
- **THEN** 输出 MUST 包含 unsupported-Agent guidance
- **AND** 该 guidance MUST 包含 `mustNotUseFallbackAdapter: true`
- **AND** 该 guidance MUST 告诉用户联系 Buildr 作者反馈该 Agent

### Requirement: Runtime render asset scope
Buildr runtime render MUST 限定为由 Buildr 源资产派生出的 Agent runtime 入口资产。

#### Scenario: Supported runtime render
- **WHEN** Buildr render 或 sync 某个 supported Agent runtime
- **THEN** Buildr MUST 只 render 该 Agent runtime 使用 Buildr workspace rules 和 Skills 所必需的资产
- **AND** Buildr MUST 将 Commands、Project registry、Service registry、OpenSpec content、knowledge 和 docs 保持为 Buildr 源资产，而不是默认复制到 runtime 目录
- **AND** Buildr MUST NOT 将 Practices 表示为受管 source asset 或 runtime asset

#### Scenario: Product Buildr Skill boundary
- **WHEN** Buildr 为 supported Agent runtime 安装产品入口 Buildr Skill
- **THEN** Buildr MUST 使用 `buildr skill install <agent>`
- **AND** Buildr MUST NOT 将产品入口 Buildr Skill 登记到 workspace 或 Project `skills/manifest.yml`

### Requirement: Runtime 投射不得替代 Agent 构建任务上下文
Buildr runtime render MUST 只投射 supported Agent 使用组织工作资产所需的规则入口、Skills 和安装计划等 runtime 资产，并 MUST 保留由 Agent 根据当前任务判断相关性和形成任务上下文的责任边界。

#### Scenario: Agent 从投射后的工作环境开始任务
- **WHEN** Agent 在完成 Buildr runtime render 的 workspace 中处理一项任务
- **THEN** Buildr MUST 提供已受管工作资产的 Agent 可读入口
- **AND** Agent MUST 根据用户目标、修改范围、项目结构、资产语义和已有 workspace 信息选择任务相关内容
- **AND** Buildr MUST NOT 将 render 结果描述为已经构造完成的 context window

#### Scenario: 任务依赖其他岗位或服务信息
- **WHEN** 当前任务可能依赖其他岗位沉淀的规范、产品事实、专业流程或其他 Service 的信息
- **THEN** Agent MUST 能从 Buildr 组织的 workspace 与 Project 资产中发现和选择相关内容
- **AND** Buildr runtime adapter MUST NOT 使用固定岗位路由替 Agent 判断这些内容的语义相关性

### Requirement: Registry terminology
Buildr MUST 对列出受管资产的索引 manifest 统一使用 registry 术语。

#### Scenario: Project and Service registries
- **WHEN** Buildr 描述 root `projects/manifest.yml` 和 Project `services/manifest.yml`
- **THEN** Buildr MUST 分别称它们为 Project registry 和 Service registry
- **AND** Buildr MUST 将 metadata 保留给 registry entry 内部字段，例如 title、description、repo 和 path

### Requirement: Buildr 状态变更后必须 doctor 验证
Buildr required Core MUST 将 doctor 定义为已初始化 workspace 在 Buildr 状态变更后的统一完成条件。

#### Scenario: Workspace 源资产或 runtime 状态变更
- **WHEN** Agent 修改已初始化 workspace 的 Buildr 源资产、内置能力状态或 Agent runtime 投射
- **THEN** Agent MUST 在任务完成前运行当前 Agent 对应的 doctor
- **AND** Agent MUST NOT 在 doctor 仍报告需要立即处理的 error 时把该 Buildr 操作视为完成

#### Scenario: Buildr CLI 安装或刷新
- **WHEN** Agent 为一个已初始化 workspace 安装或刷新 Buildr CLI 开发入口
- **THEN** Agent MUST 在确认 CLI 可执行后运行当前 Agent 对应的 doctor

#### Scenario: Core 与 Skill 的职责
- **WHEN** Buildr 发布 doctor 完成约束
- **THEN** required Core MUST 只声明状态变更后必须验证的 invariant
- **AND** Buildr Skill 或 bootstrap MUST 提供具体 doctor 命令、执行时机和后续处理流程

### Requirement: 运行时同步必须得到稳定结果
Buildr MUST 根据相同的源资产、目标目录、Agent 和 scope 得到相同的运行时结果。

#### Scenario: 重复执行同步
- **WHEN** 用户在源资产没有变化时连续执行两次相同的 render 或 sync
- **THEN** 第二次执行 MUST 不再新增、更新或删除任何运行时文件

#### Scenario: 相关命令使用相同逻辑
- **WHEN** `render`、`skills render`、`sync` 或 Component 生命周期需要更新运行时
- **THEN** Buildr MUST 使用相同的目标检查、写入、清理和结果确认逻辑

### Requirement: 运行时冲突必须在写入前发现
Buildr MUST 在写入第一个运行时文件前检查当前命令范围内的所有目标冲突。

#### Scenario: 用户文件占用目标路径
- **WHEN** 任一目标路径存在非 Buildr 管理的文件
- **THEN** Buildr MUST 在零写入状态失败
- **AND** Buildr MUST 保留该用户文件并报告全部已发现冲突

#### Scenario: 不同内容使用相同目标路径
- **WHEN** 当前命令范围内的两个源要把不同内容写入同一个运行时路径
- **THEN** Buildr MUST 在零写入状态失败并报告两个来源

### Requirement: 运行时同步必须清理失去来源的受管文件
Buildr MUST 删除当前命令范围内已经没有来源的 Buildr 受管运行时文件和安装计划，并保留非 Buildr 管理的内容。

#### Scenario: Skill 被删除
- **WHEN** Skill 已从当前 scope 的源资产中删除并再次执行 `skills render` 或 `render`
- **THEN** Buildr MUST 删除对应的受管运行时 Skill

#### Scenario: 远程 Skill 被删除
- **WHEN** 需要 Agent 安装的远程 Skill 已从源资产中删除并再次渲染
- **THEN** Buildr MUST 删除对应的受管安装计划

#### Scenario: 受管目录包含额外用户文件
- **WHEN** 待清理的受管目录包含不能证明由 Buildr 管理的额外文件
- **THEN** Buildr MUST 保留该目录并报告需要用户处理

### Requirement: Project render 必须遵守明确范围
Buildr MUST 根据命令 scope 决定参与 Skill 渲染和冲突检查的 Project。

#### Scenario: 渲染单个 Project
- **WHEN** 用户明确 render 某个 Project scope
- **THEN** Buildr MUST 只处理 workspace 和当前 Project 可见的 Skills
- **AND** Buildr MUST NOT 因其他 Project 的 Skill 声明而报错

#### Scenario: workspace 全量渲染相同 Skill
- **WHEN** workspace 全量 render 发现多个 Project 引入来源、版本和内容相同的 Skill
- **THEN** Buildr MUST 将其视为同一个运行时 Skill，且只写入一份

#### Scenario: workspace 全量渲染不同 Skill
- **WHEN** workspace 全量 render 发现多个 Project 要把不同内容写入同一个 Skill 运行时路径
- **THEN** Buildr MUST 在写入前报错并列出相关 Project

### Requirement: 运行时同步必须确认结果
Buildr MUST 在写入结束后确认本次命令负责的运行时状态已经与源资产一致。

#### Scenario: 同步后仍有差异
- **WHEN** 写入结束后仍存在本次命令负责的缺失、过期、孤儿或冲突状态
- **THEN** 命令 MUST 返回失败并给出可重新执行的修复动作

### Requirement: Buildr Core 要求简明表达
Buildr required Core MUST 要求 Agent 面向用户时优先使用常用、直接和简练的语言，避免使用不必要的专业术语。

#### Scenario: Agent 说明方案或结果
- **WHEN** Agent 向用户说明问题、方案、进度或结果
- **THEN** Agent MUST 优先使用用户容易理解的简练语言
- **AND** 只有准确表达所必需时才使用专业术语，并在需要时解释

### Requirement: Buildr Core 要求 Agent 引导下一步
Buildr required Core MUST 要求 Agent 在完成当前工作、到达阶段节点或遇到阻塞时，向用户说明明确、可执行的下一步。

#### Scenario: 当前事项存在下一步
- **WHEN** Agent 完成当前工作、到达阶段节点或遇到阻塞，且当前事项仍有后续动作
- **THEN** Agent MUST 结合当前状态以及适用的 Rule、Skill 和项目约定说明下一步

#### Scenario: 当前任务已经完整结束
- **WHEN** 当前任务已经完整结束且没有相关的后续动作
- **THEN** Agent MUST 明确说明任务已完成
- **AND** Agent MUST NOT 机械追加无关建议

### Requirement: Supported runtime adapter 使用静态完整契约
Buildr MUST 使用随产品发布的静态 registry 作为 supported Agent runtime adapter 的唯一事实源，并要求每个 registered adapter 完整声明和实现 runtime contract。

#### Scenario: 注册完整 adapter
- **WHEN** package verification 校验一个 supported adapter
- **THEN** adapter descriptor MUST 包含稳定且唯一的 runtime id、全部 required render capabilities、runtime targets、实现入口和 Agent-readable metadata
- **AND** `runtime list`、CLI 参数校验、render、sync、Skill install、runtime check 和 doctor MUST 从同一 registry 解析该 adapter

#### Scenario: Adapter contract 不完整
- **WHEN** registered adapter 缺少任一 required capability、实现入口或必要 capability evidence
- **THEN** package verification MUST fail
- **AND** Buildr MUST NOT 将该 adapter 报告为 supported

#### Scenario: 未注册 runtime
- **WHEN** Agent 请求一个不在静态 registry 中的 runtime id
- **THEN** Buildr MUST 将其作为 unsupported adapter 处理
- **AND** Buildr MUST NOT alias、猜测或 fallback 到其他 supported adapter

### Requirement: Adapter 只生成声明式运行时计划
每个 supported adapter MUST 从不可变 runtime context 生成无副作用的声明式计划，并由通用 Buildr core 执行全部文件系统副作用。

#### Scenario: 生成 runtime plan
- **WHEN** Buildr 为 supported adapter planning runtime
- **THEN** adapter MUST 返回预期 writes、native assets、managed removals、capability evidence 和适用 findings 或 repair hints
- **AND** adapter MUST NOT 直接写入或删除文件、修改 Buildr 源资产、运行 doctor 或执行 workspace 提供的代码

#### Scenario: 非法 runtime plan
- **WHEN** runtime plan 包含 target 越界、不安全路径、不同内容的重复 target、非法 removal 或与 descriptor 不一致的 capability evidence
- **THEN** 通用 plan validator MUST 在写入第一个文件前拒绝整个计划
- **AND** Buildr MUST 报告可归因于 adapter 和 target 的错误

#### Scenario: Native capability 不写文件
- **WHEN** adapter 以 native behavior 实现 `rules-entry`
- **THEN** runtime plan MUST 能将适用 `AGENTS.md` 表达为 native assets 和 capability evidence
- **AND** 通用 executor MUST NOT 因该 capability 自身写入 Rule bridge

### Requirement: Runtime 命令共享计划与 reconcile 管线
Buildr MUST 让 runtime render、sync、runtime check、doctor、产品 Buildr Skill 安装和 Component lifecycle 使用同一 source assembly、plan validation、preflight、apply、cleanup 和结果确认逻辑。

#### Scenario: Render 和 check 比较相同期望状态
- **WHEN** Buildr 对相同源资产、target、adapter 和 scope 分别运行 render 与 runtime check
- **THEN** 两者 MUST 从同一个 adapter plan 得到相同的预期 targets、content identity 和 managed removals
- **AND** runtime check MUST 使用 compare-only 模式而不写入文件

#### Scenario: Doctor 使用 adapter contract
- **WHEN** Agent 运行 `doctor --agent <agent>` 且 `<agent>` 是 supported adapter
- **THEN** doctor MUST 通过 registry 选择 adapter 并聚合通用 reconcile findings
- **AND** findings、repairs 和 capability 状态 MUST 归因到 `<agent>`
- **AND** doctor MUST NOT 通过独立 Agent allowlist 或分支重新定义该 adapter 的期望 runtime

#### Scenario: Component 生命周期 reconcile runtime
- **WHEN** Component source transaction 成功后需要 reconcile supported runtime
- **THEN** Component lifecycle MUST 调用与 `render` 相同的通用 runtime 管线
- **AND** Component lifecycle MUST NOT 调用 Component 提供的 adapter 或 runtime hook

### Requirement: Adapter 可以组合受约束的内置投射原语
Buildr MUST 允许不同静态 adapter 组合相同的内置投射原语，同时保持每个 runtime 的独立 identity、contract 和诊断归因。

#### Scenario: 两个 runtime 复用相同布局
- **WHEN** 两个 registered adapters 都使用 native `AGENTS.md` 或相同 Skills target layout
- **THEN** 它们 MAY 复用同一个内置投射原语
- **AND** 每个 adapter MUST 继续拥有独立 descriptor、capability evidence 和 contract tests
- **AND** Buildr MUST NOT 将其中一个 runtime id 解析为另一个 runtime id

#### Scenario: 验证 adapter 扩展点
- **WHEN** package tests 使用 fake adapter 验证新增 adapter 的集成路径
- **THEN** fake adapter MUST 只能通过测试注入点使用
- **AND** 发布的 `runtime list`、CLI help 和 package registry MUST NOT 将 fake adapter 报告为 supported

### Requirement: 现有 supported runtime 迁移保持兼容
Buildr MUST 在采用统一 adapter contract 后保持 `codex` 和 `claude-code` 的公开命令、runtime targets、managed ownership、冲突和清理语义兼容。

#### Scenario: Codex parity
- **WHEN** Buildr 使用迁移后的 `codex` adapter render 或 check 相同 workspace 状态
- **THEN** Buildr MUST 保持 native `AGENTS.md`、`.agents/skills/`、Skill install plans、managed marker 和 doctor 结果的既有语义

#### Scenario: Claude Code parity
- **WHEN** Buildr 使用迁移后的 `claude-code` adapter render 或 check 相同 workspace 状态
- **THEN** Buildr MUST 保持同目录 `CLAUDE.md` reference bridges、`.claude/skills/`、Skill install plans、managed marker 和 doctor 结果的既有语义

#### Scenario: 重复同步保持幂等
- **WHEN** 任一迁移后的 supported adapter 在源资产与目标状态不变时连续同步两次
- **THEN** 第二次同步 MUST 不新增、更新或删除 runtime 文件

### Requirement: 远端 Skill 解析必须有界完成
Buildr MUST 对远端 resolved Skill 的网络读取设置有限的连接、响应和总执行时间，使 runtime render、sync 和 doctor 能够成功完成或返回明确失败，而不是无限等待。

#### Scenario: 远端 Skill 来源不可达
- **WHEN** workspace Skill 的 resolved URL 无法连接、停止响应或超过配置的总时限
- **THEN** Buildr MUST 在有限时间内终止该次拉取
- **AND** Buildr MUST 返回包含 Skill 或 URL 上下文的错误
- **AND** Buildr MUST NOT 写入部分 runtime Skill 内容

#### Scenario: 维护者调整远端请求时限
- **WHEN** 维护者通过受支持的环境变量调整远端 Skill 请求时限
- **THEN** Buildr MUST 校验该值是有限正整数并限制到产品允许的最大范围
- **AND** 无效配置 MUST 明确失败而不是退回无限等待
