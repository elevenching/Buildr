## Context

当前开发者可以通过仓库根目录 `./buildr` 或 `product/tools/install-buildr-cli` 的 symlink 使用 CLI。这个模式适合 dogfood，但不能验证用户只拿到安装包时是否能完成 Buildr onboarding。

现有 CLI 的路径模型是：

- 根入口 `buildr` import `./product/tools/buildr`。
- `product/tools/buildr` 通过脚本位置推导 Buildr repo root。
- `product/package/manifest.yml` 引用 `product/package/` 和根 `rules/` 中的可发布 assets。

为了减少实现风险，npm tarball 应保留这个运行时布局，而不是在第一步把 CLI 重构成全新的 `bin/` + `dist/` 结构。

## Goals / Non-Goals

**Goals:**

- 维护者可以在 Buildr root 执行 `npm pack` 生成本地 tarball。
- 用户可以执行 `npm install -g ./<tarball>` 或使用临时 `--prefix` 安装后获得 `buildr` 命令。
- 安装后的 `buildr` 能从包内读取 `product/package/` 和 `rules/` assets，完成 init、project create、service create、doctor、runtime check/render 和 package check。
- npm tarball 只包含 CLI 与可发布 assets，不包含 `projects/`、私有业务规则或本地 runtime 目录。

**Non-Goals:**

- 不发布到 npm registry。
- 不引入 TypeScript、bundler 或编译产物。
- 不改变现有 `./buildr` 和 symlink 安装脚本。
- 不解决版本发布、签名、Homebrew 或自动升级。

## Decisions

### 使用外层 root 作为 npm package root

选择在 Buildr root 增加 `package.json`，并通过 `files` 白名单显式纳入 `buildr`、`product/tools/`、`product/package/` 和必要 `rules/` 文件。

理由：

- 保留现有 CLI 的路径假设：`buildr` 位于 package root，`product/tools/buildr` 位于 package root 下。
- 避免在 `product/` 子仓库内复制根 `rules/`，减少双写资产源。
- `files` 白名单比 `.npmignore` 更可控，能明确排除 `projects/`、`rules/AGENTS.acme.md` 和 runtime 目录。

备选方案：

- 在 `product/` 子仓库内做 npm package，并重构 CLI 支持 `package/` 与 `rules/` 的新定位。该方案更干净，但会引入 asset 复制或路径兼容层，超出本轮“先完整测试 Buildr”的目标。
- 使用 prepack 构建临时 dist 包。该方案适合后续发布流水线，但第一步会增加脚本复杂度。

### 使用 npm pack + 临时 prefix 做端到端验证

验证脚本应执行 `npm pack`，再用 `npm install -g --prefix <tmp>` 安装 tarball，并通过 `<tmp>/bin/buildr` 运行完整闭环。

理由：

- 不污染用户全局 npm 环境。
- 能验证 tarball 文件清单、bin shim、包内 asset 定位和 CLI 命令行为。
- 比 `npm link` 更接近真实安装包。

### 包内 CLI 不自动生成 runtime

npm 安装只提供 `buildr` 命令。`buildr init` 仍只生成 workspace 源资产；Agent runtime 仍通过 `runtime check`、`rules render` 和 `skills render` 显式执行。

## Risks / Trade-offs

- [Risk] 外层 root 作为 package root 可能误打入私有业务资产。  
  Mitigation: 使用 `files` 白名单，并在验证中检查 `npm pack --json` 的文件列表不得包含 `projects/`、`rules/AGENTS.acme.md`、`.claude/` 等路径。

- [Risk] 安装包依赖当前 Node 对 extensionless ESM bin 的支持。  
  Mitigation: 在 npm pack/install 验证中直接执行安装后的 `buildr`，失败即暴露兼容问题；如失败再引入 `.mjs` bin wrapper。

- [Risk] `npm pack` 依赖本机 npm 环境。  
  Mitigation: 验证脚本先检测 `npm` 是否可用；缺失时明确失败，提示无法验证安装包。
