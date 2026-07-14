## ADDED Requirements

### Requirement: 产品验证覆盖 Git 工作区转换后的环境检查契约
Buildr package verification MUST 防止随包 Git 和任务 Skills 丢失工作区转换后的 Buildr 环境诊断、Agent-first 同步交互、授权或手动兜底边界。

#### Scenario: 校验 Git Ops 触发与排除范围
- **WHEN** Buildr 验证随包 Git Ops Skill 和 manifest description
- **THEN** 验证 MUST 确认 Skill 能路由 `pull`、`checkout`、`switch`、`reset`、`cherry-pick`、`revert` 和 `stash` 等工作区转换意图
- **AND** 验证 MUST 确认成功的工作区转换会在已初始化 Buildr workspace 中运行当前 Agent doctor
- **AND** 验证 MUST 确认 `fetch`、`push`、普通 `commit` 和失败或冲突中的工作区转换不会触发该检查

#### Scenario: 校验 Agent-first 同步交互
- **WHEN** Buildr 验证 Git 工作区转换后的处理文本
- **THEN** 验证 MUST 确认 doctor 无需处理时不提醒 `render` 或 `sync`
- **AND** 验证 MUST 确认 doctor 发现问题时按 Rules、Skills、Commands、Components、Contributions 和 runtime 分类说明
- **AND** 验证 MUST 确认可由 sync 修复时先询问用户、同时提供手动命令，并在用户确认后由 Agent 执行 sync 和最终 doctor
- **AND** 验证 MUST 确认手动命令使用实际 Agent 和 workspace root，且不会在用户手动操作后无证据地假设成功
- **AND** 验证 MUST 确认没有用户确认时不会执行 sync，且不会默认要求用户自行运行命令
- **AND** 验证 MUST 确认 Agent 无法执行或用户选择手动方式时才使用手动操作兜底
- **AND** 验证 MUST 确认 Skill 不把当前 session 热重载声明为 Buildr 责任

#### Scenario: 校验任务 Skill 复用检查点
- **WHEN** Buildr 验证随包 `task-worktree` 和 `task-finish` Skills
- **THEN** 验证 MUST 确认新 worktree checkout、成功 rebase 和目标 workspace fast-forward 集成复用相同的 Buildr 环境检查、同步询问、Agent 执行和手动兜底边界
- **AND** 验证 MUST 确认该检查不改变既有验证证据、Git 授权或 worktree 清理契约

#### Scenario: 校验无需 Git hook
- **WHEN** Buildr 验证工作区转换后的环境检查实现
- **THEN** 验证 MUST 确认随包 Skills 不要求安装或维护 Git hook、daemon、文件 watcher 或定时任务
- **AND** 验证 MUST 保留 Agent 之外 Git 操作只能由后续 Buildr 基线 doctor 兜底的边界
