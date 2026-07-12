## Why

Buildr 已经分别提供 OpenSpec 归档、Git 协作和 task worktree 生命周期 Skills，但用户说“收尾”时仍需逐步授权和人工串联，容易漏掉归档后的格式检查、验证证据判断、CLI 入口迁移或 worktree 清理。现在需要一个 Buildr 自有的收尾编排入口，在不修改外部 OpenSpec Skills 的前提下安全完成剩余动作。

## What Changes

- 新增 Buildr 内置 workspace Skill `task-finish`，将当前轮次的“收尾”定义为对常规归档、提交、机械 rebase、fast-forward 集成、推送和本地 worktree/任务分支清理的一次性授权。
- `task-finish` 编排既有 OpenSpec、Git Ops 和 Task Worktree 能力；外部 `openspec-*` Skills 保持原样，可随外部框架更新。
- 归档或 specs 同步后运行 `git diff --check`；仅当问题是 OpenSpec 管理的 Markdown 文件末尾多余空行时，自动规范为恰好一个结尾换行并重新校验。
- 将验证证据绑定最终候选 Git tree：相同 tree 的 commit、fast-forward、push 和清理复用结果；rebase 或其他步骤改变 tree 后才重新运行受影响的验证。
- **BREAKING**：`git-ops` 不再路由完整“收尾”意图；该意图由 `task-finish` 独占。force push、merge commit、远端任务分支删除、丢弃改动和语义冲突解决仍不包含在默认收尾授权中。
- 修正 canonical spec 中“rebase 后总是重验”与“只有 tree 改变才重验”的冲突。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`：增加 Task Finish 编排、授权边界、暂停条件和路由规则，并统一 rebase 后的验证证据语义。
- `buildr-package-assets`：要求随包清单、package check 和产品 E2E 覆盖 `task-finish` 的发布与防回退契约。

## Impact

- 新增 `package/targets/workspace/skills/buildr/task-finish/SKILL.md`。
- 修改 workspace Skill manifests、产品入口 Buildr Skill、`git-ops`、`task-worktree`、产品文档和 current state。
- 扩展 `tools/buildr` package check 与 `tools/verify-buildr-product-mvp`。
- 不新增 CLI 命令，不修改外部 OpenSpec Skills，不默认删除远端任务分支。
