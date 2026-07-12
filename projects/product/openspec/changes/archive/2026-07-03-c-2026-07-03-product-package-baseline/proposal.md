## Why

Buildr 已经收敛到 root-as-Organization 模型：用户选择的目录本身就是个人、团队或公司的上下文起点，不需要再通过 `organizations/<org>/` 表达同一层边界。继续保留 legacy 兼容会让 CLI ref、scope、doctor 和文档长期背负两套路径模型，削弱产品主线的清晰度。

同时，`ASSETS.md` 当前更像实践中的人工资产手册，尚未形成 `assets check/refresh` 等命令能力。默认初始化时生成它会增加维护负担，而不是提升最小闭环的确定性。

另外，Buildr 产品仓当前同时承载产品开发资产、自用验证资产和随产品交付的初始化 baseline。随包资产本质上是产品开发资产的产物，也是用户实例的 runtime/base assets；它需要被隔离为可发布子集，让开发资产可以引用它，但发布包不会混入 Buildr 自身开发上下文或私有业务内容。

## What Changes

- **BREAKING**：移除 `organizations/<org>/` 作为产品主线或兼容路径；默认 CLI ref、scope、doctor 和模板只支持 root-as-Organization。
- **BREAKING**：从默认 `buildr init` root baseline 中移除 `ASSETS.md`；资产手册后续作为显式能力重新设计。
- 新增 `product/package/` 作为 Buildr 随包资产目录，维护 bootstrap、manuals、辅助文档和 package manifest。
- 将 `buildr init`、`project create` 等命令的 baseline 来源收敛为 manifest 显式文件映射；规则源放在 root `rules/`，README 和辅助文档放在 `product/package/`。
- 引入 package manifest/check/build 语义，用于声明发布子集、用户 workspace baseline、校验随包资产不含私有业务内容，并用临时 root 验证初始化闭环。
- 更新 Agent-first onboarding：初始化 root 后由 Agent 基于 `doctor --json` 渐进式引导用户创建项目、接入服务和渲染 runtime，而不是一次性猜测完整结构。

## Capabilities

### New Capabilities

- `buildr-package-assets`: 定义 Buildr 产品随包资产的源码位置、发布清单、构建校验和与开发资产的引用关系。

### Modified Capabilities

- `root-organization-workspace`: 移除 legacy organizations 布局兼容，并从默认 root baseline 中移除 `ASSETS.md`。
- `buildr-workspace-management`: 将 workspace 管理规范收敛到 root-as-Organization 唯一路径。
- `agent-first-onboarding`: 将 onboarding 主路径改为 root 初始化后的渐进式引导，不再包含 `org create`。
- `agent-readable-doctor`: 移除 legacy organizations scope 兼容诊断，doctor 只诊断 root、project、shared service 和 service repo 主线状态。
- `service-asset-indexing`: 将 shared service metadata 和默认 repo 路径收敛到 root `shared/`。

## Impact

- 影响 CLI：`org create`、`<org>/<project>`、`<org>/<project>/<service>`、`organizations/<org>/...` scope 应从主线移除。
- 影响 baseline：现有内联或重复模板应拆成独立规则/文档源，再由 `product/package/manifest.yml` 显式映射到用户 workspace。
- 影响文档：README、产品手册、bootstrap guide、OpenSpec specs 和开发规则需要清理 legacy wording。
- 影响验证：需要新增 package 校验，确保随包资产可独立发布、可初始化、不会引用当前产品仓私有业务内容。
- 影响当前 Buildr 产品仓：产品开发资产可以继续引用随包资产，但不能把产品仓根 `AGENTS.md` 直接当作用户实例模板。
