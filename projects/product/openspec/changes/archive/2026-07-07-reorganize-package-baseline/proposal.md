## Why

当前 workspace 初始化 baseline 分散在 `package/workspace-rules/`、`package/workspace-skills/`、`package/README.workspace.md` 和 `package/workspace.baseline.yml`。这些文件实际共同描述 init 后 workspace 的默认资产，但目录命名没有体现它们都是 workspace baseline 源，导致 package 发布资产与用户 workspace 产物之间的映射不够直观。

现在需要将 workspace baseline 源收敛到 `package/workspace/`，继续由 `package/manifest.yml` 作为唯一映射契约。Project 模板源也放在 `package/workspace/projects/` 下，表达 Project 是 workspace 的下一层级。该调整不包含破坏性 CLI 行为变更。

## What Changes

- 将默认 workspace 规则、默认 workspace README、`.buildr/workspace.yml` 模板、`.gitignore` 模板和默认 workspace Skills baseline 移动到 `package/workspace/`。
- 将 project `AGENTS.md` 模板移动到 `package/workspace/projects/`，表达 Project 是 workspace 下一层级。
- 将 package 维护说明放到 `package/README.md`；根 `AGENTS.md` 记录 `package/workspace/` 只保留 manifest 映射源文件的维护规则。
- 更新 `package/manifest.yml` 的 `workspaceFiles` 和 `projectFiles` source 路径，保持 manifest 仍是 init/project create 的唯一映射契约。
- 更新 package check、MVP 验证脚本和产品文档中的旧路径引用。
- 保持 runtime 产物不进入 baseline；`.claude/` 和 `CLAUDE.md` 仍由 adapter render/install 生成。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `buildr-package-assets`: 调整默认 workspace/project baseline 源目录规范，从旧的 `package/workspace-rules/`、`package/workspace-skills/` 收敛为 `package/workspace/`，规则模块包括 `package/workspace/rules/openspec.md`。

## Impact

- 影响 `package/manifest.yml`、`tools/buildr`、`tools/verify-buildr-product-mvp` 和相关文档引用。
- 影响 package baseline 源文件路径；不改变用户执行 `buildr init`、`buildr project create` 后生成的目标目录结构。
- 需要运行 `./buildr package check`、`tools/verify-buildr-product-mvp` 和 `openspec validate --all --strict`。
