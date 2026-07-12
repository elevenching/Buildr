## Context

Buildr 的默认 workspace baseline 目前由多个并列路径承载：`package/workspace-rules/`、`package/workspace-skills/`、`package/README.workspace.md` 和 `package/workspace.baseline.yml`。这些路径都通过 `package/manifest.yml` 映射到用户 workspace，但 package 目录本身没有体现它们共同属于 init baseline。

这次调整仍以 manifest 为唯一契约，不让 `package/` 根目录直接模拟用户 workspace。`package/workspace/` 表达 init baseline 源资产的空间关系。

## Goals / Non-Goals

**Goals:**

- 将 workspace baseline 源资产集中到 `package/workspace/`，包括 `.gitignore` 模板。
- 将 Project 规则模板放在 `package/workspace/projects/`，体现 Project 是 workspace 的下一层级。
- 将 package 维护说明放到 `package/README.md`，避免未映射 README 混入 workspace baseline 源目录。
- 保持 `package/manifest.yml` 继续显式声明每一个生成映射。
- 保持 `buildr init` 和 `buildr project create` 生成的用户目录结构不变。
- 更新 package check、MVP 验证和文档引用。

**Non-Goals:**

- 不引入新的 `buildr init` 或 `buildr project create` 行为。
- 不把 `.claude/`、`CLAUDE.md` 等 runtime 产物纳入 baseline。
- 不重整 `docs/` 和 `openspec/knowledge/` 的整体结构。
- 不新增 `package/baseline/project/` 层级；Project 模板源先归入 workspace 的 `projects/` 容器。

## Decisions

1. 使用 `package/workspace/` 作为 workspace baseline 的 canonical source。

   这样可以让人直接从路径看出这些资产对应 init 后 workspace root，而不是散落在多个 package 顶层目录中。

   OpenSpec 工作流规则作为默认 workspace 规则模块，源文件位于 `package/workspace/rules/openspec.md`，由 manifest 映射到用户 workspace 的 `rules/openspec.md`。

2. Project `AGENTS.md` 模板源放入 `package/workspace/projects/AGENTS.project.md`。

   Project 是 workspace 下一层级。将 project 模板源归入 workspace baseline 的 `projects/` 容器，比单独创建独立 project baseline 目录更符合当前讨论的目录心智。

3. 保留 `package/manifest.yml` 的显式映射，不改为目录整体复制。

   manifest 仍然是发布边界和生成目标的唯一契约。即使 baseline 源目录更像 workspace，也不允许未声明文件静默进入用户 workspace。`package check` 需要拒绝 `package/workspace/` 下未被 manifest 显式映射的文件。

4. Runtime 产物继续排除在 baseline 之外。

   `.claude/skills/` 和 `CLAUDE.md` 由 `skill install`、`rules render`、`skills render` 生成或检查，不作为 init 源资产。`package/workspace/gitignore` 是 workspace `.gitignore` 的 baseline source；已有 `.gitignore` 时 CLI 仍只 append 缺失项，不覆盖用户内容。source 文件不使用 `.gitignore` 文件名，避免 npm 打包时被特殊处理而漏进 tarball。

## Risks / Trade-offs

- 旧路径引用遗漏 -> 使用 `rg` 全量搜索旧路径，并运行 package check、MVP 验证和 OpenSpec strict validate。
- package check 与文档同步漂移 -> 同步更新 `tools/buildr`、`tools/verify-buildr-product-mvp`、README、package 文档和相关 spec。
- 空目录无法在 Git 中表达 -> 仍由 manifest 的 `workspaceDirectories` / `projectDirectories` 生成空目录，不使用 `.gitkeep`。
