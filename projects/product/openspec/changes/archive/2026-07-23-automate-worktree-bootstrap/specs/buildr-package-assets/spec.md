## MODIFIED Requirements

### Requirement: 产品验证覆盖 Git 工作区转换后的环境检查契约
Buildr package verification MUST 防止随包 Git 和任务 Skills 丢失一般工作区转换后的 Buildr 环境诊断边界，并 MUST 通过可执行产品验证证明 canonical task worktree 创建后的 doctor 与安全自动 sync 确定性发生。

#### Scenario: 校验 Git Ops 触发与排除范围
- **WHEN** Buildr 验证随包 Git Ops Skill 和 manifest description
- **THEN** 验证 MUST 确认 Skill 能路由 `pull`、`checkout`、`switch`、`reset`、`cherry-pick`、`revert` 和 `stash` 等工作区转换意图
- **AND** 验证 MUST 确认成功的一般工作区转换会在已初始化 Buildr workspace 中运行当前 Agent doctor
- **AND** 验证 MUST 确认 `fetch`、`push`、普通 `commit` 和失败或冲突中的工作区转换不会触发该检查

#### Scenario: 校验一般 Agent-first 同步交互
- **WHEN** Buildr 验证 worktree create 之外的 Git 工作区转换处理文本
- **THEN** 验证 MUST 确认 doctor 无需处理时不提醒 `render` 或 `sync`
- **AND** 验证 MUST 确认 doctor 发现问题时按 Rules、Skills、Commands、Components、Contributions 和 runtime 分类说明
- **AND** 验证 MUST 确认可由 sync 修复时先询问用户、同时提供手动命令，并在用户确认后由 Agent 执行 sync 和最终 doctor
- **AND** 验证 MUST 确认没有用户确认时不会执行一般 workspace sync，且不会默认要求用户自行运行命令
- **AND** 验证 MUST 确认 Agent 无法执行或用户选择手动方式时才使用手动操作兜底

#### Scenario: 校验 task worktree 产品入口
- **WHEN** Buildr 验证 `worktree create` CLI、帮助、JSON schema、随包 `task-worktree` Skill 和 capability routing
- **THEN** 验证 MUST 确认 Agent 负责提供 task id、branch、start point、Agent 和 workspace root，Buildr 负责 canonical create/reuse 与环境 bootstrap
- **AND** 验证 MUST 确认 task-worktree Skill 要求通过该产品入口创建新 checkout，而不是自行执行 `git worktree add` 后依赖文本提醒
- **AND** 验证 MUST 确认该入口不接管任务理解、OpenSpec 选择、merge、rebase、push 或 cleanup policy

#### Scenario: 校验创建后 doctor 与安全自动 sync
- **WHEN** 产品 E2E 在临时已初始化 Git workspace 调用 `worktree create`
- **THEN** 验证 MUST 证明新 canonical checkout 一定执行当前 Agent doctor
- **AND** runtime healthy 时 MUST 跳过 sync
- **AND** 唯一 actionable finding 为当前 Agent runtime stale、checkout clean 且 identity 未变化时 MUST 自动 sync 并通过最终 doctor
- **AND** JSON MUST 返回 created/reused、treeChanged、doctor before/after、sync decision、blocked reason 和 nextActions

#### Scenario: 校验安全分类 fail closed
- **WHEN** 临时 workspace 分别构造 occupied path、branch 已被占用、dirty/identity 变化、mutation blocked、非 runtime actionable finding、sync preflight 决策或 sync 后 doctor 失败
- **THEN** 验证 MUST 确认产品不会执行不安全 sync、不会执行 doctor 输出中的任意命令、不会删除已创建 checkout或丢弃内容
- **AND** 创建前冲突 MUST 零写入，创建后 bootstrap 阻塞 MUST 保留现场并返回结构化 nextActions

#### Scenario: 校验幂等复用
- **WHEN** 同一 task id、repository 与 branch 再次调用 `worktree create`
- **THEN** 验证 MUST 返回 `reused`、`treeChanged: false`，且不重复 doctor 或 sync
- **AND** identity 不匹配 MUST fail closed

#### Scenario: 校验无需 Git hook
- **WHEN** Buildr 验证工作区转换后的环境检查实现
- **THEN** 验证 MUST 确认随包资产不要求安装或维护 Git hook、daemon、文件 watcher 或定时任务
- **AND** 验证 MUST 保留绕过 Buildr worktree create 的外部 Git 操作只能由后续 Buildr 基线 doctor 兜底的边界
