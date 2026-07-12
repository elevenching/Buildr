> Archived historical note. Not a current Buildr product source of truth.

# Buildr 产品手册

## 一句话定位

Buildr 是面向人和 Agent 协作的上下文与工作资产治理系统。

它服务的不是单次 prompt，而是多人、多职责、多项目、多代码仓长期使用 Claude Code、Codex 等生产工具 Agent 时，需要稳定复用、可审计演进、可按组织边界治理的一组工作资产。

## Buildr 面对什么问题

企业开始把 Agent 引入真实工作后，问题很快不再是“某个 Agent 能不能完成一次任务”，而是：

1. **上下文分散**：规则、业务事实、需求变更、工程实践和 Agent Skills 散落在聊天记录、个人经验、临时文档、PR 讨论和不同仓库里。
2. **使用者复杂**：产品、研发、测试、架构、运维等不同职责人员会在同一批项目中使用 Agent，但他们需要的上下文和权限边界不同。
3. **项目和仓库复杂**：一个业务项目往往包含多个代码仓、公共服务和服务级规则，单仓 README 无法表达完整工作边界。
4. **Agent runtime 不统一**：Claude Code、Codex、Cursor、Trae 等产品读取上下文的位置不同，直接手写 runtime 文件容易漂移、冲突或污染业务仓。
5. **长期资产不可治理**：如果每次只靠 prompt 临时解释，团队很难知道哪些规则有效、哪些知识已经过期、哪些能力可以复用。

## Buildr 想解决什么问题

Buildr 的目标是让企业能够治理 Agent：

- 在什么组织、项目、服务范围内工作。
- 以什么身份和职责读取上下文。
- 必须遵守哪些规则和工程约束。
- 可以复用哪些实践、Skills、模板和 Workflow。
- 哪些业务事实、能力规范和需求变更是当前可信语义记忆。
- 如何把长期资产投射到不同 Agent 实际可消费的 runtime 位置。

换句话说，Buildr 要把“每次临时告诉 Agent 怎么做”变成“团队持续维护一套可复用、可诊断、可投射的 Agent 工作资产”。

## Buildr 如何解决问题

Buildr 使用文件体系和 Git 管理工作资产，并用 CLI 作为 Agent 可执行的确定性协议。

```text
Install to Buildr, render to Agent runtime.
```

核心做法：

| 能力 | 解决的问题 |
|------|------------|
| Buildr root / Project / Service 层级 | 用一个根目录表达个人、团队或公司的 Organization 上下文，再管理项目和代码服务 |
| `AGENTS.md` 规则资产 | 维护不同层级的 Agent 行为边界和工程约束 |
| OpenSpec | 管理能力规范、业务知识、变更过程和归档记录 |
| `practices/` | 沉淀可复用的研发、测试、交付和协作经验 |
| `skills/` | 管理可投射到 Agent 原生技能系统的任务能力 |
| 产品内置 Agent Skills | 随 Buildr 产品发布，让支持 Skills runtime 的 Agent 直接获得 Buildr 使用能力 |
| `projects.yml` | 索引 workspace 管理的 Project 及其资产 repo 来源 |
| `services.yml` | 索引项目服务的 repo 来源、类型和规则入口 |
| `doctor --json` | 给 Agent 提供结构化诊断，让 Agent 能解释状态并引导下一步 |
| runtime check/render | 把 Buildr 资产投射到 Claude Code 等 Agent runtime，同时识别缺失、过期和冲突 |
| 随包资产与产品文档 | 帮助人和 Agent 理解 Buildr 产品现状、初始化 baseline、默认规则和当前能力 |

## 核心概念

### Workspace

Buildr root 是长期工作资产库，不等同于某个业务代码仓。默认情况下，一个 root 就是一个 Organization 上下文实例，保存规则、OpenSpec、practices、skills、service metadata 和 runtime 投射关系。

### Organization

Organization 表示个人、公司、团队、客户或治理边界。Buildr 默认把用户选择的 root 目录作为 Organization 上下文，不再要求在 root 下额外创建同名组织目录。

### Project

Project 表示业务、产品或系统上下文，不等同于业务代码仓。一个 Project 可以管理多个 service repo，并默认内置 OpenSpec；Project 资产自身也可以作为独立 Git repo materialize 到 `projects/<project>/`。

### Service

Service 表示项目下的代码仓、应用、模块或可执行单元。共享、基础或平台服务也通过某个 Project 表达，例如 `foundation` 或 `platform`。service repo 由自身 Git 管理，Buildr root 维护引用和 metadata。

### Buildr 资产与 Agent runtime

Buildr 资产是长期源头；Agent runtime 是可重建投射产物。

| 类型 | 示例 | 是否是源头 |
|------|------|------------|
| Buildr 资产 | `AGENTS.md`、`projects.yml`、`openspec/`、`practices/`、`skills/`、`services.yml` | 是 |
| Buildr 产品内置 Agent Skill | `package/agent-skills/buildr/SKILL.md` | 是，属于产品随包资产 |
| Agent runtime | `CLAUDE.md`、`.claude/`、`.cursor/`、`.codex/`、`.trae/` | 否 |

Claude Code 的 `CLAUDE.md` 可以包含用户自定义内容，但 Buildr 只管理并检查其中的 managed block。用户自定义内容应放在 managed block 外。`@AGENTS.md` reference bridge 会实时读取同目录规则；旧 hash 过期只是元数据状态，不代表 runtime 过期。

## MVP 能力边界

当前 MVP 已完成的主路径是人和 Agent 协作的 workspace 管理闭环：

1. 用户用自然语言告诉 Agent：“使用 Buildr 管理这个项目”。
2. Agent 使用 Buildr Skill；如果 Skill 不可用，则读取 [package/bootstrap/guide.md](../package/bootstrap/guide.md) 兜底。
3. Agent 使用 Buildr CLI 完成用户指令，不手工拼装核心结构。
4. Agent 通过 `buildr init --name <name>` 初始化 root-as-Organization 实例，并在状态变更后运行 `buildr doctor --json`。
5. Agent 根据自身 runtime 能力选择动作：Codex 直接读取 `AGENTS.md`，不需要规则桥接；Claude Code 通过 `buildr skill install claude-code` 安装 Buildr 产品内置 Skill，并通过 runtime check/render 维护 `CLAUDE.md` 和 workspace/project Skills。默认 workspace 带出 OpenSpec Skills 源资产，供支持 Skills runtime 的 Agent 投射使用。
6. Agent 基于 `doctor --json` 和用户目标，引导创建 Project、接入 Project 资产 Git repo，或接入本地路径/Git URL service repo。
7. Agent 按 `AGENTS.md` 约束将有复用价值的信息保存回 Buildr 资产源，并用 `doctor --json` 校验事实状态。

MVP 不解决完整企业云服务、权限系统、Web UI、代码托管、跨机器自动恢复或 service repo 独立 runtime 注入。它已经验证文件体系、Git、CLI、Buildr Skill、bootstrap guide 和 Agent runtime 投射能支撑人和 Agent 共同维护工作资产。

## 人和 Agent 协作使用方式

用户不需要先学习命令菜单。典型交互是：

```text
用户：使用 Buildr 管理这个项目。
Agent：我会检查 Buildr CLI 和 Buildr Skill；如果 Skill 不可用，就读取 bootstrap guide 兜底。
Agent：我会使用 Buildr CLI 完成初始化、runtime 处理和 doctor 诊断，然后根据诊断结果引导你创建 Project 或接入 Service。
```

CLI 是 Agent 的 hard constraint 执行层。Agent 可以解释意图、反问关键决策、展示结果，但涉及 workspace 资产变更时应调用 Buildr CLI 或做可验证文件变更。

Buildr Skill 是 Agent 使用 Buildr 的首选入口，提供轻约束、命令地图和完成标准。`buildr skill install <agent>` 是安装或修复 Buildr 产品内置 Skill 的产品入口；`buildr bootstrap guide` 是 Skill 不可用、Skill 未安装、runtime 损坏或当前 Agent 不支持 Skills 时的兜底入口。`buildr init` 不会自动写入 Agent runtime。

## 手册与知识资产边界

| 位置 | 面向读者 | 作用 |
|------|----------|------|
| `docs/buildr-product-manual.md` | Buildr 使用者、维护者、Agent | 理解 Buildr 产品定位、核心概念、MVP 边界和当前能力 |
| `package.json` | Buildr 维护者、发布流程 | 维护 Buildr CLI npm package metadata，npm package root 是当前产品 repo |
| `package/` | Buildr 维护者、发布流程、Agent | 维护会进入产品发布包的 bootstrap、manifest、workspace baseline 和产品内置 Agent Skills |
| `package/workspace/` | Buildr 维护者、发布流程、Agent | 维护默认 workspace baseline、Project 模板源、规则 baseline 和 workspace Skills baseline |
| `package/README.md` | Buildr 维护者、发布流程 | 说明 package 目录职责、workspace baseline 映射和维护规则 |
| `package/agent-skills/` | Buildr 维护者、Agent runtime | 维护随产品发布的内置 Agent Skills，不属于用户 workspace `skills/` |
| `package/bootstrap/bootstrap.contract.yml` | Buildr 维护者、发布流程 | 校验 Buildr Skill、bootstrap guide 和生成后 runtime Skill 的入口不回退 |
| `docs/` | Buildr 维护者、产品设计参与者 | 探索性产品思考、架构愿景和演进路线 |
| `openspec/specs/` | 变更实现者、审查者、Agent | 已收敛的规范性要求 |
| `openspec/knowledge/` | 维护者、Agent | 已实现或已验证的当前事实和语义记忆 |
| `openspec/changes/` | 维护者、Agent | 情景记忆，记录变更过程、任务和归档 |

产品手册面向“Buildr 是什么、为什么存在、当前能做什么”；随包资产面向“Buildr 初始化和发布时会交付哪些 baseline”。

## 当前实现状态

当前仓库已具备：

- `buildr init`
- `buildr project create`
- `buildr service create`
- `buildr doctor --json`
- `buildr commands add`
- `buildr commands remove`
- `buildr commands check`
- `buildr bootstrap guide`
- `buildr package check`
- `buildr package build`
- `buildr skill install claude-code`
- `buildr skills add`
- `buildr skills remove`
- `buildr runtime check claude-code`
- `buildr rules render claude-code`
- `buildr skills render claude-code`

当前主要限制：

- runtime adapter 先以 Claude Code 为主。
- Codex 当前按原生 `AGENTS.md` 规则入口使用 Buildr；尚未提供 Codex Skills adapter。
- workspace/project Skills 源资产已经可通过 `skills add/remove` 维护；本地作者型 Skill 用 `--source`，远端发布型 Skill 先登记 `--remote-source`，解析后登记 `--resolved-source`。Buildr 产品内置 Skill 仍通过 `buildr skill install` 单独安装。
- 规则资产没有 manifest，不提供 `rules add/remove`；Agent 直接维护当前 scope 的 `AGENTS.md` 或 `rules/`。
- service repo 不作为 MVP 的独立 Agent runtime 入口，不写入 `CLAUDE.md`、`.claude/` 或其他 runtime 文件。
- 权限裁剪、lockfile/hash、系统级 hook 和更多 Agent adapter 仍是后续能力。
- 单独资产手册仍可作为具体 root 的自用或团队手册使用，但不是默认初始化资产；后续是否产品化资产手册，等待 `assets check/refresh` 等能力成熟后再设计。
