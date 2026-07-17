---
name: buildr
description: 在 Buildr workspace 中安装、更新或同步 Buildr、更新或同步 workspace、诊断和维护组织工作资产时使用，覆盖 Buildr CLI 与产品入口 Skill、组织（Organization/Root）、项目（Project）、服务（Service）、组件（Components）、规则（Rules）、技能（Skills）、命令（Commands）、内置能力（Builtins）和 Agent runtime 渲染。
---

# Buildr Skill

## Buildr 是什么

Buildr 是为组织和 Agent 构建的工作资产治理系统。

它把散落在员工个人经验、文档、仓库和工具中的工作内容、工作能力与工作方式，沉淀为可共享、可审计、可适配不同 Agent 的工作区（workspace）源资产。Rules、Skills、Commands、Projects 和 Services 等是当前资产形式，不是工作资产概念的封闭边界。Agent 是这些资产的主要使用者；人通过 Agent 表达目标、提供业务判断并确认重要决策。

Buildr workspace 是组织（Organization/Root）资产根；Agent runtime 是面向当前 Agent 的可重建入口。Buildr 组织并投射 Agent 可发现、可选择、可使用的工作资产，不替 Agent 构造 context window；Agent 根据当前任务发现并选择相关内容，形成任务上下文。本机状态和临时提示不由 Buildr 维护。

Agent 使用本 Skill 判断用户意图属于哪类 Buildr 资产，并通过 Buildr CLI 完成维护、诊断和按需渲染。事实状态以 `buildr runtime list --json`、`buildr doctor --agent <agent> --target <dir> --json`、manifest、CLI 帮助和 CLI 错误输出为准。

组织资产先改变源资产（使用 Buildr CLI），再同步 Agent runtime（使用 render/sync）。

Agent 是 Buildr 功能的默认操作入口。Agent 能在当前工具、权限和安全边界内完成的动作，应先说明必要影响并取得所需授权，再直接执行和验证；不得默认把命令交给用户代为执行。用户明确选择手动方式，或 Agent 因工具不可用、权限、登录态、外部环境等原因无法完成时，再提供准确的手动操作兜底。

## 执行循环

1. 确认 `target`。未指定时默认当前目录；如果当前目录在服务（Service）代码仓内，先定位 Buildr 组织（Organization/Root）。
2. 运行或参考 `buildr runtime list --json` 获取受支持的 Agent runtime；识别当前 Agent，并将后续 `<agent>` 固定为支持列表中对应的参数。
3. 如果当前 Agent 无法和支持列表对齐，停止 Buildr 操作，并请联系 Buildr 作者反馈该 Agent。
4. 判断 workspace 是否已初始化。未初始化时运行 `buildr init --agent <agent> --target <dir> --name <name> --profile <personal|team|company>`，并使用命令内置的最终 doctor 结果；已有 workspace 运行 `buildr doctor --agent <agent> --target <dir> --json` 建立事实基线。不要省略 `--agent`。
5. 根据用户目标和 doctor 结果选择资产类型：组织（Organization/Root）、项目（Project）、服务（Service）、组件（Components）、规则（Rules）、命令（Commands）、技能（Skills）、内置能力（Builtins）或 Agent runtime 渲染。
6. 执行对应维护动作。用户要求“更新 Buildr”或“同步 Buildr”时，先运行 `buildr update`；成功后重新解析当前 `buildr` 入口，再运行 `buildr skill install <agent> --target <dir>`，不因此同步整个 workspace。用户明确要求“只更新 CLI”时只运行 `update`。用户要求“更新 workspace”或“同步 workspace”时运行 `buildr sync <agent> --target <dir>`，不先更新 CLI。update 受阻时不得继续用旧 CLI 安装 Buildr Skill。
7. 状态变更后确认最新 doctor 结果；`init --agent`、`sync` 和 Component install/uninstall 已包含最终 doctor，其他变更再运行 `buildr doctor --agent <agent> --target <dir> --json`。只有 doctor 指向专项问题，或用户明确要求细查时，才运行 `commands check` 或 `runtime check`。
8. 优先使用 Buildr CLI；复杂参数以当前 manifest、CLI 帮助和 CLI 错误输出为准。

## 任务路由

| 用户意图 | 资产类型 |
|---|---|
| 初始化、修复或诊断 Buildr workspace | 组织（Organization/Root） |
| 更新或同步 Buildr | Buildr CLI update + 产品入口 Buildr Skill install |
| 更新或同步 workspace，或恢复内置能力 | 内置能力（Builtins）/ Agent runtime 渲染 |
| 接入业务、产品线、系统或长期工作单元 | 项目（Project） |
| 接入代码仓、服务仓或可执行资产 | 服务（Service） |
| 复杂、长期、跨阶段或有交叉依赖的任务可视化与持续进度入口 | `task-cockpit` Skill |
| 代码开发、实现、构建、测试或任务 worktree 生命周期 | `task-worktree` Skill |
| 完成已验证任务、自动归档集成并清理 task worktree | `task-finish` Skill |
| 提交、拉取、合并、rebase、checkout/switch、reset、推送、发布或其他单项 Git 操作 | `git-ops` Skill |
| 统一安装、更新和卸载一组 workspace Rules、Skills、Command collections | 组件（Components） |
| 沉淀每次会话必须遵守的约束 | 规则（Rules） |
| 沉淀可复用任务流程或操作能力 | 技能（Skills） |
| 声明组织复用的外部命令行工具 | 命令（Commands） |
| 当前 Agent 找不到已声明规则或技能 | Agent runtime 渲染 |
| 为 Buildr 增加新的 Agent runtime adapter | runtime trait intake + OpenSpec change |
Agent 通过 `git-ops`、`task-worktree` 或 `task-finish` 成功改变已检出工作区内容后，由对应 Skill 在已初始化 Buildr workspace 中执行 post-transition doctor。doctor 指出 workspace sync 是合适修复动作时，询问用户是否由 Agent 立即同步，同时提供手动同步命令作为备选；用户确认后由 Agent 执行 `buildr sync <agent> --target <workspace-root>` 并验证最终 doctor。当前 session 是否重新发现新资产由 Agent runtime 决定。

## 资产维护

### Workspace / Organization Root

- Workspace 是 Buildr 组织（Organization/Root）源资产根；`--target` 始终指向 Buildr workspace root，不指向 Service 代码仓。
- workspace 必须完成 `buildr init`；首次使用且当前 Agent 已确认时，运行 `buildr init --agent <agent> --target <dir> --name <name> --profile <personal|team|company>` 一次完成源资产、runtime 和最终 doctor。不带 `--agent` 的 init 只初始化源资产。
- root `AGENTS.md` 是规则入口，必须包含 Buildr required block 并引用 `rules/buildr/core.md`；`projects/manifest.yml` 是 Project registry。

### Project

- 创建或修复 Project/Service 必须来自用户意图、已有源资产、明确 repo/ref，或 doctor 指出的可修复 drift。
- Project 表示业务、产品线、系统或长期工作单元。
- 创建 Project：`buildr project create <project> --target <dir>`。
- Project 资产 Git repo 用 `project create --repo`；Project registry 写入 `projects/manifest.yml`。

### 遗留 Practices

- Practices 不再是独立 Buildr 资产类型；已有 workspace 或 Project `practices/` 是用户保留数据，不得自动读取、迁移、覆盖或删除，也不得因其存在阻塞正常命令。
- 用户决定整理时，先人工审阅内容语义：约束和值守边界迁移为 Rule，可复用专业动作和操作流程迁移为 Skill，产品事实、需求和变更迁移为 OpenSpec，其他说明保留为普通 docs。
- 不根据文件名或正文猜测迁移类别；用户确认内容已经妥善归类且目录为空后，才由用户自行决定是否删除遗留目录。

### Service

- Service 表示代码 repo 或可执行资产；用户提供 service repo 路径、Git URL 或明确要接入服务资产时才创建。
- 接入 Service：`buildr service create <project>/<service> <repo-ref> --target <dir> [--branch <branch>]`；`--branch` 只用于 Git 来源并保存显式 checkout intent。
- Service registry 写入所属 Project 的 `services/manifest.yml`；Service 规则入口是 Service 目录中的 `AGENTS.md`，不写入 `rules.source`。
- Rules scope 使用真实 workspace 相对路径：`.`、`projects/<project>`、`projects/<project>/services/<service>` 或其任意深层目录。

### Builtins

- Buildr 内置能力包括 required core Rule、optional Skills 和内置 Command 声明。
- 只更新 Buildr CLI 自身：`buildr update`；查看 CLI 更新状态：`buildr update check --json`。命令自动识别开发 checkout 或 registry package，不读取 workspace。
- 安装或修复当前 CLI 携带的产品入口 Buildr Skill：`buildr skill install <agent> --target <dir>`；“更新 Buildr”或“同步 Buildr”默认在 update 后使用此入口，不扩大为 workspace sync。
- 同步 workspace 产品源能力并准备当前 Agent runtime：`buildr sync <agent> --target <dir>`。
- 查看 workspace 内置能力状态：`buildr builtin list --target <dir> --json` 或最终 doctor。
- 卸载 optional 内置能力：`buildr builtin uninstall <id> --target <dir>`；required 能力不能卸载。
- 恢复 optional 内置能力：`buildr builtin restore <id> --target <dir>`。

### Components
- Component 是 workspace 级统一生命周期单元；当前不支持 Project/Service Component。registry 为 `components/manifest.yml`，成员由 installed `component.yml` 唯一声明。
- Component 必须自证 definition、全部成员 integrity、唯一 ownership 和 Skill Contribution 完整性；不能注册或注入 runtime adapter、runtime hook、可执行 member 或 registry patch。验证通过的 Contribution 只作为通用 runtime source input。
- Sidebar 是对外部能力的独立、可卸载增强；Skill Contribution 是其 runtime 组合机制。外部 Skill 源必须保持上游正文，Buildr 增强只进入 Agent runtime 派生版本，不在 `skills/buildr/` 维护外部 fork。
- 用户明确说“作为 Component”时，即使只有一个成员也走 Component；用户明确要单项 Rule、Skill 或 Command 时走单项入口。
- 用户只说“安装 X”时，先读取权威来源并识别会安装的资源；跨资产类型或需要统一版本、更新、卸载时创建或选择 Component，组成不明时继续调查，不让 CLI 猜测。
- 安装前用 `buildr component list/check --target <dir> --json` 核对来源、版本、成员和 integrity；执行 `buildr component install <id> --agent <agent> --target <dir>`。
- 用户只说“卸载 X”时，先查询 registry、ownership 和 `component check`。若 X 是 Component 或其成员，不得调用单项删除命令。
- 卸载前展示 Component id、source、version、workspace scope、将删除的 Rules、Skills、Command collections 和当前 Agent runtime 投射，并说明不会删除本机外部 CLI 或任何 Project 内容；然后请求用户针对完整范围二次确认。
- 只有用户明确确认后才运行 `buildr component uninstall <id> --agent <agent> --target <dir> [--reason <text>]`；拒绝、未确认或范围变化时不得写入。
- install/uninstall 必须完成指定 Agent runtime reconcile 和最终 doctor；仍有 error 时不得报告完成。
- sync 完成后，应提醒用户 optional Rules、Skills、Components 和 Command declarations 可以按需卸载；用户不希望使用某项能力时，由 Agent 先检查完整影响范围再使用对应生命周期入口。

### Rules

- Rules 源资产是当前 scope 的 `AGENTS.md`、`rules/manifest.yml` 和 `rules/`。
- Rules 控制 Agent 的价值观、边界和约束；Skills 封装可复用的专业动作和操作流程。
- Rule 和 Skill 不以“是否必须加载”作为本质区分；Rule description 是 Agent 判断规则语义相关性的索引，不是路径或角色路由表。
- Agent runtime adapter 按“scope 祖先链 + scope 子树”发现和投射 `AGENTS.md`，不替 Agent 判断 optional Rule 与任务的语义相关性，也不使用预设 role/path 路由。
- `enabled: true`、`required: true` 且 `state: installed` 的 Rule 必须读取；`enabled: true`、`required: false` 且 installed 的 Rule 先检查 description，语义相关时在行动前读取正文。
- `enabled: false` 或 `state: uninstalled` 的 Rule 不参与当前任务。
- root/Organization 规则新增：先创建并编辑 `rules/<rule-id>.md`，再运行 `buildr rules add <rule-id> --target <dir> --description <text>`；未传 `--path` 时默认注册 `rules/<rule-id>.md`。
- root/Organization 规则删除：运行 `buildr rules remove <rule-id> --target <dir>`，同时删除 manifest entry 和规则文件；如只取消注册并保留文件，使用 `--keep-file`。
- Project/Service 规则分别通过对应目录的 `AGENTS.md` 维护，不使用 Project 或 Service 级 `rules/manifest.yml`。
- 需要渲染到 Agent runtime 时，运行 `buildr rules render <agent> --scope <workspace-relative-path> --target <dir>`；Codex 原生读取，Claude Code 使用逐 source bridge，Cursor/Qoder/TRAE 使用 scoped vendor rules，TRAE Work/WorkBuddy 使用 root reference bridge。具体路径、reload/UI 前置条件以及 `documented` / `verified` 证据等级见随包 `docs/agent-runtime-adapters.md`；GUI smoke 保持一次性人工 Prompt，不自动点击或抓取应用私有状态。

### Commands

- Commands 源资产是 root `commands/manifest.yml` 和安全递归发现的 `commands/**/manifest.yml` collections，用于声明组织需要复用的外部命令行工具。
- 新增或替换用 `buildr commands add`，删除用 `buildr commands remove`；`--collection <path>` 选择嵌套 collection，未传时操作根 collection。Component-owned collection 只能通过 Component 生命周期维护。
- doctor 已聚合 Commands 基础检查；需要命令清单细节时再运行 `buildr commands check --target <dir> --json`。
- Commands 只声明和检查，不渲染到 Agent runtime，不安装到本机。
- 已声明但本机缺少时，按 `installHint` 或官方链接说明差异；安装、升级、登录配置必须取得用户授权。

### Skills

- Skills 源资产至少包含当前 scope 的 `skills/manifest.yml`；本地作者型 Skill 还包含 `skills/<skill-id>/`。
- 本地作者型 Skill 适合项目专用流程、私有沉淀和未发布 Skill；远端发布型 Skill 适合已发布或外部维护的 Skill。
- Buildr 随包场景化流程通过 workspace Skills 承载；Rule 保留 Agent 价值观、边界和约束。
- 本地作者型：`buildr skills add [<id>] --source <skill-dir> --scope <scope> --target <dir>`；删除用 `buildr skills remove <id> --scope <scope> --target <dir>`。
- 远端发布型：先用 `buildr skills add <id> --remote-source <url> --scope <scope> --target <dir>` 登记；解析出确定安装源后用 `--resolved-source <url> --replace` 更新。
- `--resolved-kind` 默认 `skill-url`，表示 URL 内容是 raw `SKILL.md`；`--version`、`--integrity` 和 `--ignore-unsupported` 等细节按 CLI 帮助和 manifest 补齐。
- 渲染 workspace/Project 技能用 `buildr skills render <agent> --scope <scope> --target <dir>`；`buildr skill install <agent>` 只安装或修复 Buildr 产品内置 Skill。
- render 结果分三类：本地源由 Buildr 安装，已解析远端源由 Buildr 安装，未解析远端信息源由 Buildr 生成 Agent 可读安装说明并要求 Agent 处理。

### Agent 运行时渲染

- 只在当前 Agent 已确认受支持时处理 Agent runtime。
- `buildr runtime list --json` 的静态 registry 是 supported adapter 的事实源，并输出 Rules、Skills、surface、activation 和 checker trait catalog；每个 supported adapter 必须完整覆盖 Rules entry、产品 Buildr Skill、workspace/Project Skills、Skill install plans 和 runtime check，不为 unsupported runtime 使用 alias 或 fallback。
- Adapter 只生成 runtime-specific 声明式计划；Buildr 通用 core 统一负责 Component 完整性后的 source assembly、计划验证、冲突预检、写入、清理和诊断。
- 用户要求增加新 adapter 时，先从目标 Agent 收集能直接映射到 trait descriptor 的最小 intake：identity/surface、Rules kind、Skills root、activation、安装/版本 checker 和最小黑盒证据；不要调查与 adapter 无关的产品功能。
- 新 adapter 属于 Buildr 产品 change-flow：每个 runtime 使用独立 descriptor、capability evidence 和 tests；只在现有 primitive 无法表达时增加新的静态 implementation，不能 alias 或 fallback 到其他 adapter。
- 用户说“更新 Buildr”或“同步 Buildr”时，依次运行 `buildr update` 与新入口的 `buildr skill install <agent> --target <dir>`；用户说“只更新 CLI”时不追加 Skill install；用户说“更新 workspace”或“同步 workspace”时运行 `buildr sync <agent> --target <dir>`，不先更新 CLI。sync 默认从 `.` 递归 reconcile workspace Rules，并同步 Root/Project Skills。
- doctor 指出特定 scope runtime 问题时，按 canonical workspace 相对 scope 运行 `render`、`rules render` 或 `runtime check`；组合 `render` 会把 Skills scope 折叠到所属 Root/Project。
- `runtime check` 是专项 runtime 细查入口；只有 doctor 指向具体 runtime 问题，或用户明确要求细查时运行。

## 完成标准

- 用户目标已映射到对应 Buildr 资产类型。
- 状态变更后已运行 `buildr doctor --agent <agent> --target <dir> --json`，且没有需要用户立即处理的 error。
- 有复用价值的信息已按语义写回 Buildr 源资产：Rule、OpenSpec、Skill、Component、Command、Project/Service registry 或普通 docs。
- Agent runtime 已按需 sync 或 render。

如果本 Skill 不可用或 runtime 损坏，运行：

```bash
buildr bootstrap guide
```
