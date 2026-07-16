## Context

Buildr 已通过 `task-triage`、OpenSpec、task worktree 和分层验证管理任务语义与执行过程，但用户主要从连续对话中理解进度。复杂任务可能跨多个 change、代码仓、团队和阶段；单个 `proposal.md`、`tasks.md` 或归档 change 都不能稳定表达整个任务。现有 `openspec/knowledge/` 只承载当前事实，本变更需要在不削弱 specs/change 权威性的前提下，增加可持续维护的 task knowledge 子层。

驾驶舱面向普通用户而不是只面向开发者。它必须把“在做什么、整体方案、走到哪里、卡在哪里、下一步是什么”放在最前面，并将 API、状态、文件和简略代码等技术内容后置。用户通过 Agent 对话参与，Agent 负责核实来源并单向维护 HTML。

## Goals / Non-Goals

**Goals:**

- 提供可被 `task-triage` 路由的独立 `task-cockpit` Skill。
- 为复杂、长期、跨阶段或有交叉依赖的任务维护稳定、可点击、跨 change 生命周期的单文件 HTML。
- 将驾驶舱保存在 Project `openspec/knowledge/task-cockpits/`，使用 `yyyy-MM-dd-<task-id>.html` 命名。
- 形成普通用户优先、聚焦简练、逐层下钻的信息结构。
- 让 Agent 在关键回复中提供驾驶舱的可点击绝对路径和 workspace 相对路径。
- 通过随包模板和验证保持不同任务驾驶舱的基本体验一致。

**Non-Goals:**

- 不允许用户在 HTML 中直接勾选任务或修改任务状态。
- 不建立服务端、数据库、浏览器回写通道或多人实时协作。
- 不把驾驶舱定义为 OpenSpec、代码、测试或外部系统的替代事实源。
- 不要求简单、短时、无依赖的任务生成驾驶舱。
- 不新增 Buildr CLI 命令或 Agent runtime adapter 专用能力。

## Decisions

### 1. 使用独立 Skill，`task-triage` 只负责选择

新增 optional builtin Skill `task-cockpit`。`task-triage` 增加 `不需要 / 创建 / 继续维护` 判断，但不复制页面信息架构和维护手册。这样保持 task triage 的分流职责，同时让驾驶舱能力能被显式调用、独立升级或卸载。

替代方案是在 `task-triage` 中直接写完整 HTML 流程。该方案会让分流 Skill 变得冗长，并把任务判断与可视化专业动作耦合，因此不采用。

### 2. 驾驶舱属于 Project task knowledge

默认位置为 `projects/<project>/openspec/knowledge/task-cockpits/yyyy-MM-dd-<task-id>.html`。日期取首次创建驾驶舱时 Project 所在工作环境的本地日期，后续更新不改名。稳定路径允许驾驶舱关联多个 active/archive change、code-only 工作、外部依赖和未来阶段。

`task-cockpits/` 是 task-scoped working knowledge：记录当前目标、历史阶段、现行计划、依赖、风险和证据索引。它不改变 `buildr-current-state.md` 或等价文件对“已实现当前事实”的职责，也不允许用驾驶舱替代 canonical specs。

替代方案是放在 active change 目录。该方案会让路径随 archive 改变，并限制一个驾驶舱只能表达一个 change，因此不采用。

### 3. Agent 单向维护，HTML 只读

用户继续通过 Agent 对话提供目标、业务判断和确认。Agent 从 OpenSpec、代码、验证结果、外部依赖和已确认对话中核实状态后更新驾驶舱。checkbox、状态 chip 和进度条只用于展示，不提供写回。

替代方案是允许浏览器直接修改任务。该方案需要新的状态协议、并发控制、权限和回写通道，且会形成双输入，本次不采用。

### 4. 单文件模板与渐进信息层次

随 `task-cockpit` Skill 提供自包含 HTML 模板，不依赖 CDN。页面包含四个主要视图：

1. 首页：一句话目标、当前结论、阶段、已完成/正在做/下一步、阻塞和极简方案。
2. 推进：跨 change 的阶段、任务、依赖和历史。
3. 方案：业务流程、职责边界、关键选择和非目标。
4. 技术细节：API、状态、数据、文件、简略代码和验证证据。

首页必须优先使用普通语言并限制信息密度；技术表格和代码只能后置。模板只提供结构和样式，Agent仍需根据任务语义选择内容，不能机械复制 OpenSpec。

### 5. 仅在实质节点更新并回复入口

Agent 在首次创建、目标或方案变化、阶段变化、完成任务组、出现或解除阻塞、用户询问进度、暂停和完成时更新。成功更新后，回复包含带任务名称的可点击绝对路径、workspace 相对路径、当前状态和更新时间；未更新时不得声称已更新。

不要求每个命令或短暂中间消息都刷新，避免 Git diff 和对话噪声。

### 6. 作为随包 optional builtin 分发

Skill、template 和 workspace manifest entry 由 Product package source 维护，并通过现有 builtin sync/render 生命周期交付。`task-cockpit` 默认为 optional，可按现有 builtin Skill 生命周期卸载和恢复。产品验证检查 package 清单、Skill 内容、模板结构和日期命名示例。

## Risks / Trade-offs

- [风险] Agent 摘要可能与真实代码或 OpenSpec 状态漂移 → Skill 要求在实质更新前重新核实来源，并显示更新时间和证据链接。
- [风险] 页面变成长文档或技术大表格 → 模板和 Skill 强制普通用户首页、信息聚焦、技术后置和默认折叠。
- [风险] `knowledge` 同时出现当前事实和任务计划会造成语义混淆 → 仅允许在明确的 `task-cockpits/` 子目录记录 task knowledge，并在文档索引中声明非契约边界。
- [风险] 不同 Agent runtime 对本地文件链接支持不同 → 回复同时给出 Markdown 可点击绝对路径和 workspace 相对路径。
- [权衡] 单文件 HTML 更新会产生较大的文本 diff → 只在实质节点更新，并优先保持稳定结构与局部内容变化。
- [权衡] 第一版没有浏览器回写 → 保持唯一输入为 Agent 对话，换取一致性和低实现复杂度。
