## Context

Buildr 已经有三类相关能力：

- 命令行工具资产：root 级 `commands/manifest.yml`、`commands check` 和 doctor 聚合。
- Skills 资产：workspace/project 级 `skills/manifest.yml`、`skills/<skill-id>/` 和 `skills render`。
- 规则资产：`AGENTS.md`、`rules/*.md` 和 `rules render`。

这三类资产职责不同。`commands` 和 `skills` 都有 manifest，适合提供结构化 add/remove 命令；规则资产没有 manifest，且核心入口是自由文本规则文档，继续由 Agent 直接编辑更符合现有模型。

本变更只维护 Buildr 源资产，不触碰 Agent runtime 投射产物。运行环境同步仍由 render、runtime check 和 doctor 完成。

## Goals / Non-Goals

**Goals:**

- 为 root 级命令行工具 manifest 提供 `commands add/remove`。
- 为 workspace/project 级 Skills manifest 和 Skill 目录提供 `skills add/remove`。
- 收紧命令行工具 manifest 字段：使用 `installHint`，新增 `description`，不定义独立命令文档结构。
- 让 add/remove 输出中文、行为级下一步，方便 Agent 按 Buildr Skill 继续编排。
- 明确不提供 `rules add/remove`。

**Non-Goals:**

- 不实现 `rules add/remove`。
- 不实现 command 或 skill 的局部 update/patch 命令。
- 不让 add/remove 自动运行 check、doctor、render 或 runtime check。
- 不为 add/remove 增加 `--json`。
- 不改变现有 scope 模型：commands 仍为 root 级；skills 仍为 workspace/project 级。
- 不实现 service 级源资产支持、叠加/覆盖、来源链或权限控制。

## Decisions

### 1. 只给 manifest-backed 资产提供 add/remove

`commands` 和 `skills` 有清晰 manifest：

```text
commands/manifest.yml
skills/manifest.yml
```

CLI 可以稳定新增、替换、删除条目。规则资产没有 manifest，`AGENTS.md` 和 `rules/*.md` 是自由文本源资产；`rules add/remove` 要么只能做低价值文件复制，要么需要不可靠地改写 `AGENTS.md`。因此本次不提供 `rules add/remove`。

### 2. commands add 是完整声明写入，不是 YAML patch

`commands add` 支持当前 spec 定义的结构化字段：

```yaml
schemaVersion: buildr.commands/v1
commands:
  - id: lark-cli
    executable: lark-cli
    purpose: 团队用于访问飞书开放能力的标准命令行工具
    description: 需要用户在本机完成认证。
    version:
      constraint: ">=0.1.0"
      args: ["--version"]
    installHint: 官方安装文档：https://example.com/lark-cli
```

`purpose` 必填，`executable` 默认等于 `id`。`description` 和 `installHint` 用于承载说明，不再提供 `commands/<id>.md` 或 `COMMAND.md` 之类的独立文档结构。

`commands add --replace` 是整项替换，不做局部更新。替换时保留原 manifest 位置，降低 diff 噪音。

### 3. skills add 是装载完整 Skill 源目录

Skill 的内容才是资产本体，Buildr 不应该凭空生成一个看似可用的 Skill。因此 `skills add` 必须提供 `--source <skill-dir>`。

source 目录必须包含 `SKILL.md`，并从 `SKILL.md` frontmatter 的 `name` 自动确定 Skill id。Buildr 装载的目录结构只包括：

```text
SKILL.md
scripts/
templates/
assets/
examples/
references/
```

未知顶层内容默认报错，避免把 `node_modules/`、`.git/`、临时文件或未归类文档误装载成长期源资产。用户明确确认可跳过时，可以使用 `--ignore-unsupported`。

如果 source 已经位于目标 `skills/<skill-id>/`，`skills add` 只登记 manifest，不复制目录。这个场景支持 Agent 先直接写好 Skill 目录，再用 CLI 登记到 manifest。

### 4. skills remove 删除目录级源资产

Skill 是目录级资产。`skills remove <id>` 删除 manifest item，并在安全校验后删除对应 `skills/<skill-id>/` 目录。安全校验必须确保 path 是当前 scope `skills/` 下的相对目录，且没有被多个 manifest item 共享。

remove 不删除 `.claude/skills/` 等 runtime 投射产物。删除源资产后，Agent 根据输出提示决定是否 render 或 runtime check。

### 5. add/remove 只输出中文行为级下一步

add/remove 是写入命令，不是事实状态接口。本次不增加 `--json`。结构化状态仍由 `commands check --json`、`doctor --json` 或未来 list/query 命令提供。

输出必须是中文 Agent-readable 回执，包含：

- 已添加/替换/删除的源资产。
- 已更新的源文件或目录。
- 下一步行为建议。

下一步建议描述行为，不硬编码 `claude-code` 或其他 Agent adapter 命令。例如 Skills add/remove 后建议“如果当前 Agent 需要 Skills 投射，将 workspace/project Skills render 到当前 Agent runtime”。

### 6. add/remove 要求已初始化 workspace

`commands add/remove` 和 `skills add/remove` 维护的是 Buildr workspace 源资产，必须要求 `--target` 指向已经 `buildr init` 的目录。命令不得在普通目录里创建半套 `commands/` 或 `skills/`。

在已初始化 workspace 内，如果对应 manifest 缺失，add 命令可以创建或修复 manifest。

### 7. Service 层级源资产支持留给后续统一模型

当前 `skills render` 只支持 workspace/project，`commands check` 只支持 root。虽然后续可能需要 service 层级能力，但这应统一处理 rules、skills、commands、practices 等源资产模块的 scope 解析、叠加/覆盖、来源链和权限模型。本次只在 roadmap 中记录方向。

## Risks / Trade-offs

- [Risk] 用户以为 `skills add` 会生成可用 Skill 内容。 → Mitigation：`skills add` 必须 `--source`，文档明确它是装载已有完整 Skill 源目录。
- [Risk] `commands add --replace` 被误解为局部更新。 → Mitigation：文档和错误信息明确 replace 是整项替换，未声明字段不会保留。
- [Risk] `skills remove` 删除目录造成误删。 → Mitigation：只删除当前 scope `skills/` 下被 manifest 唯一引用的目录，路径异常或共享引用时拒绝。
- [Risk] 不支持 service scope 被认为能力缺失。 → Mitigation：明确本次不改变 scope 模型，并在 roadmap 中记录 service 层级源资产统一支持方向。
- [Risk] 不提供 `--json` 降低自动化能力。 → Mitigation：add/remove 后可通过 `doctor --json`、`commands check --json` 获取结构化状态；未来有批处理需求时再统一补 mutation JSON。

