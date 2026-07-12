## Why

Buildr 已经能检查命令行工具清单、渲染 workspace/project Skills，但维护这些 manifest-backed 资产仍主要依赖 Agent 手工编辑 YAML 和目录结构，容易出现字段遗漏、重复 id、路径不一致或改完忘记运行对应检查。

现在需要为有 manifest 的源资产提供稳定 CLI 维护入口：命令行工具使用 `commands/manifest.yml`，Skills 使用 `skills/manifest.yml` 和 `skills/<skill-id>/`。规则资产没有 manifest，继续由 Agent 直接维护 `AGENTS.md` 或 `rules/*.md`，不引入低价值且容易误导的 `rules add/remove`。

## What Changes

- 新增 `buildr commands add/remove`：
  - `commands add <id>` 维护 root 级 `commands/manifest.yml` 中的命令行工具条目。
  - `commands add` 的 `purpose` 必填，`executable` 默认等于 `id`，可选字段包括 `name`、`description`、`version.constraint`、`version.args` 和 `installHint`。
  - `commands add --replace` 使用整项替换语义：如果同 `id` 已存在，使用本次声明完整替换旧条目，并保留原 manifest 位置；不支持局部 update。
  - `commands remove <id>` 只删除 manifest item；删除后为空时保留空 manifest。
  - `commands check` 保持现有检查语义，用于检查 manifest 与本机差异。
- 收紧命令行工具 manifest 模型：
  - 标准安装提示字段使用 `installHint`，不继续使用或兼容旧的 `install` 字段。
  - 新增可选 `description` 字段，用于记录使用边界、认证前提、典型用途等补充背景。
  - 命令行工具资产只由 `commands/manifest.yml` 表达；不定义 `commands/<id>.md`、`commands/<id>/`、`COMMAND.md` 或其他独立命令文档结构。
- 新增 `buildr skills add/remove`：
  - `skills add` 必须通过 `--source <skill-dir>` 装载已有完整 Skill 源目录，不从空白生成 Skill 内容。
  - `skills add` 从 source 目录中 `SKILL.md` frontmatter 的 `name` 自动确定 Skill id；如果命令显式传入 id，必须与 `name` 一致。
  - source 目录必须包含 `SKILL.md`；`SKILL.md` frontmatter 的 `name` 必填，`description` 可用于写入 `skills/manifest.yml` 的摘要字段。
  - `skills add --source <dir>` 将完整 Skill 源资产装载到当前 scope 的 `skills/<skill-id>/`，并更新 `skills/manifest.yml`。
  - 支持的 Skill 源资产结构为 `SKILL.md` 以及可选的 `scripts/`、`templates/`、`assets/`、`examples/`、`references/`；未知顶层内容默认报错，显式 `--ignore-unsupported` 时跳过并在输出中说明未装载内容。
  - 当 source 已经位于目标位置 `skills/<skill-id>/` 时，`skills add` 只登记或替换 manifest item，不复制目录。
  - `skills add --replace` 使用整目录替换语义：外部 source 会整体替换目标 `skills/<skill-id>/` 目录，并保留原 manifest 位置；source 已在目标位置时只替换 manifest item。
  - `skills remove <id>` 删除对应 scope 的 manifest item，并在安全校验后删除对应 `skills/<skill-id>/` 源目录；不删除任何 Agent runtime 产物。
  - `skills/manifest.yml` item 增加可选 `description` 字段，供人和 Agent 快速扫 manifest；真正执行说明仍以 `skills/<skill-id>/SKILL.md` 为准。
- 明确 scope 边界：
  - `commands add/remove/check` 仍只支持 root 级 `commands/manifest.yml`。
  - `skills add/remove/render` 仍只支持 workspace root 和 project scope，不支持 service scope。
  - 本变更不改变现有 scope 模型。
- 明确 workspace 边界：
  - `commands add/remove` 和 `skills add/remove` 必须要求 `--target` 指向已完成 `buildr init` 的 Buildr workspace。
  - 如果 target 不是 Buildr workspace，命令必须报错并提示先运行 `buildr init`。
  - add/remove 可以在已初始化 workspace 内创建或修复缺失的对应 manifest。
- 明确输出边界：
  - add/remove 只维护 Buildr 源资产，不自动运行 check、doctor、render 或 runtime check。
  - add/remove 输出中文 Agent-readable 回执，说明更新了哪些源资产，并给出行为级下一步建议。
  - 下一步建议必须描述行为，不硬编码特定 Agent adapter 命令。
  - 本变更不为 add/remove 增加 `--json`；结构化事实状态继续通过 `commands check --json`、`doctor --json` 或未来查询类命令获得。
- 明确不新增 `buildr rules add/remove`：
  - 规则资产没有 manifest；维护规则继续由 Agent 直接修改当前 scope 的 `AGENTS.md` 或 `rules/*.md`。
  - `rules render` 继续只负责把已有规则源资产投射到需要桥接的 Agent runtime。
- 更新 Buildr Skill、bootstrap guide、产品文档和 roadmap，让 Agent 区分：
  - 有 manifest 的资产由 CLI add/remove 维护。
  - 自由文本规则资产由 Agent 直接编辑源文档。
  - runtime 投射由 render/check 处理。
  - 后续统一评估 service 层级源资产支持：凡是 project 层级支持的源资产模块，后续应明确是否支持 service 层级，并使用一致的 scope 解析、叠加/覆盖、来源链和权限模型。
- 更新 package check 和产品 MVP 验证，覆盖新增 add/remove 命令、manifest 写回、Skill 装载、安全删除和“不提供 rules add/remove”的边界。
- 不包含破坏性变更；已有 `commands check`、`skills render`、`rules render`、`skill install` 语义保持不变。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `command-line-tool-assets`: 增加命令行工具 manifest 条目的 add/remove 维护语义；将安装提示字段收敛为 `installHint`；新增 `description`；移除独立命令文档结构口径；保持不安装、不 render 的边界。
- `product-agent-skills`: 增加 workspace/project Skills 源资产的 add/remove 装载和移除语义；增加 `skills/manifest.yml` item 的可选 `description`；继续区分产品内置 Skill 安装与 workspace/project Skills 维护。
- `root-organization-workspace`: 明确默认规则和 Buildr 引导中不提供 `rules add/remove`；规则资产继续通过文档直接维护；补充 manifest-backed 资产与自由文本规则资产的维护分工。
- `buildr-package-assets`: package check 和产品 MVP 验证需要覆盖新增 manifest-backed 资产维护命令、manifest 标准格式、安全边界和禁用的 rules add/remove 边界。

## Impact

- 影响 Buildr CLI：
  - 新增 `commands add/remove`。
  - 新增 `skills add/remove`。
  - 明确 `rules add/remove` 不存在。
- 影响命令行工具 manifest 标准字段：
  - 使用 `installHint`，不再使用 `install`。
  - 新增可选 `description`。
- 影响 Skills manifest 标准字段：
  - 新增可选 `description`。
- 影响 Buildr 内置 Skill、bootstrap guide、产品 README 或 roadmap 的维护说明。
- 影响 package check 和产品 MVP 验证脚本。
- 不改变已有 runtime adapter 行为；新增命令只维护 Buildr 源资产，不直接写 `.claude/`、`.codex/`、`.cursor/`、`.trae/` 或 `.qoder/`。
- 不改变现有 service scope 能力；service 层级源资产支持作为后续统一方向记录。
