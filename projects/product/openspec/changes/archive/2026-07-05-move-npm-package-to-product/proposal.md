## Why

Buildr 的 npm 发布元数据仍在 workspace root，导致产品发布依赖当前特殊开发 root，而不是独立的 `product/` 产品仓边界。现在随包资产已经收敛到 `product/package/`，npm package root 也应迁入 `product/`，让产品仓可以独立打包、安装和验证。

## What Changes

- 将 npm package metadata 从 root `package.json` 迁到 `product/package.json`。
- 将 npm package 的 `buildr` bin 直接指向产品仓内的 CLI 入口。
- 调整 CLI 路径推导，使 checkout、本地 symlink 安装、npm 安装都以 `product/` 作为产品 root。
- 调整 package manifest 的源路径表达，从产品 root 相对路径引用 `package/` 内资产。
- 更新产品验证脚本，使用 `npm pack product/` 并重新验证安装后的 `buildr`。
- 更新本地安装脚本和 `buildr-dev` 链路，确保开发机命令指向新的产品 CLI 入口。
- **BREAKING**: 维护者不再从 Buildr workspace root 执行 `npm pack`，而应从 `product/` 执行或显式 pack `product/`。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `npm-cli-package`: npm package root 从 Buildr workspace root 改为 `product/` 产品 root。
- `buildr-package-assets`: package manifest 中随包资产源路径改为产品 root 相对路径，不能再依赖外层 workspace 路径。

## Impact

- 影响 root `package.json`、`product/package.json`、root `buildr` wrapper、`product/tools/buildr`、`product/tools/install-buildr-cli`、`product/tools/uninstall-buildr-cli`。
- 影响 `product/package/manifest.yml`、package check、产品 MVP 验证和 npm pack 文件清单断言。
- 影响产品 README、root README 和 OpenSpec 主规范。
