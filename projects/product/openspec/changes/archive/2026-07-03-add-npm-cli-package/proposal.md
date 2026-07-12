## Why

Buildr 当前只能通过仓库 checkout 或 symlink 脚本使用 CLI，无法验证“用户只拿到安装包后是否能完整初始化并使用 Buildr”。为了完整测试 Buildr，需要先提供可通过 npm tarball 本地安装的 `buildr` 命令。

## What Changes

- 新增 npm CLI package 元数据，使维护者可以执行 `npm pack` 生成本地安装 tarball。
- 将 `buildr` 命令作为 npm `bin` 暴露，支持 `npm install -g ./<tarball>` 后在任意目录调用。
- 确保 CLI 在 npm 包内读取随包 assets，而不是依赖完整开发仓库 checkout。
- 增加验证脚本覆盖 `npm pack`、本地全局安装、`buildr init`、`project create`、`service create`、`doctor`、runtime check/render 和 package check。

## Capabilities

### New Capabilities

- `npm-cli-package`: 定义 Buildr CLI 作为 npm package 本地打包、安装和验证的行为。

### Modified Capabilities

- 无。

## Impact

- 影响 Buildr root 的 npm package metadata、CLI bin 入口、包内 assets 布局和产品验证脚本。
- 不引入 registry 发布流程，不要求立即发布到 npm public registry。
- 不改变现有 `./buildr` 和 `product/tools/install-buildr-cli` 的开发者 symlink 使用方式。
