## Context

Buildr 的命令实现、主帮助、bootstrap guide、产品 README、current-state knowledge 和 canonical specs 已分别覆盖大量入口，但当前没有“实现存在性”之外的产品表面分类。根帮助把日常 workspace 操作、产品构建命令和 OpenSpec 契约门禁平铺展示；`service create --rules` 已是 deprecated no-op，却仍出现在主题帮助与 bootstrap canonical 示例中。

本设计把现有事实分为三层，而不是按命令是否可执行来推断产品承诺：

| 分类 | 产品含义 | 主要表面 |
|---|---|---|
| public | 普通用户或 Agent 可以正式依赖的 workspace 能力，包括日常、诊断、修复和显式高级操作 | 根帮助、主题帮助、主产品文档和 bootstrap canonical 示例 |
| legacy compatibility | 为旧 workspace、旧参数或旧 scope 保留的兼容读取、迁移或 no-op；不得用于新调用 | 仅在命中旧形式时给 warning/info 或迁移提示，兼容测试可见 |
| internal/maintenance | 产品构建、发布、自举、随包解析或 OpenSpec 工作流编排使用；不是普通 workspace 资产 API | 清晰标注的维护帮助/文档、workflow Skill 和产品验证 |

现有实现证据与裁决如下：

| 表面 | 实现、spec 与测试证据 | 分类与裁决 |
|---|---|---|
| `package check`、`package build` | `tools/buildr` 实现 package manifest 校验与带 receipt/integrity 的 staging 构建；`buildr-package-assets` 规范和 release checklist 将其用于产品包验证/发布；MVP E2E 也从安装后的 CLI 验证 `package check` | internal/maintenance；保留全部功能和安装后可用性，帮助与文档明确仅供 Buildr 产品维护者/发布流程使用 |
| `package:<id>` | `parseSkillSourceRef` 只接受该格式，解析目标来自 package manifest `skillSources`；`buildr-package-assets` 规范只在随包 baseline 引用场景定义它；当前用户命令没有把它作为 asset id 参数 | internal/maintenance data identity；保留解析和数据语义，不作为 `skills add` 的公开 source/id 推荐 |
| `service create --rules` | `createService` 仅解析参数并输出 deprecated warning，不读取路径、不写入 `services/manifest.yml`；`service-asset-indexing` 规定 Service Rule 由目录 `AGENTS.md` 发现且 manifest 禁止 `rules.source`；E2E 只验证兼容 warning 与零 metadata | legacy compatibility no-op；保留旧调用成功与 warning，从主帮助、主题帮助和 bootstrap canonical 示例移除 |
| 未传 `--agent` 的 `doctor` | `agent-readable-doctor` 明确要求 backward compatible；current state 明确其不是 Agent onboarding 主流程 | legacy-compatible public invocation；继续接受，但 canonical Agent 流程始终使用 `--agent <agent>` |
| `projects/<project>/<service>` scope shorthand | runtime checker 与 Rules resolver 只在 registry 无歧义时兼容并 warning；canonical specs 要求修复命令输出 `projects/<project>/services/<service>` | legacy compatibility；输入兼容，任何生成命令和文档只输出 canonical scope |
| `projects.yml`、Project `services.yml` | doctor、update/sync 和 `service-asset-indexing` 定义检测与收敛，冲突时 canonical manifest 优先 | legacy data migration；不进入新 workspace 文档和主帮助 |
| 遗留 `practices/` | doctor 仅以非阻塞 info 报告，update/sync 保留数据 | legacy preserved user data；不是 CLI/资产主表面，本 change 只在分类清单引用现有事实 |
| `organizations/<org>/` scope/layout | canonical spec 明确拒绝，不作为兼容入口 | unsupported，不误标为 legacy compatibility |
| `openspec baseline/check` | Buildr contract guard Skill 调用，负责 change baseline、冲突和 sync receipt；不是普通 workspace 的 OpenSpec 内容管理入口 | internal/workflow；保留命令，标注由 Buildr/OpenSpec workflow 使用 |
| `mutation recover` | doctor 对不完整 source transaction 生成可执行恢复动作，用户需要显式运行 | public repair；虽然低频，仍是正式支持入口 |
| `render`、`runtime check`、`rules/skills render`、`builtin`、`update` | Buildr Skill、bootstrap、doctor next action 和 current specs 直接使用 | public advanced/maintenance；低层但属于 workspace 用户/Agent 可支持操作，不归 internal |

当前可执行命令的完整分类如下；同一 command family 的 action 在表中显式列出：

| 分类 | 命令 |
|---|---|
| public onboarding / daily | `init`、`project create`、`service create`、`doctor`、`runtime list`、`sync claude-code`、`sync codex` |
| public asset lifecycle | `commands add/remove/check`、`component list/check/install/uninstall`、`rules add/remove`、`skills add/remove`、`builtin list/uninstall/restore`、`update`、`update check` |
| public advanced / repair | `mutation recover`、`runtime check claude-code/codex`、`render claude-code/codex`、`rules render claude-code`、`skills render claude-code/codex`、`skill install claude-code/codex`、`bootstrap guide` |
| internal workflow | `openspec baseline create`、`openspec check` |
| internal product maintenance | `package check`、`package build` |

命令之外的兼容/内部表面单独分类：`service create --rules`、无 `--agent` doctor、旧 Service scope shorthand、`projects.yml`、Project `services.yml` 和遗留 `practices/` 属于 legacy compatibility/preserved data；`package:<id>` 属于 internal source identity；`organizations/<org>/` 属于 unsupported input。`--help`、`-h` 和 `buildr help` 是 public help spellings，不属于 deprecated command alias。

## Goals / Non-Goals

**Goals:**

- 让同一表面在 help、docs、knowledge、spec 和测试中具有一致分类。
- 让根帮助首先表达 public workspace surface，并把仍需可发现的产品 maintenance/workflow 命令放入明确分区。
- 保留所有已承诺的兼容和内部数据语义，同时停止在 canonical 示例中推荐旧形式。
- 用自动验证阻止 legacy 参数重新进入 canonical help/bootstrap，或 internal identity 被误写成 public asset id。

**Non-Goals:**

- 不删除或重命名 CLI 命令，不设计新的命令框架或权限门禁。
- 不改变 package output、Skill resolution、Service metadata、Components、OpenSpec contract guard 或 managed-data-integrity 行为。
- 不为历史 archive 改写当时事实。
- 不在本 change 决定公开分发、版本策略或外部 API 稳定性等级。

## Decisions

### 1. 分类是产品契约，不增加运行时 registry

用新 capability spec、文档分类表和 help 分区表达分类，并通过测试锁定关键边界；不新增 CLI surface registry 或 metadata schema。现有命令集中定义在 `HELP_TOPICS` 和 dispatch 中，当前规模下新增数据模型只会制造第二份易漂移事实。

备选方案是创建机器可读 command registry 并由其生成 help。它可能适合未来独立 CLI reference，但会把本次“澄清表面”扩大成命令架构重写，因此不采用。

### 2. 根帮助分区，而不是让 internal 命令消失

根帮助将正式 public workspace 命令与 `Product maintenance / workflow internals` 分开展示。`package check/build` 和 `openspec baseline/check` 仍可发现、仍有主题帮助，但文案明确普通 workspace 用户不应直接依赖。

备选方案是完全隐藏 internal 命令。这样会损害产品维护者与 workflow 调试可发现性，也会与这些命令当前有正式安全契约和安装后验证的事实冲突。

### 3. `--rules` 保持兼容 no-op，但从 canonical surface 隐藏

旧调用继续执行原有 Service 创建逻辑并输出 deprecated warning；参数值继续不参与读取、验证或持久化。主题帮助与 bootstrap guide 改用不含 `--rules` 的 canonical usage，并说明 Service 规则入口是 Service 目录中的 `AGENTS.md`。

备选方案一是删除参数，会无必要地破坏旧自动化；备选方案二是恢复其路径语义，会重新引入 specs 已禁止的第二套 Rule source pointer。两者都不采用。

### 4. `package:<id>` 只定义为内部 source reference

保留 parser、package manifest `skillSources` 和 runtime resolver 现状。文档明确它不是 Skill id、不是通用 URL scheme，也不是 `skills add` 的用户输入；普通用户 authoring 继续使用 local `path`、remote `source`/`resolved` 等公开模型。

备选方案是删除 parser。虽然当前默认 baseline 已主要使用 `source: buildr` ownership label，但 canonical package spec 仍保留条件式 `skillSources` 引用能力，删除会改变数据语义且超出本 change。

### 5. Canonical 输出永不产生 legacy 形式

兼容输入仅在解析时存在。help、bootstrap、doctor repair command、README 和 current-state canonical 示例必须使用当前形式；测试分别覆盖“旧输入仍兼容”和“新输出不推荐旧形式”。

## Risks / Trade-offs

- [根帮助分区仍会让 internal 命令可见] → 使用明确标题和用途说明，避免把“可发现”误解为普通 workspace API。
- [只用文档和测试而无机器可读 registry，未来仍可能漂移] → 将关键不变量纳入 package check/E2E；未来命令数量显著增长时再单独评估生成式 CLI reference。
- [`--rules` no-op 可能让旧调用者误以为路径仍生效] → 每次使用都输出明确 deprecated warning，并在 Service 主题帮助说明 canonical `AGENTS.md` 约定。
- [legacy 数据迁移与 unsupported layout 容易混淆] → 分类表显式区分“仍接受/收敛”和“明确拒绝”，不把 `organizations/<org>/` 描述为兼容能力。

## Migration Plan

1. 先更新 help 与 canonical bootstrap 示例，不改变 dispatch 和数据写入逻辑。
2. 同步产品说明、current-state knowledge、README 与维护文档中的分类。
3. 补充/调整定向验证，确认旧 `--rules` 调用仍成功并 warning，canonical 输出不再包含该参数，internal 命令仍可执行且主题帮助准确。
4. 运行产品受影响验证与最终完整验证。回滚只需恢复 help/docs/tests；实现数据和 workspace 无需迁移。

## Open Questions

无。现有代码、canonical specs 和测试足以裁决本 change 的分类；公开 API 稳定性等级和命令 registry 生成属于后续独立议题。
