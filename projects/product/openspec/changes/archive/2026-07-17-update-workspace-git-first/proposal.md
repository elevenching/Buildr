## Why

当前 Buildr Skill 将“更新 workspace”或“同步 workspace”直接解释为 `buildr sync`，只同步当前本地 checkout 中的 Buildr 源资产和 Agent runtime；当 workspace 本身由 Git 管理时，这会漏掉先从上游更新本地 workspace 源内容的步骤，使用户得到的并不是完整的 workspace 更新。

## What Changes

- 将“更新 workspace”或“同步 workspace”定义为 Agent 编排意图：Git 管理的 workspace 先安全更新当前 checkout，再执行 `buildr sync`。
- Git 更新必须复用 Git Ops 的状态检查和安全边界；存在本地改动、分叉、冲突、缺少 upstream 或其他决策点时停止并说明，不自动 stash、rebase 或覆盖。
- 非 Git workspace 继续直接执行 `buildr sync`。
- Git 更新失败或尚未完成时不得继续 sync；Git 更新成功后，显式 workspace 同步意图无需再次询问授权。
- 保持 `buildr sync` CLI 的职责不变，不让 CLI 隐式执行 Git 操作。
- 更新产品入口 Buildr Skill、bootstrap/CLI 文档、runtime 提示和静态验证，防止该编排语义回退。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`: 调整 Buildr Skill 对“更新/同步 workspace”的意图路由和 Git 安全更新编排。
- `buildr-package-assets`: 要求随包资产和产品验证覆盖 Git-first workspace 更新契约。

## Impact

- 影响 `package/targets/runtime/skills/buildr/SKILL.md`、bootstrap guide、CLI reference、runtime Skill 提示和 package 静态验证。
- 不改变 `buildr sync`、`buildr update` 或 Git CLI 的命令行为和公开参数。
- 不新增依赖，也不改变 Agent runtime 的即时重新发现边界。
