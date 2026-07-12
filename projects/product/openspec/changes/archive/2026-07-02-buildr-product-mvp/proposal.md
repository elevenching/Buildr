## Why

Buildr 产品化的核心入口不应是让用户记忆和手敲一组 CLI 命令，而应是让用户通过自然语言与 Agent 协作。人负责表达目标、提供判断和确认关键问题；Agent 负责读取 Buildr bootstrap guide、安装或检查 CLI、调用 Buildr 命令，并把规则、OpenSpec、practices、skills、service metadata 和 runtime 投射关系沉淀到 Buildr workspace。

当前 Buildr 已具备规则、OpenSpec、practices、skills 和 Claude Code runtime 的基础闭环；下一步 MVP 应验证“Agent-first 项目管理资产库”是否成立：用户打开一个目录，说“使用 Buildr 作为项目管理框架”，Agent 能完成安装、初始化、服务接入、状态诊断和后续引导。

## What Changes

- 将 Buildr Product MVP 的产品定位从“用户学习 CLI 命令”调整为“Agent-first onboarding”。
  - 用户通过自然语言表达目标，由 Agent 反问必要信息并执行确定性动作。
  - Buildr CLI 是 Agent 的 hard constraint 执行层，保证操作可重复、可审计、可诊断。
  - Buildr workspace 是长期项目管理资产库，可以被初始化为 Git repo 并被团队共享。
- 定义 Agent bootstrap 入口：
  - 用户自然表达“使用 Buildr 作为项目管理框架”后，Agent 应根据 bootstrap guide 判断当前目录意图、检查或安装 Buildr CLI、初始化 Buildr workspace，并运行诊断。
  - 当前目录不需要预先满足复杂结构；Agent 应与用户确认是否将当前目录作为 Buildr workspace 根目录。
  - `buildr init` 应服务于 Agent 执行，而不是要求用户直接记忆。
- 调整 Organization / Project / Service 的使用方式：
  - 继续使用统一层级 `Workspace → Organization → Project → Service`。
  - 默认 Organization 为 `default`，个人或首次使用场景无需显式创建组织。
  - 显式 Organization 支持团队、客户、公司或企业治理场景。
  - Project 表示业务、产品或系统上下文，不等同于代码仓。
  - Service 表示项目下的代码仓、应用、模块或可执行单元。
- 明确 service repo 接入语义：
  - `service link` 接收本地路径或 Git URL。
  - 当输入为本地路径时，只校验可访问性和 Git 仓库状态，并在 Buildr workspace 中维护引用关系。
  - 当输入为 Git URL 时，Agent/CLI 应默认 clone 到 Buildr workspace 中对应的项目层级，再维护引用关系。
  - 采用“方案 A”：保留 `service link` 一个命令，由命令根据 repo-ref 类型自动区分本地路径和 Git URL。
  - 默认推荐 service repo 自然嵌套在 Buildr workspace 的项目层级下；同时允许外部本地路径，以适配已有仓库布局。
- 明确 service metadata 是服务资产索引：
  - service metadata 不重复记录目录结构已经能表达的 Organization、Project、Service 和默认 repo path。
  - service metadata 记录目录无法表达或需要跨用户恢复的信息，包括 Git URL、remote、默认分支、外部本地路径、服务类型和服务级规则资产位置。
  - 当另一个用户或 Agent 打开共享的 Buildr workspace 时，Buildr 可以基于 service metadata 引导用户决定是否自动 clone 或补全单独的 service repo，而不要求用户去 Git 页面复制 URL 或手动沟通 clone 过程。
- 明确 service repo、规则资产与 runtime 的边界：
  - Buildr workspace 是 Agent-first 主入口，runtime 首先归属 Buildr workspace。
  - service repo 是普通 Git 仓库，可以自然嵌套在 Buildr workspace 中，也可以作为外部路径被引用。
  - 外层 Buildr workspace Git 应通过 `.gitignore` 忽略嵌套 service repo 的业务代码内容，避免把代码仓内容误提交到项目管理资产库。
  - 原则上，面向 Agent 的规则源都应被视为项目管理资产；service repo 的 `AGENTS.md` 等服务级规则也应由 Buildr workspace 统一管理，因为 service repo 本身也是项目资产的一部分。
  - Buildr workspace 维护服务级规则源和代码仓引用关系，并按目标 Agent render workspace 级 runtime 桥接文件。
  - 接入 service repo 不等于修改 service repo 文件；MVP 中 `service link` 不向 service repo 写入 `CLAUDE.md`、`.claude/` 或其他 Agent runtime 文件。
- 将 `doctor` 定义为 Agent-readable 的状态诊断入口：
  - `doctor` 应优先输出结构化状态给 Agent 使用，Agent 再解释给用户。
  - 人类可读输出可以保留，但主交互模型是 Agent 读取诊断结果、总结状态、提示风险并询问下一步。
  - `doctor` 应检查 workspace、Organization、Project、Service、service repo 引用、Git 嵌套忽略关系、runtime 状态和下一步建议。
- 保留 CLI 命令作为底层确定性执行协议：
  - `buildr init`
  - `buildr org create <organization>`
  - `buildr project create [<organization>/]<project>`
  - `buildr service link [<organization>/]<project>/<service> <repo-ref>`
  - `buildr doctor`
  - runtime check/render 或更高层 `buildr use` 能力
- 不在本 MVP 中解决完整企业云服务、权限系统、Web UI、代码仓托管、跨机器自动恢复、service repo 独立 runtime 注入等扩展能力，但保留后续演进空间。

## Capabilities

### New Capabilities

- `agent-first-onboarding`: 定义用户通过自然语言让 Agent 引入 Buildr、初始化 workspace、反问必要问题并调用 Buildr 命令的产品闭环。
- `buildr-workspace-management`: 定义 Buildr workspace 作为项目管理资产库的初始化、默认 Organization、Git 共享建议和基础目录骨架。
- `service-asset-indexing`: 定义 service repo 的本地路径引用、Git URL clone、service metadata、嵌套 Git 仓库和跨用户恢复语义。
- `agent-readable-doctor`: 定义 `buildr doctor` 面向 Agent 的结构化诊断能力，以及 Agent 如何向用户解释状态和下一步。
- `workspace-first-runtime-projection`: 定义 Buildr workspace runtime 的 bootstrap/render 边界，明确 service repo 不作为 MVP 的独立 Agent runtime 入口。

### Modified Capabilities

- `buildr-development-openspec`: 本 change 落实 Buildr 自身产品能力必须先通过 OpenSpec change 规划的要求，但不改变该规范本身的要求内容。

## Impact

- 影响 CLI 产品设计：`init`、`project create`、`service link`、`doctor`、runtime check/render 或 `use` 的产品语义需要围绕 Agent-first 工作流重新定义。
- 影响模板和目录结构：Buildr workspace 应生成可作为项目管理资产库维护的根规则、默认 Organization、`organizations/<org>/projects/<project>` 项目资产目录、service metadata 位置和 `.gitignore` 规则。
- 影响 service 接入模型：`service link` 需要支持本地路径和 Git URL 两种 repo-ref，并在 Git URL 场景下完成 clone + metadata 绑定。
- 影响 service metadata：metadata 应作为最小服务资产索引，记录目录无法表达的信息，并支持共享 workspace 后由 Agent 引导补全 service repo。
- 影响 runtime 模型：MVP 主路径应保证 Buildr workspace runtime 可用；service repo 是 workspace 管理的代码资产，`service link` 不应向 service repo 写入 Agent runtime 文件。
- 影响诊断输出：`doctor` 需要面向 Agent 输出结构化状态和下一步建议，而不是只输出给人阅读的文本报告。
- 影响文档：需要更新 `docs/buildr-productization-roadmap.md` 中偏 CLI-first 的表述，并与 `docs/buildr-organization-model.md` 的统一抽象保持一致。
