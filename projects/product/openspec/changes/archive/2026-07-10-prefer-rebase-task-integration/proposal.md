## Why

当前 Git Ops Skill 只说明 rebase 的历史改写授权边界，没有规定任务分支与目标分支分叉时的默认集成策略，Agent 可能自行创建 merge commit，破坏仓库线性历史。需要把 rebase-first 和 fast-forward-only 固化为产品默认值，同时保留所有 Git 写操作的明确授权边界。

本变更不包含公开 CLI 或数据契约的破坏性变更。

## What Changes

- 本地未推送任务分支与目标分支分叉时，默认先 fetch，再 rebase 到最新目标分支。
- 目标分支集成任务分支时默认只允许 fast-forward，不创建 merge commit。
- 只有用户当前轮次明确要求 merge commit 时，才允许 non-fast-forward merge。
- 已推送或多人共享的任务分支不得自动 rebase；需要明确授权后再改写历史。
- rebase 遇到需要业务或语义选择的冲突时停止，报告冲突并等待用户决定。
- 更新随包 Skill 验证、OpenSpec specs 和当前自举 workspace Skill。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`: 为 Git Ops Skill 增加 rebase-first、fast-forward-only 和 merge commit 授权契约。
- `buildr-package-assets`: 产品验证必须覆盖 Git Ops Skill 的默认集成策略，防止随包资产回退。

## Impact

- 修改 `package/targets/workspace/skills/buildr/git-ops/SKILL.md`。
- 修改产品验证脚本和相关 OpenSpec specs。
- 通过 Buildr sync 更新当前自举 workspace 与 Codex runtime。
