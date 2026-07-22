## 1. 迁移基线与真实 Service

- [x] 1.1 建立旧 Product package-root 引用 inventory 和迁移白名单，补充结构 verifier 失败用例。
- [x] 1.2 在 Product Service registry 登记 `product/buildr` workspace-source `application` Service，并建立 Service `AGENTS.md`。
- [x] 1.3 验证 CLI、doctor、本机应用能够读取真实 Buildr Service，完成第一组 minimal/affected 检查。

## 2. 可执行产品源码迁移

- [x] 2.1 使用 Git rename 将 package metadata、`bin`、`src`、`test`、`scripts`、`package` 和实现型配置迁入 `services/buildr`。
- [x] 2.2 将 `projects/product/buildr` 收敛为薄兼容 bridge，修复 CLI composition、相对 imports 和 runtime asset 自定位。
- [x] 2.3 更新本机 CLI 安装、自更新和 development checkout source discovery，覆盖主 workspace 与 task worktree。
- [x] 2.4 运行运行时、CLI 架构和 fast integration affected 验证，确认旧 root 不再承载实现。

## 3. 验证、打包与发布迁移

- [x] 3.1 将 Product verification 编排改为从 Project root 读取 OpenSpec、从 Service root执行 package/test，并扩展 candidate identity evidence。
- [x] 3.2 更新 npm pack、package inventory、release smoke 与本地安装入口，保持 `@buildr-ai/buildr` identity。
- [x] 3.3 更新 GitHub Actions、PR checklist 与发布脚本的 working directory 和 cache dependency path。
- [x] 3.4 运行 package、Candidate fixtures、发布和 CI 契约 affected 验证。

## 4. 文档、治理与最终验收

- [x] 4.1 按项目治理与 Service 实现边界迁移文档，更新根 README、AGENTS、current-state knowledge 和所有稳定入口。
- [x] 4.2 初始化 Product `verification.yml` 候选，仅把已确认能力保持为现有政策，不自动升级新门禁。
- [x] 4.3 运行旧路径残留审计、OpenSpec strict、doctor 和桌面本机应用验收，确认真实 Service 可见。
- [x] 4.4 用户确认迁移结构后冻结候选并运行 Product Candidate。
