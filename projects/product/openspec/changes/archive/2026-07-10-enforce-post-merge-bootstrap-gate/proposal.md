## Why

Buildr 产品开发需要同时保证 task worktree 隔离和验证证据可信。未合并候选不能污染主开发工作区；但已经在 worktree 对最终候选内容完成的完整验证，也不应因为 commit、内容不变的集成、push 或 worktree 清理而在主开发分支重复执行。验证是否失效应取决于最终 Git tree 是否改变，而不是代码位于哪个 worktree。

## What Changes

- 在创建预计包含代码、构建或测试的 OpenSpec change 前，先完成 task triage 和 worktree 决策；选择 worktree 后，proposal、specs、tasks、实现和候选验证都只写入该 worktree。
- 禁止使用未合并 task checkout 向主自举 workspace 物化候选资产；候选阶段只使用临时 workspace 或 task worktree 自身验证。
- **BREAKING**：以 worktree 中完成验证的最终候选 Git tree 作为集成证据；commit、保持相同 tree 的集成、push 和 worktree 清理不触发主开发分支重复 E2E。
- rebase、冲突解决、后续编辑或其他操作改变候选 tree 后，原验证证据失效，必须在集成前重新运行受影响的验证。
- 实际自举 workspace 的 update/sync 是独立的 workspace 维护动作；发生状态变更时仍按 Buildr Core 运行 doctor，但不作为相同 tree 提交、合并、推送或清理的重复产品验证门禁。
- 为 package check 和产品 E2E 增加 task-worktree 隔离与验证证据复用契约，防止规则回退。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`：调整 task-worktree 的决策时机、唯一写入位置和验证证据复用指引。
- `buildr-development-openspec`：将产品验证绑定到最终候选 tree，并明确验证失效条件。
- `buildr-product-capability-sync`：禁止未合并候选 checkout 更新主自举 workspace，并区分产品验证与实际 workspace 维护。
- `buildr-package-assets`：扩展 package verification，校验 worktree 隔离和 verified-tree 契约。

## Impact

- 修改 `task-worktree`、`git-ops` Skills、Product Project `AGENTS.md`、产品 current state 和相关开发文档。
- 修改上述四个 OpenSpec capability 的行为契约。
- 扩展 package check 与产品 E2E 文本检查。
- 不改变普通用户 workspace 的 CLI 数据模型或 runtime adapter 格式。
