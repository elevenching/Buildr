# Buildr Product

Buildr 是为组织和 Agent 构建的工作资产治理系统。

它把散落在员工个人经验、文档、仓库和不同工具中的工作内容、工作能力与工作方式，统一组织成共享、可审计、可适配不同 Agent 的组织工作资产。

产品简介使用：

```text
Buildr turns how your organization works into shared work assets for AI agents, portable across Agent runtimes.
Buildr 将组织的工作方式沉淀为 Agent 可用的共享工作资产，并让这些资产适配不同 Agent runtime。
```

Agent 是这些工作资产的主要使用者。人通过 Agent 表达目标、提供业务判断并确认重要决策；Agent 从组织化资产中发现当前任务需要的信息和能力，建立任务上下文并引导工作。

## 定位

Buildr 的核心心智是：

```text
Organize work in Buildr. Work through Agents.
在 Buildr 中组织工作，通过 Agent 开展工作。
```

Buildr 保存组织长期复用的工作资产，并通过可诊断、可按 Agent 运行时适配器（Agent runtime adapter）渲染的确定性工具层，把这些资产变成 Agent 可使用的共享工作环境。这个“工作环境”是产品体验，不是新的资产类型；事实源仍是 Buildr workspace 中的标准工作资产。

## 要解决的问题

真实组织长期使用 Agent 后，问题很快从“Agent 能不能完成一次任务”变成“组织如何让 Agent 持续按照共同的工作方式完成任务”：

- 员工个人探索出的工作方法、专业能力和工具用法停留在本机、聊天记录或个人经验里，只能靠文档、会议、IM 和口口相传复制给其他人，难以持续沉淀为组织资产。
- 团队切换 Agent 工具，或成员分别使用不同 Agent 时，需要在每个客户端重复维护工作环境，组织资产容易漂移。
- 一个业务项目往往包含多个代码仓、公共服务和服务级规则，Agent 在单个仓库中工作时难以获得端到端项目视野。
- 产品、设计、开发、测试和发布内容分散在不同岗位与工具中，Agent 往往只能感知当前工作范围内的信息，难以主动发现其他岗位或服务中与任务相关的依赖。
- 手写 runtime 文件容易冲突、过期，或把临时提示误当成组织长期资产。

Buildr 把个体员工积累的经验、能力和知识转化为组织可以共同维护的工作资产，再按 supported Agent runtime 的能力投射必要入口。不同成员和 Agent 可以从同一组织基础开始工作，让个人探索成为可共享、可传承、可持续演进的组织价值。

## 工作资产、共享工作环境与任务上下文

Buildr 管理的是组织工作资产，不是 context window：

| 概念 | 含义 | 责任主体 |
|---|---|---|
| 工作资产 | 组织长期复用的工作内容、工作能力与工作方式；Rules、Skills、Commands、OpenSpec、产品事实、Projects、Services 和协作流程是当前示例 | Buildr 组织、治理和诊断 |
| 共享工作环境 | 工作资产经组织并按 runtime 投射后，Agent 可发现和使用的整体环境 | Buildr 维护源资产并 render 必要入口 |
| 任务上下文 | Agent 为当前任务发现、选择并加载到 context window 的相关内容 | Agent 根据任务语义形成 |

Buildr 不替 Agent 填充 context window，也不保证把所有信息都加载进去。它提供可发现、可选择、可使用的组织化资产，让 Agent 有基础为任务建立相关而充分的上下文。runtime adapter 只负责发现和投射标准资产，不替 Agent 判断哪些内容与当前任务相关。

组织工作资产是开放概念，不由当前资产类型穷举。未来可以探索 MCP、hooks 或其他形态，但它们只有在独立 change 明确模型、生命周期、安全边界和 runtime 行为后，才是 Buildr 已支持的受管资产；Roadmap 设想不能替代当前事实。

## 核心模型

```text
Organization/Root
  └── Project
        └── Service
```

- **组织（Organization/Root）**：Buildr 工作区根，也是个人或组织的资产根。
- **Project**：业务、产品线、系统或长期工作单元，不等同于单个代码仓。
- **Service**：Project 管理的代码仓、应用、模块或可执行资产。
- **Agent runtime**：Agent 实际运行资产的位置，是面向当前 Agent 的可重建入口。

Project 可以拥有自己的资产 repo；Service repo 由自身 Git 管理，Buildr 维护 Project registry 与 Service registry。

## 工作资产

下表只描述当前实现的主要资产形式，不定义 Buildr 未来能力的封闭边界：

| 资产 | 作用 |
|------|------|
| Rules | 通过 `AGENTS.md` 和 `rules/` 维护 Agent 行为边界 |
| OpenSpec | 管理能力规范、业务知识、变更过程和归档记录 |
| Skills | 管理可渲染到 Agent 原生技能系统的任务能力 |
| Components | 在 workspace 统一安装、更新和卸载 Rules、Skills 与 Command collections |
| Commands | 通过一个或多个 collection 声明组织期望使用的外部命令行工具能力 |
| Project registry | 记录 workspace 管理的 Project 和资产 repo 来源 |
| Service registry | 记录 Project 下 service repo 的来源和类型；规则入口由 Service 目录 `AGENTS.md` 表达 |

Buildr 源资产不保存 binary、token、cookie、登录态或个人私有配置。

Practices 不再是独立受管资产。已有 workspace 或 Project 中的 `practices/` 属于用户保留数据，Buildr 不会自动读取、迁移、覆盖或删除，也不会让该目录阻塞正常命令。整理遗留内容时，由用户或 Agent 人工审阅语义：约束和值守边界转为 Rule，可复用专业动作和操作流程转为 Skill，产品事实、需求和变更转为 OpenSpec，其他说明保留为普通 docs。

Component 是 workspace 源资产的生命周期边界，不是可执行插件。Agent 负责根据用户意图和权威来源识别资源组成，CLI 必须校验 Component definition、全部成员 integrity、唯一 ownership 和 Skill Contribution 完整性后，才能把验证通过的源输入交给 runtime 管线。Component 不能注册、替换或注入 Agent runtime adapter，也不能提供 runtime hook、可执行 member 或 registry patch。当前只支持 workspace Component；外部 CLI 仍由 Commands 声明和检查，Project 内容不归 workspace Component 所有。

## 人和 Agent 如何协作

Buildr 采用 Agent-first 的协作方式：Agent 是产品能力和组织工作资产的主要使用者，人是一等参与者，但通常不需要直接操作 Buildr 的全部内部模型。

典型方式是：

```text
用户：使用 Buildr 管理这个项目。
Agent：读取 Buildr Skill 或 bootstrap guide。
Agent：先识别当前 runtime adapter，再调用 Buildr CLI 初始化、诊断、创建 Project、接入 Service 或同步 runtime。
Buildr：写入源资产并通过 doctor 输出事实状态。
Agent：发现任务相关资产、根据诊断推进工作，并在需要业务判断时引导用户。
```

CLI 是 Agent 的确定性执行层。Agent 负责理解目标、发现相关信息、编排动作和解释结果；人负责目标、边界与关键判断。涉及 workspace 资产变更时，Agent 应调用 Buildr CLI 或做可验证文件变更，并在状态变更后运行诊断。

这种结构让不同岗位不必先把各自工作内容手工整理成一份给当前执行者的临时说明。只要相关内容已经作为 Project 或 workspace 工作资产被组织，Agent 就能在任务需要时发现它，为跨服务、跨岗位的端到端工作提供共同基础。Buildr 不使用固定岗位路由，也不承诺自动推断所有依赖；语义相关性仍由 Agent 根据任务判断。

## CLI 产品表面

Buildr 按用途和承诺区分三类产品表面：

| 分类 | 含义 | 可见性 |
|---|---|---|
| public | 普通用户或 Agent 可以正式依赖的 workspace onboarding、资产 lifecycle、诊断、修复和 runtime 操作 | 根帮助、主题帮助、主产品文档和 bootstrap canonical 示例 |
| legacy compatibility | 为旧调用或旧 workspace 保留的兼容解析、迁移、数据保留或 no-op | 仅在实际命中旧形式时输出 warning、info 或迁移提示；canonical 输出不推荐旧形式 |
| internal/maintenance | 产品构建、发布、自举、随包解析或 OpenSpec workflow 编排使用 | 在根帮助的明确分区、维护文档、workflow Skills 和产品验证中可发现 |

该分类是 help/docs 产品契约，不是权限或安全边界。maintenance/workflow 命令仍然可执行，也可以直接查看主题帮助；分类只说明普通 workspace 用户不应把它们当作日常资产 API。

当前 `package check/build` 属于产品 maintenance，`openspec baseline/check` 属于 workflow internal。`package:<source-id>` 是 package manifest 与随包 Skill resolver 的内部 source identity，不是用户资产 id 或公开 source scheme。`service create --rules` 仅保留 deprecated warning compatibility no-op；canonical Service 规则入口是 Service 目录中的 `AGENTS.md`。

## Runtime 投射

Buildr 的原则是：

```text
Install to Buildr, render to Agent runtime.
```

Buildr 资产是源头；Agent runtime 是面向当前 Agent 的可重建入口。Rules、OpenSpec、Skills、Components、Commands、registries 和普通 docs 长期保存在 Buildr workspace 或 Project 资产目录中。`.claude/`、`CLAUDE.md`、`.agents/`、`.cursor/`、`.trae/`、`.qoder/` 等 Agent runtime 文件默认可重建。Buildr 在写入前检查冲突，清理已经失去来源的受管结果；源状态不变时，重复同步不会再次改写相同文件。

不同 Agent 的处理方式不同：

- Supported adapter 由 Buildr 随产品发布的静态 registry 唯一声明；每个 adapter 必须完整实现 `rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans` 和 `runtime-check`。
- Adapter 只描述 runtime-specific 投射并生成声明式 RuntimePlan；通用 core 统一完成 source assembly、计划校验、零写入冲突预检、compare/apply、受管 orphan 清理和 findings/repairs 聚合。
- 不同 adapter 可以复用 native `AGENTS.md`、reference bridge 或 Skills layout 等内置投射原语，但必须保留独立 identity、capability evidence 和测试，不能 alias 或 fallback 到另一个 runtime。
- Rules scope 使用真实 workspace 相对路径。adapter 合并 scope 祖先链与 scope 子树中的 `AGENTS.md`，按目录层级由宽到窄投射；它不要求维护 role/path 路由表，也不替 Agent 判断规则语义相关性。
- Codex 原生读取各层 `AGENTS.md`，不生成规则桥接文件。
- Claude Code 通过 adapter 在每个已发现 `AGENTS.md` 的同目录维护 `CLAUDE.md` reference bridge，并按 Root/Project scope render `.claude/skills/`。
- 默认 `sync` 从 root `.` 递归 reconcile 整个受管理 workspace；扫描跳过符号链接、依赖/build/runtime 目录和未登记的嵌套 Git repo。
- 任务代码隔离统一使用当前 workspace 根 `.worktrees/<task-id>`；Agent 在采用 OpenSpec 或创建/复用 task worktree 前，先说明 change、路径、分支和当前动作。
- 实现型 OpenSpec change 在 propose 前完成 worktree 决策；采用 worktree 后，artifacts、实现和合并前候选验证不得双写到主工作区。
- 随包任务 Skills 对 Buildr 自举项目和用户 workspace 提供通用的三级验证协议：单任务最小反馈、任务组受影响范围验证、最终候选完整验证；具体命令由当前 workspace 或 Project 定义，不把 Buildr 产品验证入口硬编码为所有项目的固定命令。
- Buildr 产品完整验证绑定最终候选 Git tree；commit、相同 tree 集成、push 和 worktree 清理不触发主开发分支重复 E2E，tree 改变后才在集成前重验受影响部分。
- `task-finish` 是 Buildr 自有的任务收尾编排 Skill；用户在 task worktree 中明确说“收尾”时，它组合当前已安装 Component 贡献的工作流说明、外部 OpenSpec、Git Ops 和 Task Worktree 能力完成常规归档、集成、推送和本地清理。OpenSpec Component 已安装时贡献同步前后契约门禁；卸载后通用 Skill 不保留相关命令。
- “收尾”只授权可安全确定的常规动作，不授权 force push、merge commit、远端任务分支删除、丢弃改动、共享分支历史改写或语义冲突决策。
- 实际自举 workspace 的 sync 是独立状态变更，执行后按 Buildr Core 运行 doctor，不作为相同 tree 的第二轮产品验证；`buildr update` 只更新 CLI 来源。
- 其他 Agent 在存在 adapter 前，不使用 supported fallback adapter；Agent 应读取标准资产或 bootstrap guide 理解边界，并联系 Buildr 作者反馈 adapter 需求。

## MVP 边界

Buildr 当前 MVP 已验证文件系统、Git、CLI、Buildr Skill、bootstrap guide 和 Agent runtime 渲染可以支撑人和 Agent 共同维护工作资产。

当前事实以 [Buildr current state](../openspec/knowledge/buildr-current-state.md) 为准；规范性行为以 [OpenSpec specs](../openspec/specs/) 为准。

MVP 不解决完整企业云服务、权限系统、Web UI、代码托管平台集成、跨机器自动恢复、系统级 hook 或所有 Agent adapter。

OpenSpec Component 还包含 Buildr 自有的契约门禁 sidebar：它在 Requirement 粒度记录 change 基线、检测 active change 冲突和陈旧 delta，并在同步前后验证结果；OpenSpec CLI 与上游 workflow Skills 仍可独立升级。

Sidebar 是 Buildr 对外部能力的独立、可卸载增强模式；Skill Contribution 是其通用组合机制。fragment 作为 Component member 参与 integrity 和统一生命周期：Buildr 自有 Skill 可使用稳定 slot，外部 Skill 使用 prepend/append boundary composition。runtime source assembly 先验证 Component 全部成员，通过后才由纯上游正文与 sidebar fragments 生成 Agent runtime 派生 Skill，不回写 workspace Skill 源。它不是 Adapter 扩展、可执行 Hook、事件总线或任意脚本机制。

Buildr 的数据完整性保护是不可卸载的 CLI core：资产 identity、scope path、ownership、符号链接、保护根和集合根在写入前统一校验；跨文件 source mutation 使用 workspace 单写者 transaction、atomic writer、staging、backup 和失败回滚。进程异常留下的 transaction 会阻塞后续 source mutation，并由 doctor 提供恢复入口。该能力不是权限系统，也不阻止用户或外部工具直接编辑文件。

产品维护命令 `package build --out` 将输出视为带版本化 receipt 和 integrity 的生成树；只替换仍匹配上次 receipt 的输出，不删除非空无 receipt 或已被修改的目录。

当前 Components 不包含 Project/Service scope、远程 registry、依赖求解、权限系统或可执行 Hook。

## Roadmap

本节只概括后续产品方向。详细设计候选见 [Roadmap 资料](roadmap/)；这些资料不是当前产品事实、可执行资产或已经批准的实施契约。当前实现以 [Buildr current state](../openspec/knowledge/buildr-current-state.md) 为准，规范性行为以 [OpenSpec specs](../openspec/specs/) 为准；具体方向进入实现前仍需创建独立 OpenSpec change。

后续产品方向包括：

- 正式 npm registry、release tag 和更多安装渠道；开发 checkout 与本地 tarball路径已经具备 Agent onboarding smoke test。
- 更多 Agent runtime adapters；Trae 等 runtime 需要独立 change 明确 identity、兼容版本、投射 targets 和 contract tests，不能借用现有 adapter fallback。
- 更完整的 Skills registry、版本策略、强制 integrity policy 和 package 型远端解析；当前已支持 manifest、resolved `skill-url`、version/integrity metadata 和有界网络读取。
- 权限裁剪和治理门禁。
- 推进[多 Agent 任务编排与上下文管理](roadmap/agent-context-orchestration.md)：基于 Task DAG 调度可并行节点，以 Specs、Codebase Memory 和 Task State 支撑 Agent 主动加载及跨层传递上下文；重要性 t0，紧急性 t1。
- 将[角色 Agent 设计候选](roadmap/agent-roles/)拆解为按任务动态加载的 Rules、Skills 和 Packages，不把岗位身份作为 Agent 的固定运行模型。
- 评估[原型开发能力设想](roadmap/prototype-development.md)是否应沉淀为可复用 Skill 或其他受管工作流。
- 更强的 project/service 资产同步与诊断。
- 继续收敛 Rule / Skill 分层；Rule 控制 Agent 的价值观、边界和约束，Skill 封装可复用的专业动作，场景化流程优先下沉为 Skill。
- 从文件系统/Git 逐步演进到可选的结构化存储和组织服务。

这些方向进入实现前，应先通过 OpenSpec change 收敛为可实施的需求和任务。
