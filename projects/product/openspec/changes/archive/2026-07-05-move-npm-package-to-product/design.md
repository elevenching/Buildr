## Context

当前 npm package metadata 位于 Buildr workspace root，bin 入口为 root `buildr`，再 import `./product/tools/buildr`。这个布局曾用于降低初期 npm 验证风险，但现在产品资产、默认规则源和 package baseline 已经迁入 `product/package/`，继续从外层 root 打包会让产品发布依赖当前 dogfood workspace 的特殊结构。

现有 `product/tools/buildr` 通过脚本路径推导 root，再用 `product/package/` 作为 package root。迁入 `product/` 后，CLI 应直接把脚本上两级目录视为产品 root，并使用 `package/` 作为随包资产目录。

## Goals / Non-Goals

**Goals:**

- npm package metadata 位于 `product/package.json`。
- npm package tarball 只包含产品 CLI、产品文档和 `product/package/` 随包资产。
- checkout 中的 root `./buildr` 和开发机 `buildr-dev` 继续可用，但都只是指向产品 CLI 的开发入口。
- 安装后的 npm `buildr` 命令不依赖外层 Buildr workspace root。
- package check 和 MVP 验证覆盖新布局。

**Non-Goals:**

- 不发布到 npm registry。
- 不引入构建产物、bundler 或 TypeScript。
- 不改变用户 workspace 初始化后的目录结构。
- 不改变 `buildr init`、`project create`、runtime render 的用户命令语义。

## Decisions

### 使用 `product/` 作为 npm package root

`product/package.json` 声明 `bin.buildr = ./tools/buildr`，`files` 白名单纳入 `tools/`、`README.md` 和 `package/`。root `package.json` 删除，避免外层 workspace 被识别为 Buildr npm package。

备选方案是保留 root package root 并继续白名单过滤。该方案实现小，但仍让产品发布依赖外层 workspace，不符合当前产品仓边界。

### 保留 root `buildr` 为开发 wrapper

root `buildr` 继续存在，作为当前 workspace 的便捷入口，直接 import `./product/tools/buildr`。本地 symlink 安装脚本改为指向 `product/tools/buildr`，使 `buildr-dev` 与产品 CLI 入口一致。

备选方案是删除 root wrapper。该方案更纯粹，但会破坏当前 workspace 内已有 `./buildr` 使用习惯，收益不足。

### manifest 源路径改为产品 root 相对

`product/package/manifest.yml` 中的源路径从 `product/package/...` 改为 `package/...`。CLI 读取 manifest 时统一以产品 root 解析源路径；安装到用户 workspace 的目标路径保持不变。

备选方案是在 CLI 中兼容 `product/package/...` 和 `package/...` 两套源路径。该方案会延长旧布局生命周期，且容易让 package baseline 再次引用外层 workspace。

## Risks / Trade-offs

- [Risk] 旧的 `npm pack` root 用法失败。  
  Mitigation: 更新规范和验证，明确从 `product/` 打包；产品验证脚本直接执行 `npm pack "$repo_root/product"`。

- [Risk] 本机 `buildr-dev` 仍指向 root wrapper，无法体现新入口。  
  Mitigation: 改造并重新执行安装脚本，使本机命令行工具指向 `product/tools/buildr`。

- [Risk] CLI 路径推导遗漏导致安装包内找不到 `package/manifest.yml`。  
  Mitigation: `product/tools/verify-buildr-product-mvp` 覆盖 npm pack、全局临时安装和安装后 onboarding 闭环。
