## Why

源码架构迁移已经在 `dev` 建立 `src/domain`、`src/application`、`src/infrastructure`、`src/interfaces` 的长期边界，但此前验证完成的 Workspace 产品切片仍冻结在旧 `tools/` 布局，功能尚未进入主开发基线。现在需要把该 checkpoint 按新 owner 重新落位，在不恢复旧路径或扩大到 Project/Service 的前提下，恢复 Workspace 数据模型、应用层和本地 UI。

## What Changes

- 基于冻结 commit `8b3c44d2839be9dac29cdba3170c1a507168d91a` 恢复 Workspace 功能契约，不直接 rebase 或合并旧功能分支。
- 在 `src/domain/` 建立纯 Workspace Domain、UUID 格式与字段约束；schema 解析/渲染和 revision 由 filesystem adapter 负责，Domain 不依赖 filesystem、CLI、HTTP 或 runtime。
- 在 `src/application/` 建立 Workspace repository port、查询、受控 metadata 修改、迁移和新增 prompt 用例，并复用现有 mutation/atomic writer。
- 在 `src/infrastructure/filesystem/` 实现 Workspace Manifest repository adapter；文件路径和 YAML 只由该 adapter 处理。
- 在 `src/interfaces/local-app/http/` 与 `src/interfaces/local-app/web/` 恢复 loopback HTTP API 和离线 UI；CLI 只负责 `buildr app` 参数与启动适配。
- 恢复 Workspace UUID 与 `skills/manifest.yml.workspaceId` 的统一 identity、旧 metadata 兼容读取和显式 sync 迁移、doctor 诊断、`buildr init --description`、package baseline 与安装后资源清单。
- 把冻结 checkpoint 中的 Workspace unit、integration、API、安全、package parity 和页面验证迁入当前 `test/` 架构，并为新增 `src/domain` 与 `interfaces/local-app` 增加依赖方向门禁。
- **BREAKING（数据格式）**：新 init 或迁移后的 `.buildr/workspace.yml` 使用 `buildr.workspace/v1`；旧格式继续兼容读取，并通过 canonical sync 事务迁移。
- 不把冻结分支根 `.buildr/workspace.yml` diff 搬入本 change；主开发分支已经通过独立 workspace commit 持有当前自举 Workspace metadata。
- 不实现 Project、Service，也不恢复旧 `tools/` shim、旧 change artifacts 或旧任务看板副本。

## Capabilities

### New Capabilities

- `local-workspace-application`: 定义新源码架构中的 Workspace 应用用例、本机 HTTP/UI、受控 metadata 修改、revision 冲突保护和可复制 Agent prompt。

### Modified Capabilities

- `root-organization-workspace`: 引入稳定 Workspace UUID、canonical metadata、兼容读取和事务迁移。
- `managed-skill-assets`: 让 Skills registry 引用同一个 canonical Workspace UUID，并对 identity 冲突 fail closed。
- `cli-product-surface`: 增加 public `buildr app` 与 `buildr init --description` 表面，同时保持新架构入口分层。

## Impact

- 新增 `src/domain/workspace/`、`src/application/workspace/`、`src/infrastructure/filesystem/workspace-manifest-repository.mjs`、`src/interfaces/local-app/`。
- 修改 `src/application/compose-runtime.mjs`、Workspace init/sync/doctor、`src/interfaces/cli/registry.mjs` 与 help。
- 修改 package workspace baseline、npm files/inventory、产品和 CLI 文档。
- 在当前 `test/unit`、`test/integration-fast`、`test/contract` 与 `test/verification` 体系中恢复并适配 Workspace 功能验证。
- 不引入数据库、前端框架、远程服务、Agent session connector 或新的运行时依赖。
