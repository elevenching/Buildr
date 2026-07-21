## Why

Buildr 已从以 CLI 为主的原型演进为同时包含领域模型、应用服务、本机 HTTP/UI、Agent runtime 和产品验证的产品，但这些实现仍混合在 `tools/` 下，目录名称与真实职责不一致。Workspace 产品切片已经验证新的分层需求；在继续实现 Project 和 Service 前，需要先建立可长期扩展的产品源码结构，避免功能继续固化旧边界。

## What Changes

- **BREAKING**：彻底移除 `projects/product/tools/` 作为产品源码和验证实现目录，不保留旧内部路径兼容入口。
- 建立 `src/` 产品源码根，按 `domain`、`application`、`infrastructure` 和 `interfaces` 分层，并禁止无明确所有权的通用 `shared/` 大目录。
- 建立 `bin/` 作为 npm `buildr` executable 的薄入口；CLI 命令实现进入 `src/interfaces/cli/`，本机 HTTP/UI 进入 `src/interfaces/local-app/`。
- 建立 `scripts/` 保存 checkout 安装、卸载、发布、分发构建和仓库维护脚本；这些脚本不得成为产品运行时依赖。
- 将仓库测试用例、fixtures、Candidate/Changed/Focus 编排、timing 和 evidence 基础设施统一收敛到 `test/`。
- 逐文件区分“产品命令依赖的 verifier”和“仅供仓库验证使用的 verification”：前者进入 `src/` 并随 npm runtime 交付，后者进入 `test/verification/` 且不得成为安装后 CLI 依赖。
- 保留顶层 `package/` 作为 Buildr 交付源资产目录，并更新 package inventory、安装入口、文档、测试、OpenSpec 路径契约和自动架构门禁。
- 迁移只改变内部源码组织，不改变现有 CLI 命令、参数、help、JSON schema、文件结果、事务、失败回滚和 Agent runtime 行为。

## Capabilities

### New Capabilities

- `product-source-layout`: 定义 Buildr 产品源码、可执行入口、仓库脚本、测试验证和交付资产的顶层目录职责与依赖方向。

### Modified Capabilities

- `cli-modular-architecture`: 将以 `tools/cli`、`tools/runtime`、`tools/shared` 和 `tools/verification` 为基础的内部架构，改为 `src`、`bin`、`scripts` 和 `test` 分层，同时保持 CLI 行为兼容。
- `npm-cli-package`: 更新 npm bin 和 runtime inventory，使安装包从 `bin/` 与 `src/` 运行，并排除仓库脚本和测试验证实现。
- `product-verification-quality`: 明确产品 verifier 与仓库 verification 的所有权、目录和运行时依赖边界，并更新既有验证入口路径。

## Impact

- 影响 `projects/product/tools/` 下全部产品实现、runtime adapter、共享 helper、验证框架和可执行脚本。
- 影响根 `.github/` 发布/验证入口和 workspace 自有 `skills/buildr-release` 中对 Product 内部路径的调用；只迁移路径，不改变发布语义。
- 影响 `package.json#bin`、`package.json#files`、npm scripts、根 `buildr` 开发入口和 checkout CLI 安装脚本。
- 影响测试 imports、verification registry inputs/executors、Candidate fingerprint 路径选择、package static validation 和 mutation/architecture whitelist。
- 影响 `docs/cli-architecture.md`、package 维护文档、发布清单以及引用旧内部路径的 OpenSpec canonical requirements。
- 不改变 Workspace 源资产、顶层 `package/` 交付资产语义、公开 CLI 产品表面或现有 Agent runtime contract。
