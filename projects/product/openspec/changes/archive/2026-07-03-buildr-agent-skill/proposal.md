## Why

Buildr 现在依赖 `buildr bootstrap guide` 让 Agent 学会使用 Buildr，但这个入口仍然停留在 CLI 文本指南层，无法作为 Agent runtime 中可发现、可复用的 Skill 能力存在。

下一步需要把 Buildr 自身沉淀为产品随包的 Agent Skill，并纳入现有 `buildr skills render ...` 体系，同时保持 `buildr init` 纯粹，只创建 workspace 源资产，不自动写入某个 Agent runtime。

## What Changes

- 新增 Buildr 产品内置 Agent Skill 概念，用于表达随 Buildr 产品发布、面向 Agent 的 Skill 源资产。
- 在 `product/package/` 下声明产品内置 Agent Skill 源位置，建议路径为 `product/package/agent-skills/buildr/SKILL.md`。
- 扩展 package manifest，使产品随包资产能够显式声明内置 Agent Skills，而不是把它们混入用户 workspace `skills/`。
- 扩展现有 `buildr skills render <agent>` 体系，使它能够渲染 Buildr 产品内置 Agent Skill 和 workspace/root/project Skills。
- 复用并沉淀 bootstrap guide 的 Agent-facing 使用流程到 Buildr Skill：`init`、`doctor`、`project create`、`service create`、runtime check/render 和可复用信息保存。
- 保持 `buildr init` 行为纯粹：初始化只生成 Buildr workspace 源资产，不自动渲染 `.claude/skills/`、`CLAUDE.md` 或其他 Agent runtime。
- 不新增 `buildr bootstrap install-skill` 或等价安装命令。

## Capabilities

### New Capabilities

- `product-agent-skills`: 定义 Buildr 产品随包内置 Agent Skills 的资产位置、manifest 声明、渲染边界和验证要求。

### Modified Capabilities

- `agent-first-onboarding`: 允许 Agent 通过 Buildr Skill 复用 bootstrap guide 的 onboarding 流程，同时保持 bootstrap guide 作为首次发现入口。
- `buildr-package-assets`: package manifest 需要声明产品内置 Agent Skills，并确保它们不被当作用户 workspace 源资产初始化。
- `workspace-first-runtime-projection`: Skills runtime 投射需要区分产品内置 Agent Skills 与 workspace/root/project Skills。

## Impact

- 影响 `product/package/manifest.yml` 的结构和 `buildr package check` 校验范围。
- 影响 `product/package/` 随包资产目录，新增产品内置 Agent Skill 源文件。
- 影响 `product/tools/buildr` 中 `skills render`、可能的 `runtime check` 和 package manifest 读取逻辑。
- 影响 `product/package/bootstrap/guide.md`、产品手册和 Agent runtime adapter 文档。
- 不改变 `buildr init` 的初始化边界，不新增 bootstrap install-skill 命令。
