## Why

当前 `buildr update` 被用于同步 workspace 产品能力，而用户对 Agent 说“更新 Buildr”时实际期待的是先更新 Buildr CLI 自身，再同步 workspace 与 Agent runtime。命令职责和自然语言意图混在一起，导致 CLI 来源更新、workspace 资产同步和 runtime 维护无法形成清晰、可独立执行的边界。

## What Changes

- **BREAKING**：将 `buildr update` 重定义为只更新 Buildr CLI 自身，不再同步 workspace 资产、渲染 Agent runtime 或运行 workspace doctor。
- `buildr update` 根据当前命令来源自动选择开发者模式或发布模式：开发者模式安全更新本地 Git checkout，发布模式检查 registry 并更新已安装 package；遇到 dirty、共享分支、分叉冲突或无法确定来源时停止并给出 Agent-readable 决策信息。
- **BREAKING**：将 workspace 产品能力同步统一收敛到 `buildr sync <agent>`；该命令继续完成 workspace assets 同步、产品 Buildr Skill 安装、Agent runtime render 和最终 doctor，但不更新 CLI。
- 更新产品 Buildr Skill：用户说“更新 Buildr”时由 Agent 顺序执行 CLI update 与 workspace sync；用户说“只更新 Buildr”或“同步 workspace”时分别只执行对应命令，不引入 `--no-sync`。
- 重组公开 README：将 Product README 的产品说明合并到 workspace 根 README，以 Buildr 产品说明和两种安装/更新模式为主体，末尾再说明当前仓库是 Buildr 自举 workspace 及其开发入口；产品目录不再维护第二份产品 README。
- 在 Roadmap 记录 CLI version 与 workspace assets version 未来可独立演进；当前仍由 CLI package 内置 workspace assets，不实现独立 package、tarball 下载或双版本状态。

## Capabilities

### New Capabilities
- `buildr-cli-self-update`: 定义 Buildr CLI 来源识别、开发者模式 Git 更新、发布模式 registry package 更新及安全停止行为。

### Modified Capabilities
- `buildr-product-capability-sync`: 将 workspace 产品能力更新从 `buildr update` 收敛到 `buildr sync <agent>`，并明确 sync 不更新 CLI。
- `product-agent-skills`: 将用户“更新 Buildr”意图改为由 Agent 编排 CLI update 后再执行 workspace sync，并区分“只更新 Buildr”和“同步 workspace”。
- `human-agent-onboarding`: 公开 onboarding 和 README 同时支持开发 checkout 与 registry package 两种模式，并以自然语言意图引导 Agent 完成正确闭环。
- `npm-cli-package`: 定义 registry 安装来源的 CLI 更新行为和发布模式验证边界。

## Impact

- CLI command registry、update/sync application composition、Git/npm 来源识别和诊断输出。
- Buildr 产品入口 Skill、bootstrap/onboarding 指引、CLI reference、current-state knowledge、release checklist 和相关验证。
- workspace 根 README、Product README 入口与 Roadmap 文档结构。
- 现有调用 `buildr update --target <dir>` 的自动化和用户流程需要迁移到 `buildr sync <agent> --target <dir>`；需要只更新 CLI 的流程改用新的 `buildr update`。
