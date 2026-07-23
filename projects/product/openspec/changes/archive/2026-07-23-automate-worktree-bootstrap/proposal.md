## Why

当前 task worktree 创建后的 Buildr 环境检查只由 Agent 根据 Skill 文本执行，产品没有确定性入口保证 doctor 一定发生；即使 doctor 已明确只有新 checkout 的 runtime 漂移可由 sync 修复，也仍依赖额外对话授权，容易留下不可用的任务环境。现在需要把这段可验证的环境准备收敛为产品能力，同时保持 Git 决策和不安全修复仍由 Agent 与用户控制。

## What Changes

- 新增 Buildr 管理的 task worktree 创建入口，确定性完成 canonical path/branch 校验、Git worktree 创建或幂等复用、当前 Agent doctor 与结构化结果输出。
- 定义安全自动 sync 判定：只允许对刚创建的、已初始化且 Git clean 的目标 checkout，在 doctor 的全部 actionable findings 均可由该 checkout 的 workspace sync 收敛时自动执行 sync，并以最终 doctor 作为成功结果。
- doctor 健康时不执行 sync；存在 Commands、Components、mutation、CLI、Git 状态或其他非 sync 安全问题时零自动修复并返回阻塞原因与下一步。
- 保留 Agent 对 task identity、分支、起点和是否采用 worktree 的理解与决策；产品只执行已经明确参数化的创建与环境 bootstrap，不承担任务规划。
- **BREAKING**：新 worktree 的安全 runtime 漂移不再逐次请求 sync 确认，而是在创建命令授权范围内自动收敛。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-task-workflows`: 把新 task worktree 创建后的 doctor 与安全 sync 从 Agent 文本约定升级为确定性的产品执行流程。
- `buildr-package-assets`: 要求 CLI、随包 Skill 与产品验证共同覆盖 worktree bootstrap 命令、安全分类、幂等性和失败零越权行为。

## Impact

- 影响 Buildr CLI 命令路由、Git/worktree 应用服务、doctor/sync 复用边界、JSON 输出契约和帮助文本。
- 影响随包 `task-worktree`、产品入口 Buildr Skill、静态 package 校验、CLI integration 与临时 workspace E2E。
- 不引入 Git hook、daemon 或 watcher，不自动处理分叉、冲突、dirty checkout、Command 安装、Component 生命周期或 mutation recovery。
