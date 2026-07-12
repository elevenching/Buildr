## 1. Baseline 规则源

- [x] 1.1 新增 `product/package/workspace-rules/AGENTS.workspace.md` 作为默认 workspace 规则源。
- [x] 1.2 新增 `product/package/workspace-rules/AGENTS.project.md` 作为默认 project 规则源。
- [x] 1.3 从 root `rules/` 移除 `AGENTS.workspace.md` / `AGENTS.project.md` 产品 baseline 源。
- [x] 1.4 在当前 root 新增 `AGENTS.workspace.md` 作为安装后的 workspace 规则副本。

## 2. CLI 与 manifest

- [x] 2.1 更新 `product/package/manifest.yml`，从 `product/package/workspace-rules/` 引用默认规则源。
- [x] 2.2 更新 `buildr init`，当目标 root 已有 `AGENTS.md` 时写入 `AGENTS.workspace.md` 而不覆盖组合入口。
- [x] 2.3 更新 package check，覆盖已有 root `AGENTS.md` 的兼容初始化场景。
- [x] 2.4 更新 package check，校验当前开发 root 的 `AGENTS.workspace.md` 与产品 canonical baseline 不漂移。

## 3. 文档与验证

- [x] 3.1 更新 README、产品规则、产品手册和 bootstrap guide 中的规则源路径。
- [x] 3.2 更新产品 MVP 验证脚本。
- [x] 3.3 运行 `buildr package check`。
- [x] 3.4 运行 `product/tools/verify-buildr-product-mvp`。
- [x] 3.5 运行 `cd product && openspec validate c-2026-07-05-workspace-rules-baseline --strict`。
- [ ] 3.6 运行 `cd product && openspec validate --all --strict`；当前被未跟踪的 `manage-manifest-backed-assets` change 阻塞，本 change 自身已通过严格校验。
