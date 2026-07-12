## Why

当前 Buildr 同时存在 `projects/<project>/services/` 和 root `shared/services/` 两套 service 入口，导致 `service create`、`doctor`、runtime scope、文档和 Agent 引导都需要处理特殊分支。

既然 root 本身已经是 Organization 上下文，所谓共享/基础服务也可以表达为一个普通 Project（例如 `foundation`、`platform` 或 `shared`）下的 services。现在收敛能降低产品模型复杂度，并让 `buildr service create <project>/<service>` 成为唯一 service 入口。

## What Changes

- **BREAKING**：移除 root `shared/` 作为默认初始化资产和产品主路径。
- **BREAKING**：移除 `doctor --scope shared[...]` 的特殊 scope；共享/基础服务通过普通 project scope 表达。
- 将共享服务建模为普通 Project 下的 services，例如 `projects/foundation/services/<service>`。
- 更新 package manifest、init baseline、README、bootstrap guide、产品文档和 OpenSpec specs。
- 迁移当前示例组织 root 的 `shared/services.yml` 与 `shared/services/` 到 `projects/foundation/`。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `service-asset-indexing`：共享服务不再使用 root `shared/`；服务资产统一归属某个 Project。
- `root-organization-workspace`：默认 root baseline 不再创建 `shared/`。
- `organization-model`：Organization root 只维护 projects、rules、practices、skills 等入口，共享服务通过 Project 表达。
- `agent-first-onboarding`：bootstrap guide 引导 Agent 将共享/基础服务放入一个 Project，而不是维护 root `shared/`。
- `agent-readable-doctor`：doctor 不再诊断 root shared scope，统一诊断 project service metadata。
- `workspace-first-runtime-projection`：runtime scope 不再包含 shared special case。

## Impact

- 影响 `product/tools/buildr` 的 init、doctor、scope 解析和诊断。
- 影响 `product/package/manifest.yml` 和默认 workspace baseline。
- 影响产品文档、bootstrap guide、README 和验证脚本。
- 影响当前 root 的实际资产迁移：`shared/` 迁入 `projects/foundation/`。
