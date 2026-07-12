## 1. 产品 baseline 与 CLI

- [x] 1.1 从 package manifest 和默认 init baseline 中移除 root `shared/`。
- [x] 1.2 更新 `buildr doctor` scope 解析和默认发现逻辑，移除 `shared` special case。
- [x] 1.3 更新 `doctor --json` 对 root `shared/` 的诊断提示。
- [x] 1.4 更新 package check 和 MVP 验证脚本，覆盖 `projects/foundation` 共享服务项目。

## 2. 文档与规则

- [x] 2.1 更新 bootstrap guide、workspace README、产品手册和产品 docs。
- [x] 2.2 更新 workspace / project / acme 规则中关于 shared service 的路径表述。
- [x] 2.3 更新产品 knowledge 与 specs 中的 shared service 表述。

## 3. 当前 root 迁移

- [x] 3.1 创建 `projects/foundation/` 项目资产。
- [x] 3.2 将 `shared/services.yml` 迁移为 `projects/foundation/services.yml`。
- [x] 3.3 将 `shared/services/*` 移动到 `projects/foundation/services/*`。
- [x] 3.4 更新 `ASSETS.md` 和示例组织业务规则中的服务入口。
- [x] 3.5 删除 root `shared/` 空入口并确认 `.gitignore` 覆盖新路径。

## 4. 验证

- [x] 4.1 运行 `openspec validate c-2026-07-03-project-scoped-shared-services --strict`。
- [x] 4.2 运行 `openspec validate --all --strict`。
- [x] 4.3 运行 `./buildr package check` 和 `product/tools/verify-buildr-product-mvp`。
- [x] 4.4 运行 `buildr doctor --target . --json` 验证当前 root。
