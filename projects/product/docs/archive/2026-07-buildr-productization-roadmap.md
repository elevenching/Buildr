> Archived historical note. Not a current Buildr product source of truth.

# Buildr 产品化路线思考

本文记录 Buildr 从“文件系统框架”走向“可被用户从零使用的产品”的方向。它不是已承诺的完整实现计划，而是产品设计和取舍的讨论基础；已经实现并验证的当前事实应同步到 `openspec/knowledge/`。

Buildr 面向人和 Agent 管理长期工作资产。用户负责表达目标和判断边界，Agent 负责消费资产并执行可验证操作，Buildr 负责让规则、规范、技能、实践、项目和服务资产可维护、可诊断、可投射。

## 当前背景

Buildr 产品 MVP 已完成以文件系统、Git、CLI、Buildr Skill、bootstrap guide 和 Claude Code adapter 为主的基础闭环：

- 用 `AGENTS.md`、`openspec/`、`practices/`、`skills/` 组织项目上下文。
- 用 `buildr init --name <name>` 初始化 root-as-Organization 的 Buildr 实例。
- 用 `buildr project create` 创建项目资产骨架，并维护 root `projects.yml`。
- 用 `buildr service create` 接入本地路径或 Git URL service repo，并维护项目级 `services.yml`。
- 用 `buildr doctor --json` 输出 Agent-readable 诊断结果，检查 workspace、project service metadata、Git 忽略关系和 runtime 状态。
- 用 `commands add/remove/check` 维护并检查 workspace 命令行工具清单。
- 用 `skills add/remove/render` 维护 workspace/project Skills 源资产，并按需投射到 Agent runtime。
- 用 `skill install`、`runtime check`、`rules render`、`skills render` 检查和生成当前 Agent runtime。
- 用 `package check` 和 `package build` 校验和构建 Buildr 产品随包资产。
- 明确 Buildr 资产源与 Agent runtime 投射产物的边界。

这些能力证明了“面向人和 Agent 的工作资产管理”的方向：用户不需要先学习命令菜单，而是表达目标并判断边界；Agent 使用 Buildr Skill 和 Buildr CLI 完成可验证操作；长期上下文沉淀回 Buildr workspace。bootstrap guide 是 Skill 不可用时的兜底入口。

## 产品化目标

Buildr 产品 MVP 已完成的目标是：

> 用户打开一个目录，说“使用 Buildr 管理这个项目”，Agent 能完成 Buildr 安装/检查、root 初始化、项目资产创建、service repo 接入、状态诊断和后续引导。

面向的使用者包括：

- 个人开发者：希望让 Agent 理解自己的多个项目。
- 小团队：希望沉淀团队规则、项目上下文和服务入口。
- 咨询/自由职业者：需要管理多个客户或多个项目上下文。
- 企业团队：希望把工作资产和具体 Agent 产品解耦。

## 用户与 Agent 协作旅程

### 1. 自然语言触发 Buildr onboarding

用户在希望作为项目管理资产库的目录中告诉 Agent：

```text
使用 Buildr 管理这个项目。
```

Agent 应先使用 Buildr Skill；如果 Skill 不可用，则读取 Buildr 随产品交付的 `package/bootstrap/guide.md` 兜底。确认当前目录是否作为 Buildr root 后执行：

```bash
buildr init --name acme --profile company
```

`buildr init` 将当前目录初始化为 Buildr root；这个 root 本身就是 Organization 上下文实例，项目默认位于 `projects/`。共享、基础或平台服务也通过某个 Project 表达。

### 2. 创建项目资产

```bash
buildr project create shop
```

`project create` 会维护 root `projects.yml`，创建项目级规则、OpenSpec、practices、skills、`services.yml` 和默认 `services/` 目录。传入 `--repo <git-url>` 时，Project 资产 repo 会 clone 到 `projects/<project>/`。OpenSpec 是 Buildr 默认内嵌的 SDD 规范驱动开发框架：

- `openspec/specs/`：能力规范和业务 SHALL。
- `openspec/knowledge/`：已验证的当前架构和业务事实。
- `openspec/changes/`：变更过程、设计和任务。

### 3. 接入 service repo

```bash
buildr service create shop/api https://example.com/acme/shop-api.git --type backend
buildr service create shop/web ../shop-web --type frontend
```

MVP 使用一个 `service create` 命令处理本地路径和 Git URL：

- 本地路径：校验路径可访问性和 Git 仓库状态，只维护引用关系。
- Git URL：默认 clone 到 `projects/<project>/services/<service>/`，未指定分支时使用远端 HEAD。
- 项目级 `services.yml` 记录目录结构无法表达的信息，包括 Git URL、remote、默认分支、外部路径、服务类型和规则资产入口。

### 4. 诊断 workspace 状态

```bash
buildr doctor --json
```

`doctor` 是 Agent-readable 的统一诊断入口。Agent 读取 JSON 后解释给用户，并询问下一步。诊断内容包括：

- Buildr root、Project 和 Service 基础状态。
- service metadata 与本地 repo 是否一致。
- Git URL service repo 是否缺失，是否可引导用户 clone。
- 本地 repo remote 是否和 metadata 不一致。
- 外部本地路径是否不可访问。
- workspace `.gitignore` 是否避免外层 Git 误提交嵌套 service repo。
- 当前 Agent runtime 是否缺失、过期或冲突。

### 5. 检查和渲染当前 Agent runtime

```bash
buildr skill install claude-code --target .
buildr runtime check claude-code --scope projects/shop --target .
buildr rules render claude-code --scope projects/shop --target .
buildr skills render claude-code --scope projects/shop --target .
```

Buildr workspace 是 Agent 工作入口；service repo 是 workspace 管理的代码资产，不作为 MVP 的独立 Agent runtime 入口。`service create` 不向 service repo 写入 `CLAUDE.md`、`.claude/` 或其他 runtime 文件。

## 当前 MVP 命令

```bash
buildr init [--target <dir>] [--name <name>] [--profile <personal|team|company>]
buildr project create <project> [--target <dir>] [--repo <git-url>] [--title <text>] [--description <text>]
buildr service create <project>/<service> <repo-ref> [--target <dir>] [--type <type>] [--rules <path>]
buildr doctor [--target <dir>] [--scope <.|projects/project[/service...]>] [--json]
buildr commands add <id> --purpose <text> [--target <dir>] [--executable <name>] [--name <text>] [--description <text>] [--version-constraint <constraint>] [--version-args <args>] [--install-hint <text>] [--replace]
buildr commands remove <id> [--target <dir>]
buildr commands check [--target <dir>] [--json]
buildr bootstrap guide
buildr package check
buildr package build [--out <dir>]
buildr skill install claude-code --target <dir>
buildr runtime check claude-code --scope <scope> --target <dir>
buildr rules render claude-code --scope <scope> --target <dir>
buildr skills add [<id>] --source <skill-dir> --scope <.|projects/project> [--target <dir>] [--replace] [--ignore-unsupported]
buildr skills add <id> --remote-source <url> --scope <.|projects/project> [--target <dir>] [--source-kind <kind>] [--description <text>] [--replace]
buildr skills add <id> --resolved-source <url> --scope <.|projects/project> [--target <dir>] [--resolved-kind <kind>] [--remote-source <url>] [--source-kind <kind>] [--version <version>] [--integrity <hash>] [--description <text>] [--replace]
buildr skills remove <id> --scope <.|projects/project> [--target <dir>]
buildr skills render claude-code --scope <.|projects/project> --target <dir>
```

`buildr use` 仍是 Post-MVP 可讨论的更高层入口。当前 MVP 已通过 Buildr Skill、bootstrap guide 兜底和基础命令完成闭环。

## 资产边界

| 对象 | 定位 |
|------|------|
| `AGENTS.md` | Buildr 标准规则资产，随 Git 或未来服务端被管理 |
| `openspec/` | Buildr 默认内嵌 SDD 框架，维护规范、知识和变更 |
| `practices/` | 可复用实践经验 |
| `skills/` | 可直接读取或渲染到 Agent 原生 runtime 的技能资产 |
| `projects.yml` | root Project registry，记录 Project title、description、路径和资产 repo 来源 |
| `services.yml` | 项目级 service metadata 最小索引 |
| `.claude/`、`.trae/`、`.cursor/`、`.codex/` | Agent runtime 投射产物，可重建，不作为资产源 |
| service repo 业务代码 | 独立 Git repo，由 workspace 管理引用关系，不纳入外层 workspace Git |

## 已收敛的产品决策

1. Buildr 使用方式是跨 Agent 的项目协作契约，而不是某个 Agent 产品的私有配置。
2. 用户和 Agent 的协作入口是自然语言，CLI 是 Agent 执行的 hard constraint 协议。
3. 默认 Organization 由 Buildr root 本身承载，不再创建额外组织目录。
4. 默认 Project 资产路径固定为 `projects/<project>/`，Project 资产 repo 不登记外部本地链接。
5. 默认 service repo 目录固定为项目下 `services/<service>/`。
6. Git URL clone 未指定分支时使用远端 HEAD。
7. `service create` 同时支持本地路径和 Git URL，不拆成两个命令。
8. service metadata 是服务资产索引，不重复记录目录结构已表达的信息。
9. workspace-first runtime 是 MVP 主路径；service repo 不作为 MVP 独立 Agent runtime 入口。
10. `doctor --json` 是 Agent-readable 诊断入口；人类可读输出可以保留。
11. 已验证的当前事实从路线/愿景文档同步到 `openspec/knowledge/`，探索性内容继续保留在 `docs/`。

## 已完成 MVP 边界

### 产品手册与随包资产

Buildr 自身需要产品手册，帮助开发 Buildr 的 Agent 和人理解产品定位、核心概念、MVP 能力边界和当前实现状态。当前产品手册暂存于 `docs/buildr-product-manual.md`，后续随 Buildr 根层文档一起优化。

Buildr 随包资产位于 `package/`，用于隔离当前会进入发布包的 bootstrap、manifest、workspace baseline 和产品内置 Agent Skills。`ASSETS.md` 可以作为具体 root 的团队手册实践，但不再是默认初始化资产；是否产品化资产手册，等待实践和命令能力成熟后再判断。

### manifest-backed 资产维护边界

当前实现根级 `commands/manifest.yml`、`buildr commands add/remove/check` 和 doctor 聚合。命令行工具清单条目使用 `installHint` 表达安装提示，使用 `description` 表达补充背景；不再定义 `commands/<id>.md`、`commands/<id>/` 或其他独立命令文档结构。

当前实现 workspace/project 级 `skills add/remove`：`skills add --source <skill-dir>` 装载或登记完整 Skill 源目录，支持 `SKILL.md`、`scripts/`、`templates/`、`assets/`、`examples/`、`references/`；`skills add <id> --remote-source <url>` 登记远端信息源；`skills add <id> --resolved-source <url>` 登记 Agent 已解析出的精确安装源，当前支持 `resolved.kind: skill-url`。产品随包默认 Skill 仍可通过内部 `package:<id>` 来源解析，不作为用户新增远端发布型 Skill 的主要入口。

当前不新增 `rules add/remove`。规则资产没有 manifest，继续由 Agent 直接维护当前 scope 的 `AGENTS.md` 或 `rules/`。

当前不新增 `rules check` 或 `skills check`。规则和技能的同步状态继续由 runtime check、rules render、skills render 和 doctor 聚合提示承担。

当前不实现 service 级源资产支持，也不改变 commands root 级、skills workspace/project 级的现有 scope 模型。后续统一评估 service scope 下 rules、skills、commands、practices 或后续源资产模块的解析、叠加/覆盖、来源链和权限模型。

## Post-MVP 产品方向

### 安装与分发

当前 CLI 已支持开发仓 symlink 安装，并已具备 npm package metadata、`npm pack --dry-run` 和 `package build` 的本地验证路径。公开分发仍属于 Post-MVP，候选包括：

- npm registry 发布。
- Homebrew tap。
- standalone script。
- release binary。

### 多 Agent adapters

Claude Code adapter 已作为首个验证对象。后续可扩展到 Codex、Trae、Cursor、Qoder 等 Agent runtime，但资产源仍以 Buildr workspace 为准。

### 未来能力域

Buildr 当前已覆盖规则（Rules）、技能（Skills）、命令行工具清单（Commands）、Project 和 Service 的基础管理。后续可以把 Agent 产品逐步提供的结构化能力纳入 Buildr 的资产治理，但这些能力应保持分层，不和现有规则、技能或命令行工具清单混用。

| 能力域 | 定位 | 候选资产形态 | 初始边界 |
|--------|------|--------------|----------|
| MCP Client | 外部工具、数据源和私有系统连接声明 | `mcp/` 或 manifest-backed client entries | Buildr 管连接声明、适用 scope、所需权限和 doctor 检查；不保存 token、cookie、登录态或个人私有配置 |
| Hooks | 空间触发的自动化，例如 workspace / project / service / Git / runtime 生命周期事件 | `hooks/` 或 `automations/hooks/` | 用于确定性前置/后置动作、校验和阻断；不替代 Skill 的任务流程说明 |
| Timer | 时间触发的自动化，例如定时巡检、周期报告、延迟提醒和后台维护任务 | `timers/` 或 `automations/timers/` | Timer 只定义“什么时候触发”；具体“怎么做”应引用 Skill、命令行工具或后续 automation workflow |
| Agent Collaboration | 多 Agent / 子代理 / 专家角色协作编排 | `agents/`、`collaboration/` 或 manifest-backed agent entries | 管理角色、职责、上下文分配、handoff 和共享记忆边界；不绑定某个 Agent 产品的私有 subagent 格式 |

这些能力的产品化顺序应以真实 dogfood 需求驱动。优先判断它们是否需要成为 Buildr 源资产：如果只是当前 runtime 的临时设置，保留在 Agent runtime；如果需要团队复用、审计、诊断和跨 Agent 投射，再沉淀为 Buildr 资产。

### Post-MVP TODO

- 工具型资产的三层作用域：后续设计规则、技能、命令行工具在 root / project / service 下的解析、叠加和覆盖语义。
- 命令行工具声明合并：后续实现默认叠加、同 `id` 下层整项覆盖，并在 `doctor` 或检查结果中输出来源链。
- 工具型资产的维护权限：后续设计规则、技能、命令行工具的新增、修改、删除、审核和高风险控制；权限边界优先控制源资产维护范围，不控制 Agent runtime 读取或使用权限。
- MCP Client 资产边界：后续设计 workspace/project/service 级 MCP client 声明、runtime adapter 投射、权限提示、缺失检查和禁用策略；严禁保存 secret 或个人登录态。
- Hooks 资产边界：后续设计空间触发事件模型、执行时机、失败语义、可审计日志和高风险 hook 的用户确认机制。
- Timer 资产边界：后续设计时间触发任务的 schedule 表达、运行位置、幂等要求、状态记录和失败重试策略；Timer 应引用 Skill 或 workflow，而不是内联长流程。
- Agent Collaboration 资产边界：后续设计角色/子代理定义、任务拆分、handoff、共享上下文、输出归档和多 Agent 冲突处理。
- 技能引用命令行工具：后续明确技能正文可以引用命令行工具，但不维护反向依赖索引或依赖图；默认乐观执行、失败后检查，只有技能显式要求时才前置检查。
- 命令行工具检查状态：后续标准化 `ok` / `warning` / `error` 等状态；命令缺失或版本不满足应警示但不阻断，声明文件非法才视为错误。
- 命令行工具版本检查：后续采用可执行文件加参数数组的结构化模型，避免任意 shell 检查；版本约束可选，填写后必须检查本机版本，默认解析版本输出，暂不支持自定义正则。
- 命令行工具安装来源：后续保持为最小自由文本或链接，不做平台或包管理器结构化；具体安装协作由 Agent 根据当前机器和用户授权处理。
- 默认资产清单：后续保持“是否为空取决于是否随包提供对应内置能力”；当前命令行工具清单默认空，不把 Buildr 自身声明为工作区命令行工具资产。
- 工具型资产概念边界：规则、技能、命令行工具只是概念性分组，暂不新增统一 `assets resolve` 或统一资产管理命令。
- 实践抽象：后续判断 `practices/` 是否应升级为 `capabilities/`，以及能力是否能进一步沉淀为规则、技能或命令行工具声明。

### 公开发布基础设施

正式开源前需要：

- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- 公开 example workspace
- 去私有化的模板和默认目录
- CLI reference

## 建议下一步

MVP 完成后，建议下一步先做公开发布收口，不继续向 MVP 塞新功能：

- 按 `docs/buildr-release-checklist.md` 区分已完成 MVP 和公开发布前待补事项。
- 补齐 `LICENSE`、`CONTRIBUTING.md`、`SECURITY.md`、CLI reference 和公开 example workspace。
- 检查随包资产、默认模板和示例内容是否仍含当前私有 workspace 信息。
- 运行 `./buildr package check`、`tools/verify-buildr-product-mvp`、`openspec validate --all --strict` 和 `npm pack --dry-run`。
- TODO: 从独立的示例组织 Buildr workspace 持续整理业务开发中的产品反馈，并定期转化为 Buildr roadmap 或 OpenSpec change。
- Post-MVP 功能另开 change，不改变当前 MVP 完成口径。
