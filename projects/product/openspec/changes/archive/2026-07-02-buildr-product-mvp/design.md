## Context

Buildr 当前已经具备框架规则、OpenSpec、practices、skills 和 Claude Code runtime render 的基础能力，但产品入口仍偏向“用户理解并执行命令”。Product MVP 需要验证另一种主路径：用户通过自然语言表达“使用 Buildr 作为项目管理框架”，Agent 根据 Buildr bootstrap guide 安装或检查 CLI、初始化 workspace、反问必要信息、接入 service repo，并通过诊断输出引导后续动作。

本设计基于已完成的 Organization 模型：Buildr workspace 下统一使用 `Workspace → Organization → Project → Service` 层级，组织级资产路径为 `organizations/<org>/`，默认组织为 `default`。Buildr workspace 本身是长期项目管理资产库，可以 Git 化并被团队共享；service repo 是独立 Git 仓库，可以嵌套在 workspace 中，也可以作为外部本地路径被引用。

关键约束：

- MVP 必须围绕 Agent-first onboarding 设计，而不是要求用户背诵 CLI。
- CLI 仍是确定性执行层，Agent 必须通过 CLI 或可验证文件变更维护 workspace。
- 规则、OpenSpec、practices、skills、service metadata 和 runtime 投射关系属于 Buildr workspace 管理的长期资产。
- service repo 的业务代码不应被外层 workspace Git 误提交。
- `AGENTS.md` 是 Buildr 标准规则资产，随 Git 或未来服务端能力被管理；`.claude/`、`.trae/`、`.cursor/`、`.codex/` 等 Agent runtime 目录只是面向不同 Agent 产品的投射产物，不作为组织或项目资产源。
- 使用 Buildr 是一种项目协作契约，类似旧时代不同 IDE 都支持 Maven；在新一代 Agent 产品中，要么 Agent 原生支持 Buildr，要么用户通过自然语言触发 Buildr bootstrap guide。

## Goals / Non-Goals

**Goals:**

- 定义 Agent-first onboarding 的最小闭环：发现 Buildr、初始化 workspace、创建或选择组织和项目、接入 service repo、运行诊断、解释下一步。
- 定义 MVP 目录骨架，使 workspace 可以作为项目管理资产库被 Git 共享。
- 定义 `service link` 对本地路径和 Git URL 的统一接入方式。
- 定义 service metadata 作为最小服务资产索引，用于记录目录结构无法表达的信息，并支持跨用户、跨 Agent 恢复 service repo。
- 定义 workspace-first runtime 投射边界：优先保证 Buildr workspace runtime 可用，service repo 不作为 MVP 的独立 Agent runtime 入口。
- 定义 `doctor` 的 Agent-readable 输出模型。

**Non-Goals:**

- 不实现完整企业云服务、权限系统、Web UI 或代码仓托管。
- 不要求 MVP 自动解决所有跨机器恢复问题；MVP 只提供 metadata 和诊断基础，使 Agent 能引导用户补全。
- 不强制所有 service repo 必须嵌套在 workspace 内；默认推荐内嵌，允许外部路径。
- 不把 service repo 业务代码纳入 Buildr workspace Git 管理。
- 不要求接入 service 时必须向 service repo 写入 runtime 文件。
- 不在本 change 内决定是否保留 `company create` 兼容别名。

## Decisions

### 1. 以 Agent-first onboarding 作为产品主路径

Buildr 的用户入口应是自然语言意图，而不是命令菜单。Agent 读取 bootstrap guide 后，负责把用户意图转译为 CLI 调用和文件资产变更。使用 Buildr 对团队来说是一种项目协作契约：类似旧时代 Maven 被不同 IDE 支持，Buildr 应成为新一代 Agent 产品可以原生理解或通过 bootstrap guide 学会使用的项目管理框架。

主流程：

```text
用户自然语言意图
  → Agent 读取 Buildr bootstrap guide
  → 检查或安装 Buildr CLI
  → 确认当前目录是否作为 Buildr workspace
  → buildr init
  → 确认默认组织 / 显式组织
  → 确认项目和 service 归属
  → buildr service link
  → buildr doctor
  → Agent 解释状态和下一步
```

选择原因：

- 符合 AI 时代人和 Agent 的协作方式：人提供目标和判断，Agent 执行细节。
- CLI 仍保留 hard constraint 价值，避免纯自然语言文件修改不可审计。
- onboarding 是否顺滑决定 MVP 是否成立。

备选方案：

- CLI-first：让用户按文档执行 `buildr init`、`project create`、`service link`。该方案实现简单，但与 Buildr 的 Agent-first 定位冲突。
- Web-first：先做可视化界面。该方案心智负担低，但会放大 MVP 范围，并削弱 CLI 作为 Agent 执行协议的验证价值。
- 提供 `buildr use` 作为更高层入口：长期可能有价值，但 MVP 先用 bootstrap guide + 基础命令完成闭环，再讨论是否抽象该入口。

### 2. workspace 是项目管理资产库，service repo 是被管理资产

Buildr workspace 保存长期项目管理资产，不直接等同于业务代码仓。service repo 可以作为 Project 下的业务服务，也可以作为 Organization 下的 shared service；两者都由 Buildr workspace 维护引用和 metadata，可以嵌套在 workspace 中，也可以作为外部路径被引用。

推荐 MVP 目录形态：

```text
<workspace>/
├── AGENTS.md
├── CLAUDE.md
├── .gitignore
└── organizations/
    └── <org>/
        ├── AGENTS.md
        ├── practices/
        ├── skills/
        ├── shared/
        │   ├── services.yml
        │   └── services/
        │       └── <shared-service>/  # 组织级共享服务 repo，可选存在
        └── projects/
            └── <project>/
                ├── AGENTS.md
                ├── openspec/
                ├── practices/
                ├── skills/
                ├── services.yml
                └── services/
                    ├── <service-a>/  # 项目业务 service repo，可选存在
                    └── <service-b>/  # 项目业务 service repo，可选存在
```

选择原因：

- workspace Git 记录项目管理资产，service repo Git 记录业务代码，职责清晰。
- 文件系统自然嵌套即可表达归属，不需要引入额外 `repos/` 层。
- 共享 workspace 后，即使 service repo 尚未 clone，metadata 也能让 Agent 引导用户补全。

备选方案：

- 强制所有 repo 放入 `repos/`：结构更显式，但增加无必要层级，用户和 Agent 都要多理解一层映射。
- 只引用外部 repo：不会出现嵌套 Git，但降低一站式 workspace 的可用性，资源管理器和源代码管理器体验较差。

### 3. `service link` 统一处理本地路径和 Git URL

MVP 保留一个 `service link` 命令，由 repo-ref 类型自动判断处理方式：

- 本地路径：校验可访问性和 Git 状态，只维护引用关系。
- Git URL：默认 clone 到归属层级下约定 service 目录，再维护引用关系。
- Project service 默认使用 `organizations/<org>/projects/<project>/services/<service>`。
- Shared service 默认使用 `organizations/<org>/shared/services/<service>`。
- 如果用户未说明 service 是业务项目服务还是组织共享服务，Agent 应引导用户确认归属后再调用命令或维护 metadata。
- 如果用户未指定 Git 分支，clone 时默认使用远端 HEAD。

示例：

```bash
buildr service link default/shop/api https://example.com/acme/shop-api.git
buildr service link default/shop/web ../shop-web
```

选择原因：

- 一个命令更符合 Agent 执行模型，减少用户和 Agent 之间的概念切换。
- Git URL 场景下自动 clone，避免要求用户打开 Git 页面、复制 URL 后再手动 clone。
- 本地路径场景保留专业开发者已有目录布局。

备选方案：

- 拆成 `service link` 和 `service clone`：命令语义更纯，但用户意图本质都是“引入这个服务”，拆分会增加心智负担。
- 只支持 Git URL：便于恢复，但不适合已经存在的本地仓库。

### 4. service metadata 是最小服务资产索引

service metadata 不应重复记录目录结构已经表达的信息，而应记录目录无法表达、跨用户恢复和 Agent 引导所需的信息。

推荐 MVP 采用 `services.yml` 作为最小索引：Project service 使用项目级 `organizations/<org>/projects/<project>/services.yml`，shared service 使用组织级 `organizations/<org>/shared/services.yml`。两者 schema 保持一致：

```yaml
services:
  api:
    repo:
      kind: git
      url: https://example.com/acme/shop-api.git
      remote: origin
      defaultBranch: main
      path: services/api
    type: backend
    rules:
      source: AGENTS.md
  web:
    repo:
      kind: local
      path: ../../external/shop-web
    type: frontend
```

字段原则：

- `repo.kind` 表示来源类型：`git` 或 `local`。
- `repo.url` 只在 Git URL 场景必需。
- `repo.path` 在内嵌默认路径时可以由约定推导；如果写入，作为显式索引和诊断依据。
- `type` 用于表达服务语义，例如 backend、frontend、mobile、library、infra。
- `rules` 记录服务级规则资产入口。
- Project service 的 metadata 位于 Project 根目录，shared service 的 metadata 位于 `organizations/<org>/shared/services.yml`。
- 历史 shared service 已位于 `organizations/<org>/shared/<service>/` 时，MVP 可通过 metadata 记录该相对路径纳入管理，不强制迁移到 `shared/services/<service>/`。
- MVP 采用每个归属层级一个 `services.yml`，后续如服务索引复杂度上升，再演进为每个 service 独立 metadata 文件。

选择原因：

- metadata 是项目资产，能被 Git 共享。
- 新用户或另一个 Agent 打开 workspace 后，可以根据 metadata 判断哪些 service repo 缺失，并询问是否自动 clone。
- 避免把 metadata 做成目录结构的重复镜像。

备选方案：

- 每个 service 一个 metadata 文件：局部性更好，但 MVP 下文件数量和发现成本更高。
- 不维护 metadata：初始体验更简单，但共享 workspace 后无法知道缺失 repo 的来源，也无法支持自动补全。
- 重 metadata：表达完整但容易和目录结构漂移，增加维护成本。

### 5. workspace-first runtime projection

MVP 主路径必须保证 Buildr workspace 中的 Agent runtime 可用。service repo 是 Buildr workspace 管理下的 service 资产，不作为 MVP 的独立 Agent runtime 入口；用户即使只参与某个项目或服务，也应在裁剪后的 Buildr workspace 资产中工作。

选择原因：

- Buildr 的核心价值来自 workspace 中的项目资产、OpenSpec、规则、实践、Skills 和 service metadata。
- runtime 文件可重建，不应成为长期资产源。
- service repo 可以被 `.gitignore` 忽略，避免外层 workspace Git 误提交业务代码或 runtime 产物。
- 权限裁剪应发生在 Buildr workspace 资产视图上，而不是让工作入口退化为单独 service repo。

备选方案：

- 接入 service 时总是写入 service repo runtime：方便单仓入口使用，但会扩大副作用，污染业务仓，并削弱 Buildr workspace 作为主入口的产品边界。
- 将 service repo runtime 作为可选投射能力：看似灵活，但会暗示 service repo 可以脱离 Buildr workspace 独立使用，不作为 MVP 目标。

### 6. `doctor` 输出 Agent-readable 诊断结果

`buildr doctor` 应优先输出结构化状态，由 Agent 解释给用户。MVP 支持 `--json` 输出作为 Agent-readable 格式；默认输出可以保留人类可读文本。

建议诊断维度：

- workspace 是否初始化。
- 默认组织或显式组织是否存在。
- project 目录和 OpenSpec 是否存在。
- service metadata 是否有效。
- metadata 中声明的 service repo 是否已存在、是否是 Git repo、remote 是否匹配。
- workspace `.gitignore` 是否忽略内嵌 service repo。
- runtime bridge 是否存在、是否 stale、是否由 Buildr 管理。
- 下一步建议，例如 clone 缺失 service、render runtime、补全规则源。

选择原因：

- Agent 可以基于结构化状态继续行动，而不是解析面向人的日志。
- doctor 成为 onboarding 和日常维护的统一检查入口。

备选方案：

- 只输出人类可读文本：实现简单，但 Agent 难以稳定消费。
- 每个命令各自输出下一步：局部体验好，但缺少统一诊断入口。

## Risks / Trade-offs

- [Risk] Agent-first 容易让 CLI 语义被隐藏，用户不理解实际发生了什么 → Mitigation：Agent 在关键动作前说明将调用的 Buildr 命令，并在执行后总结资产变化。
- [Risk] service metadata 与实际文件系统、Git remote 漂移 → Mitigation：`doctor` 检查 metadata 与实际 repo 状态，并给出修复建议。
- [Risk] 嵌套 Git repo 被外层 workspace 误提交 → Mitigation：`init` 和 `service link` 维护 `.gitignore`，`doctor` 检查忽略规则。
- [Risk] 默认 clone 到 workspace 可能不适合所有团队目录习惯 → Mitigation：保留本地路径 link，并用 metadata 表达外部引用。
- [Risk] 用户只打开 service repo 导致缺失 Buildr 项目上下文 → Mitigation：bootstrap guide 和 doctor 明确 Buildr workspace 是 Agent 工作入口，service repo 是 workspace 管理的代码资产。
- [Risk] `services.yml` 后续可能承载过多职责 → Mitigation：MVP 仅定义最小索引字段，复杂生命周期、权限、部署信息留给后续能力。

## Migration Plan

1. 在 Product MVP 的 specs 中拆分并定义 Agent-first onboarding、workspace management、service asset indexing、doctor 和 runtime projection 能力。
2. 更新或新增 CLI 行为，使 `init`、`service link`、`doctor` 能围绕上述能力工作。
3. 更新 workspace 模板，生成默认 Organization、项目资产目录、service metadata 位置和 `.gitignore` 规则。
4. 更新 runtime render/check，使 workspace-first runtime 边界明确：workspace 是 Agent 工作入口，service repo 不作为 MVP 的独立 runtime 入口。
5. 更新产品化文档和 bootstrap guide，使 Agent 能按自然语言入口完成 onboarding。
6. 用一个最小示例 workspace 验证：初始化、link Git URL、link 本地路径、共享后诊断缺失 repo、自动 clone 建议、runtime check。

回滚策略：本 change 仍处于产品 MVP 设计阶段，若实现中发现路径或 metadata 模型不成立，应先更新 design/specs，再调整任务；不在未归档状态下承诺兼容稳定性。

## Open Questions

无。