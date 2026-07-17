## Why

当前 Buildr 发布准备虽然能完成版本更新、候选验证和 `dev -> main` 发布 PR，但分支命名、新 worktree 依赖准备和 squash merge 后的 `main -> dev` 历史收敛仍依赖 Agent 临场判断。最近的 RC 发布已实际暴露出三类可避免问题：发布分支命名不稳定、验证首次运行因缺少依赖失败，以及 squash 后 `dev -> main` 因历史未衔接而冲突。

需要把这三个已验证的人工补救动作收敛为一个确定性发布流程，让每次候选版和稳定版都从一致的任务身份、可运行环境和可证明 Git tree 状态开始，并在 squash 后幂等地回收分支拓扑。

## What Changes

- Buildr 发布准备必须使用 `tasks/release-<version>` 作为发布任务分支，并使用与版本对应的 canonical task worktree。
- 新建发布 worktree 后必须立即在 Product Project 执行 `npm ci`；依赖准备未成功时不得开始版本文件修改或验证。
- `dev -> main` PR 按仓库策略 squash merge 后，发布流程必须以 Git tree identity 为门禁，确认 squash 后 `main` 与已验证候选 tree 一致，再使用不改变 tree 的历史衔接把 `main` 收敛回 `dev`。
- 历史衔接必须是幂等的：`main` 已是 `dev` 祖先时不得重复创建 merge commit；tree identity 不一致时必须停止，不得用 `ours` 掩盖内容差异。
- 更新 Buildr Product Project 的 `buildr-release` Skill、相关发布文档和静态/行为验证，使 Agent 能稳定执行和证明该流程。

本 change 不改变版本号语义、npm dist-tag、tag 发布或 Environment 审批契约，不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-task-workflows`: 增加 Buildr 发布任务的版本化分支命名、新 worktree 依赖准备，以及 squash merge 后基于 tree identity 的幂等 `main -> dev` 历史衔接契约。

## Impact

- 产品内容：`projects/product/skills/buildr-release/SKILL.md`、`projects/product/docs/release-checklist.md` 及相关 Product Project 规则或维护文档。
- 规范：`openspec/specs/agent-task-workflows/spec.md`。
- 验证：发布 Skill 静态契约、分支/worktree 命名、`npm ci` 顺序、tree identity 失配停止和幂等历史衔接回归。
- Git 协作：发布准备完成后 `dev` 会包含一个仅衔接 squash `main` 历史、不改变候选 tree 的 merge commit；该特例只属于 Buildr 发布工作流，不改变通用 Git Ops 的 fast-forward-only 默认策略。
