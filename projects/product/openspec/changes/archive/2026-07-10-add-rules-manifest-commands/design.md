## Context

当前 Buildr 已经将 root Rules 建模为 `AGENTS.md`、`rules/manifest.yml` 和 `rules/`，doctor 会检查规则清单结构、缺失文件、未登记文件和 description 缺失。但用户新增或删除组织级 Rule 时仍需要手工维护 manifest，容易出现源资产漂移。

现有 spec 还保留了“`rules add/remove` 不存在”的要求，这是旧决策：当时 Rule 被视为自由文本资产，CLI 如果试图替 Agent 改写 `AGENTS.md` 或做任务路由会制造错误抽象。现在我们收敛出更清楚的边界：Buildr CLI 只约束资产边界和 manifest 完整性，不替 Agent 做上下文决策。

## Goals / Non-Goals

**Goals:**

- 为 root/Organization 级 Rules 提供 `buildr rules add/remove` 维护入口。
- 让 `rules/manifest.yml` 成为规则资产目录、语义索引和完整性约束。
- 明确 Rule/Skill 分层：Rule 控制 Agent 的价值观、边界和约束；Skill 封装可复用专业动作。
- 保留 Agent 基于用户目标、代码语义、修改范围和 Rule description 判断相关规则的责任。
- 保护 required Buildr 内置规则，避免误删核心边界。

**Non-Goals:**

- 不实现 Project 级 `rules/manifest.yml`；Project 规则仍通过 `projects/<project>/AGENTS.md` 承载。
- 不引入 `appliesTo.roles`、`appliesTo.paths` 或 service type 路由表。
- 不让 CLI 判断当前任务应该读取哪些 contextual Rules。
- 不让 `rules add/remove` 自动 render Agent runtime。
- 不把操作流程或 playbook 放回 Rules；这仍属于 Skills。

## Decisions

### Decision 1: `rules add/remove` 只支持 root scope

第一版只维护 workspace root 的 `rules/manifest.yml`。Project baseline 当前没有 `rules/manifest.yml` 或 `rules/`，强行支持 project scope 会引入新的资产层级和迁移问题。

替代方案是同时支持 `--scope projects/<project>`。这会让 Project 规则从 `AGENTS.md` 扩展为 `AGENTS.md + rules/manifest.yml + rules/`，属于更大的模型变更，本次不做。

### Decision 2: description 是语义索引，不是结构化路由配置

`rules add` 必须要求 description。description 用于帮助 Agent 判断规则语义是否与当前工作相关，例如“修改后端 API、数据库、鉴权或服务契约时必须遵守”。它不是 `roles`、`paths` 或 `service` 的机器路由表。

替代方案是新增 `appliesTo.roles` / `appliesTo.paths`。这会要求用户在新增服务或目录时提前维护匹配表，违背“CLI 约束边界，而不是替 Agent 做决策”的原则。

### Decision 3: `rules add` 注册已有规则文件

`rules add` 的职责是把 root `rules/*.md` 纳入 Buildr 管理，而不是替 Agent 生成规则内容。Agent 或用户应先创建和编辑规则正文，再用 `rules add` 注册到 `rules/manifest.yml`。

未传 `--path` 时，`rules add <id>` 默认推导路径为 `rules/<id>.md`。这让常见路径简洁，同时保留 `--path` 支持有层级的规则文件，例如 `rules/frontend/ui-boundaries.md`。

替代方案是支持 `rules add --create` 生成模板。该方案会把“写规则正文”和“登记规则资产”混在一起，也会提前决定模板结构。本次不采用。

### Decision 4: `rules remove` 删除规则资产，`--keep-file` 只取消注册

用户语义中的“删除规则”应删除规则文件和 manifest entry，保持 Buildr 源资产集合干净。若用户只想取消登记但保留文件，必须显式使用 `--keep-file`。

`--keep-file` 产生的未登记 Rule 文件应继续由 doctor 报告为 unregistered。这是预期信号，用于提醒 Agent 后续选择重新注册、移动归档或删除。

替代方案是默认只移除 manifest entry。该方案会留下未登记 `.md` 文件，doctor 随后报告 unregistered，形成半删除状态。本次不采用。

### Decision 5: required builtins 仍由 builtin 机制保护

`source: buildr` 且 `required: true` 的 Rule 不能通过 `rules remove` 删除。optional builtin 的卸载仍优先使用 `builtin uninstall`，确保 Buildr 内置能力状态一致。

### Decision 6: `rules add/remove` 不自动 render

Rules 是源资产；runtime 投射仍由 `doctor`、`rules render`、`sync` 或 adapter-specific render 处理。CLI mutation receipt 可以提示下一步，但不能静默写入 `.agents/`、`.claude/`、`CLAUDE.md` 或其他 runtime 产物。

## Risks / Trade-offs

- 误以为 CLI 会替 Agent 选择规则 -> 在 Skill、bootstrap 和 docs 中明确 CLI 只维护资产完整性，Agent 负责上下文判断。
- 手工编辑 manifest 与 CLI 并存导致格式差异 -> 写回时复用现有 manifest renderer，doctor 继续报告未知字段和缺失 description。
- 用户误删仍需保留的规则文件 -> 提供 `--keep-file` 作为显式取消注册路径；Git 仍是恢复误删文件的安全网。
- 第一版不支持 Project rules manifest -> 明确 Project 仍通过 `AGENTS.md` 承载规则入口，后续如需要 Project rules manifest 必须单独变更。

## Migration Plan

本变更不需要迁移现有 workspace。已有 `rules/manifest.yml` 继续有效；用户仍可手工维护 manifest。实现完成后，新增 root 用户 Rule 时推荐先创建 `rules/<id>.md` 再运行 `buildr rules add` 注册；删除 root 用户 Rule 时推荐运行 `buildr rules remove` 同时移除文件和登记。

如果现有文档或 Skill 写着“`rules add/remove` 不存在”，实现阶段需要同步更新这些文本和验证脚本。
