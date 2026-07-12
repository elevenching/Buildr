## Why

Buildr 已约束最终候选 tree 的完整验证和相同 tree 的证据复用，但尚未约束 change 实现过程中的验证频率。Agent 因此可能在每个小任务后重复运行 package check、临时 workspace E2E 或产品总验证，甚至在已有验证进程仍运行时重新启动同一命令，显著拉长 change 开发时间且没有增加有效覆盖。

## What Changes

- 为实现型任务建立三级验证门禁：单任务只做最小反馈检查，任务组完成时做一次受影响范围验证，所有实现与文档完成并冻结候选后才做一次完整验证。
- 明确禁止默认在每个任务后运行完整 E2E；上层验证已覆盖的底层检查不得在同一候选状态中机械重复执行。
- 明确长时间验证的进程复用语义：命令返回 session、cell 或仍在运行状态时，Agent 必须继续轮询同一进程，不得因暂时无输出而重新启动。
- 规定失败后的重验范围：修复期间优先重跑失败项或受影响检查，候选重新稳定后再完成一次最终完整验证。
- 调整 OpenSpec task 编排指引，使实现、分组验证和最终候选验证形成清晰阶段，并让随包校验防止这些约束回退。
- 将分层验证作为随包通用协议交付给用户 workspace；具体的专项检查和完整验证命令由各 workspace 或 Project 定义，Buildr 产品仓继续使用自身的 package check、临时 workspace E2E 和产品总验证入口。
- 不修改外部 OpenSpec workflow Skills；Buildr 通过自有任务 Skills 和项目开发契约提供编排约束。
- 本 change 不包含 CLI、数据格式或用户 API 的破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`: 任务分析、worktree 开发和收尾 Skills 采用分层验证、进程复用和验证证据去重协议。
- `buildr-development-openspec`: Buildr 产品 OpenSpec change 的 apply 阶段按任务组集中验证，并在最终候选冻结后执行完整门禁。
- `buildr-package-assets`: 产品验证检查随包任务 Skills 和项目开发契约持续包含分层验证约束。

## Impact

- 影响 Buildr 随包的 `task-triage`、`task-worktree`、`task-finish` 等任务流程 Skill 源，以及 Product Project 的开发规则。
- 影响 package check 或产品验证中的静态契约断言，不改变产品级总验证入口本身包含的检查集合。
- 后续 Agent 在 Buildr 自举项目和用户 workspace 中执行 change 时都会减少中间阶段的完整验证次数；最终候选的完整覆盖不会降低。
