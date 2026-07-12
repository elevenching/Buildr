## 1. npm 包根迁移

- [x] 1.1 新增 `product/package.json`，声明 `buildr` bin 和产品包 files 白名单。
- [x] 1.2 移除 root `package.json`，保留 root `buildr` 作为开发 wrapper。
- [x] 1.3 调整 `product/tools/buildr` 的产品 root 与 package root 路径推导。

## 2. package manifest 与验证

- [x] 2.1 将 `product/package/manifest.yml` 源路径改为产品 root 相对路径。
- [x] 2.2 更新 package check 对 manifest 源路径和 root 安装副本漂移的校验。
- [x] 2.3 更新 `product/tools/verify-buildr-product-mvp` 使用 `npm pack product/` 并检查新包文件清单。

## 3. 本地命令与文档

- [x] 3.1 更新 `product/tools/install-buildr-cli` 和 `uninstall-buildr-cli` 指向产品 CLI 入口。
- [x] 3.2 重新安装本机 `buildr`/`buildr-dev` 命令行工具并确认指向新入口。
- [x] 3.3 更新 root README、product README 和 npm package OpenSpec 主规范。

## 4. 验证

- [x] 4.1 运行 `buildr-dev package check`。
- [x] 4.2 运行 `product/tools/verify-buildr-product-mvp`。
- [x] 4.3 运行 `cd product && openspec validate move-npm-package-to-product --strict`。
- [x] 4.4 运行 `git diff --check && git -C product diff --check`。
