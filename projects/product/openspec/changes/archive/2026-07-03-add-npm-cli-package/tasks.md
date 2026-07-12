## 任务

- [x] 在 Buildr 根目录新增 npm package metadata，并声明严格 files whitelist 和 `buildr` bin entry。
- [x] 确保 npm-packed files 包含 CLI、package assets 和可发布 rules，同时排除私有 workspace/runtime assets。
- [x] 扩展 product verification，运行 `npm pack`，将 tarball 安装到临时 prefix，并执行已安装的 `buildr` 命令。
- [x] 运行 `npm pack`/install verification、`./buildr package check`、`product/tools/verify-buildr-product-mvp` 和 `cd product && openspec validate --all --strict`。
