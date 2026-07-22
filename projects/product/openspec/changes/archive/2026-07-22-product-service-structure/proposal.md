## Why

Buildr 自举 Product 当前把项目治理资产与可执行产品源码、npm package、验证和发布实现全部混放在 `projects/product/`，导致自身没有真实 Service，无法用 Product → Service 模型管理和验证 Buildr。现在需要把 Buildr 的可执行实现登记并迁入真实 `application` Service，同时保留 Project 作为产品治理与跨服务协调边界。

## What Changes

- **BREAKING** 将 Buildr npm package、CLI、运行源码、测试、脚本和随包资产的源码根迁移到 `projects/product/services/buildr/`。
- 在 Product Service registry 中登记 `product/buildr`，名称为“Buildr”，类型为 `application`，来源为 workspace 内真实路径。
- Product Project 根保留 `AGENTS.md`、OpenSpec、`capabilities.yml`、`commands.yml`、可选 `verification.yml` 和项目级产品文档；不把治理资产降级为 Service 实现内容。
- 保留 `projects/product/buildr` 作为开发 checkout 的兼容桥接入口，并让 CLI 自定位、更新、doctor、安装和 task worktree 流程识别新的 Service package root。
- 更新 npm 打包、Candidate、发布 CI、开发脚本、公开文档与自举入口，使构建、测试和发布从真实 Service 执行，同时 Project 级验证继续组合 OpenSpec 与 Service 实现。
- 采用分阶段迁移与 focused/affected/Candidate 门禁，不通过复制源码或登记空壳 Service 制造双重事实源。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-source-layout`: 将 Product Project 治理根与 Buildr 可执行 Service 源码根分离，并规定唯一源码所有权和兼容入口边界。
- `service-asset-indexing`: 为 Buildr 自举 Product 登记真实 workspace-source `application` Service，并保持 Service metadata、路径和规则入口契约。
- `npm-cli-package`: 让开发 checkout、npm 打包和 CLI 自定位支持新的 Service package root，同时保留公开开发入口兼容性。
- `buildr-development-openspec`: 区分 Product OpenSpec planning root 与 Service verification/package root，并保持隔离候选验证。

## Impact

- 目录与源码：`projects/product/{src,bin,test,scripts,package,package.json,package-lock.json,buildr}` 及相关配置迁入或桥接到 `projects/product/services/buildr/`。
- Project 事实：更新 `projects/product/services/manifest.yml`、Service `AGENTS.md`、项目与服务文档入口。
- CLI/runtime：更新 source discovery、开发安装、自更新、帮助、路径诊断和 task worktree 假设。
- 验证与发布：更新 npm scripts、Candidate evidence、GitHub Actions、release checklist、package tarball 与路径型契约测试。
- 兼容性：外部用户继续可以从仓库根使用 `projects/product/buildr`；内部硬编码路径迁移到真实 Service root，旧 package root 不再作为第二实现来源。
