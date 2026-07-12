## 目标

用户让 Agent 升级 Buildr 时，Agent 能把最新 Buildr 产品入口和产品能力同步到当前 workspace，并让 Claude Code、Codex 两个 runtime 可用。

“最新 Buildr 产品”包含：

- Buildr CLI 入口。
- 产品内置 Buildr Skill。
- Buildr 内置 Rules、Skills、Commands。
- Claude Code 和 Codex adapter 投射。

## 核心模型

Buildr workspace 分四层：

```text
Buildr 基础能力层    rules/buildr/core.md
Buildr 推荐能力层    rules/buildr/* 中除 core 外的项  skills/buildr/*  commands/manifest.yml 中 source=buildr 的项
用户组织资产层       AGENTS.md  rules/  skills/  commands/manifest.yml  projects/  services.yml
Agent runtime        CLAUDE.md  .claude/skills/  .agents/skills/
```

`AGENTS.md` 不改名，继续作为每个 scope 的规则入口。Codex 原生读取 `AGENTS.md`；Claude Code 由 adapter 生成 `CLAUDE.md`，只桥接对应 scope 的 `AGENTS.md`。`@` 只是 Claude Code runtime 输出格式，不进入 Buildr 源资产语义。

产品内置 Buildr Skill 是入口，不属于 `skills/buildr/`。它由 `buildr update` 或 `buildr skill install <agent>` 安装到对应 Agent runtime，用来让 Agent 理解 Buildr CLI、update/sync/render 和内置能力同步逻辑。

## Rules 模型

Rules 只承载每次会话都必须遵守的约束、边界、安全规则和资产读取规则。某类任务才需要的流程、操作手册或工作流应进入 Skills。

目录：

```text
AGENTS.md
rules/
  manifest.yml
  buildr/
    core.md
    git-safety.md
  team-review.md
```

根 `AGENTS.md` 必须包含 Buildr required block，只引用 `rules/buildr/core.md`：

```md
<!-- buildr:required begin -->
请读取并遵循 [Buildr Core](rules/buildr/core.md)。
<!-- buildr:required end -->
```

`rules/buildr/core.md` 是唯一 required Rule：

- 不能卸载。
- 不建议用户修改。
- 缺失或损坏时 `update/sync` 直接恢复。
- 规定 Rules 以 `rules/manifest.yml` 为事实清单，并按 manifest 顺序读取 enabled rules。

`rules/manifest.yml` 管理内置和用户规则：

```yaml
schemaVersion: buildr.rules/v1
rules:
  - id: buildr-core
    source: buildr
    path: rules/buildr/core.md
    description: Buildr workspace 基础契约；每次进入 workspace 都必须读取。
    enabled: true
    required: true

  - id: buildr-git-safety
    source: buildr
    path: rules/buildr/git-safety.md
    description: 当用户要求 commit、push、merge、发布，或任务进入提交前检查时读取。
    enabled: true
    required: false

  - id: team-review
    source: workspace
    path: rules/team-review.md
    description: 当用户要求代码评审、方案评审或 review 输出时读取。
    enabled: true
```

Rules manifest 字段语义：

| 字段 | 含义 |
|------|------|
| `id` | 稳定规则 id，用于诊断、卸载、恢复和冲突判断。 |
| `source` | 规则来源；`buildr` 表示 Buildr 内置，`workspace`/`project`/`service` 表示用户组织资产。 |
| `path` | 规则文件路径。 |
| `description` | 适用场景和用途，供 Agent 判断何时读取；不写规则正文。 |
| `enabled` | 是否参与当前 scope 的规则加载。 |
| `required` | 是否为不可卸载的基础规则；首版只有 `buildr-core` 为 `true`。 |

`description` 必填。Agent 新增或安装规则时，应填写“什么任务、行为或风险场景下读取此规则”，而不是复述规则内容。

规则读取采用渐进式披露：先读 `AGENTS.md` 和 `rules/buildr/core.md`，再读 `rules/manifest.yml`；required 规则必须读取，optional 规则按 `description` 判断是否适用。规则顺序由 manifest 数组决定；`source: buildr` 的内置规则排在用户规则之前。`rules/` 下的 `.md` 文件必须登记到 manifest；登记缺文件或未登记文件都由 doctor 报 warning。`rules/buildr/` 下未登记文件视为更高优先级的污染风险。

## Skills 模型

Skills 承载按任务触发的流程、操作手册和工作流。内置和用户 Skills 共用 `skills/manifest.yml`：

```yaml
skills:
  - id: buildr-openspec-propose
    source: buildr
    path: skills/buildr/openspec-propose
    enabled: true
    required: false
    runtimes: [claude-code, codex]

  - id: team-review
    source: workspace
    path: skills/team-review
    enabled: true
    runtimes: [claude-code, codex]
```

`skills/buildr/*` 只是 Buildr 内置 Skill 的源目录。产品入口 `buildr` Skill 不进入 `skills/manifest.yml`。

`skills/` 下的 Skill 目录必须登记到 manifest；登记缺目录或未登记目录都由 doctor 报 warning。`skills/buildr/` 下未登记目录视为更高优先级的污染风险。

## Commands 模型

Commands 只声明外部命令行工具，不承载流程说明，也不自动安装本机工具。内置和用户 Commands 共用 `commands/manifest.yml`：

```yaml
commands:
  - id: openspec
    source: buildr
    enabled: true
    required: false
    installHint: 使用项目约定安装 OpenSpec CLI。

  - id: gh
    source: workspace
    enabled: true
    installHint: 使用 GitHub CLI 官方安装方式。
```

Commands 没有 `commands/buildr/` 文件层，也没有目录文件对齐问题。doctor 只检查 manifest 结构、重复 id、本机命令状态和 install hint。

## 内置能力状态

内置能力状态记录在对应 manifest 中，不新增 `.buildr/builtins.yml`。

状态语义：

- `installed`: 已启用并由 Buildr 管理；如果声明了 hash/version，可用于过期判断。
- `modified`: 本地内容偏离 Buildr 产品版本；`update/sync` 不静默覆盖，提示 restore 或 keep。
- `uninstalled`: 用户显式卸载 optional 内置项；doctor 默认 info，update 不还原。
- `missing`: manifest 期望存在但文件缺失；required 项由 `update/sync` 恢复，optional 项提示 restore。

optional 内置 Rule/Skill 卸载时删除源文件和 runtime 投射，只在 manifest 中保留 `enabled: false`、`state: uninstalled` 和可选 `reason`。optional 内置 Command 卸载时只更新 `commands/manifest.yml`。

内置能力可以不声明 version/hash。未声明时 doctor 只检查存在性和结构有效性，不因无法判断版本输出 warning。

## 命令设计

### update

```bash
buildr update --target <dir>
buildr update check --target <dir> --json
```

`update` 同步产品入口和内置能力：

- 检查或更新 CLI 入口。
- 重新安装或更新产品内置 Buildr Skill；其 description 和正文必须能感知“更新 Buildr”意图。
- 同步 package 声明的内置 Rules、Skills、Commands 到对应 manifest。
- 恢复 required 能力和根 `AGENTS.md` required block。
- optional 内置项已卸载时不还原，已修改时不覆盖。

`update` 不自动安装外部命令行工具，不覆盖用户正文，不接管用户自定义资产。

### builtin

```bash
buildr builtin list --target <dir> --json
buildr builtin uninstall <id> --target <dir> [--reason <text>]
buildr builtin restore <id> --target <dir>
```

`builtin uninstall` 只适用于 optional 内置能力。`builtin restore` 从当前产品包恢复指定内置项，并重新启用 manifest 记录。

### render

```bash
buildr render codex --target <dir> [--scope <scope>]
buildr render claude-code --target <dir> [--scope <scope>]
```

`render` 是 adapter 投射命令：

- Codex：不生成规则桥接文件，确认 scope `AGENTS.md` 可被原生读取，并投射 Skills 到当前 Codex 打开项目根目录的 `.agents/skills/`。
- Claude Code：生成 `CLAUDE.md`，用 Claude Code runtime 格式桥接 scope `AGENTS.md`，并投射 Skills 到 `.claude/skills/`。

未来其他 Agent 的 include 或桥接格式由对应 adapter 处理。

### sync

```bash
buildr sync codex --target <dir>
buildr sync claude-code --target <dir>
```

`sync` 是 Agent 主路径：

1. `update check`
2. `doctor --json`
3. 必要兼容提示
4. `render <agent>`
5. 再次 `doctor --json`

遇到 modified optional 内置能力、manifest 对齐问题或外部命令安装需求时，sync 必须在破坏性动作前停止，让用户决策。

## Agent 适配器

### Codex

首版目标按当前产品认知和用户确认设计：

- 规则入口：scope `AGENTS.md`。
- Skills runtime：当前 Codex 打开项目根目录下的 `.agents/skills/<skill-id>/`。
- Skill 单元：包含 `SKILL.md` 的目录。

实施前必须用当时最新的 OpenAI/Codex 官方文档或当前 Codex 实机行为验证 `.agents/skills` 的扫描范围、目录结构和 frontmatter 要求，并把验证结果写入 adapter 测试或产品 current-state。

### Claude Code

Claude Code adapter 目标：

```text
CLAUDE.md
.claude/skills/<skill-id>/SKILL.md
.claude/skills/<skill-id>/...
```

`CLAUDE.md` 只桥接 scope `AGENTS.md`；源规则如何读取和排序由 `AGENTS.md`、`rules/buildr/core.md` 和 `rules/manifest.yml` 决定。

## 升级兼容

MVP 阶段不实现专门的 `migrate` 命令。

已有 workspace 升级时：

1. 如果 `AGENTS.md` 缺少或破坏 Buildr required block，`update/sync` 只恢复该 block。
2. `update/sync` 不覆盖 `AGENTS.md` 用户正文。
3. 现有 `package/workspace/AGENTS.md` 主体迁入 `rules/buildr/core.md`。
4. 现有产品发布的 `rules/*.md` 迁入 `rules/buildr/`，并登记到 `rules/manifest.yml`。
5. `runtime.md` 不再作为独立规则文件，内容内化进 `core.md`。

## Package Manifest

`package/manifest.yml` 声明 Buildr 发布哪些内置能力，例如：

```yaml
builtins:
  rules:
    - id: buildr-core
      path: package/builtins/rules/core.md
      targetPath: rules/buildr/core.md
      description: Buildr workspace 基础契约；每次进入 workspace 都必须读取。
      required: true
    - id: buildr-git-safety
      path: package/builtins/rules/git-safety.md
      targetPath: rules/buildr/git-safety.md
      description: 当用户要求 commit、push、merge、发布，或任务进入提交前检查时读取。
      required: false
  skills:
    - id: buildr-openspec-propose
      path: package/builtins/skills/openspec-propose
      targetPath: skills/buildr/openspec-propose
      runtimes: [claude-code, codex]
      required: false
  commands:
    - id: openspec
      required: false
      manifestEntry:
        installHint: 使用项目约定安装 OpenSpec CLI。
```

首版可兼容现有 `agentSkills`、`skillSources` 和 workspace baseline 字段，但规格上应收敛到内置能力模型。产品入口 Buildr Skill 继续通过 `agentSkills` 或等价入口声明，不放入 `builtins.skills`。

## 非目标

- 不实现外部 command 自动安装。
- 不实现复杂 override/merge 语言。
- 不支持除 Claude Code 和 Codex 以外的 adapter。
- MVP 阶段不实现专门的 `migrate` 命令。
- 不把 service repo 变成默认 runtime 入口。
- 不把用户个人配置、token、cookie、登录态纳入 Buildr 管理。

## 风险与缓解

- 风险：Rules 和 Skills 边界模糊。缓解：只有每次会话必须遵守的内容进入 Rules，任务流程进入 Skills。
- 风险：required core 被用户破坏。缓解：`update/sync` 只恢复 required block 和 `rules/buildr/core.md`，不动用户正文。
- 风险：optional 内置能力被 update 覆盖。缓解：modified 默认不覆盖，要求用户选择 restore 或 keep。
- 风险：已卸载项反复提示。缓解：卸载状态留在对应 manifest，doctor 默认 info。
- 风险：Codex skills 路径变化。缓解：实施前用最新官方文档或实机行为验证，并把验证用例随 adapter 维护。
