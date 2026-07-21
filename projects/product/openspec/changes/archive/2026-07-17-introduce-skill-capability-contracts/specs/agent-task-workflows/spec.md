## MODIFIED Requirements

### Requirement: Task Finish 自动编排已验证任务收尾
Buildr MUST 提供实现 `buildr.task-finish/v1` 的 `task-finish` 默认 workspace Skill，将用户当前轮次明确的“收尾”意图作为受限的一次性授权，并通过绑定的 `buildr.task-worktree-lifecycle/v1` 和 `buildr.git-task-integration/v1` providers 自动完成可安全确定的剩余任务动作。

#### Scenario: 收尾前置检查
- **WHEN** 用户在 canonical task worktree 中要求收尾
- **THEN** Agent MUST 解析当前 task/change、仓库边界、目标分支、远端、工作区改动、验证状态和已绑定 worktree-lifecycle/task-integration providers
- **AND** Agent MUST 在 Git 写操作前披露两个 provider identities、实际集成/清理策略、提交范围、目标分支、远端和清理范围
- **AND** 存在无关 dirty changes、多个无法消歧的 change/目标分支、required provider readiness 为 `blocked` 或不可信验证状态时，Agent MUST 在破坏性动作前停止

#### Scenario: 完成 OpenSpec 归档
- **WHEN** 当前任务包含 artifacts 和 tasks 均完成的 active OpenSpec change
- **THEN** Task Finish MUST 默认同步 delta specs 并归档 change
- **AND** Task Finish MUST 通过外部可用的 OpenSpec CLI/Skills 完成该步骤，不修改外部 `openspec-*` Skill 源

#### Scenario: 归档后规范 EOF 空白行
- **WHEN** OpenSpec archive 或 specs sync 后 `git diff --check` 仅报告本次修改的 OpenSpec Markdown 文件存在 `new blank line at EOF`
- **THEN** Task Finish MUST 将这些文件规范为恰好一个结尾换行
- **AND** Task Finish MUST 重新运行 `git diff --check` 和 OpenSpec strict validation

#### Scenario: 归档后存在其他格式问题
- **WHEN** `git diff --check` 报告非 EOF 空白行、非 OpenSpec 文件或无法确认来源的问题
- **THEN** Task Finish MUST 停止自动修复
- **AND** Agent MUST 报告问题并等待用户决定

#### Scenario: 收尾授权覆盖 provider 声明的常规动作
- **WHEN** 前置检查、所需验证和归档相关检查通过
- **THEN** 用户的“收尾” MUST 授权提交当前任务范围、调用已绑定 task-integration provider 完成其 contract 与执行前披露中声明的常规集成动作、推送已确认目标分支，以及删除已安全合入的本地 worktree 和本地任务分支
- **AND** Task Finish MUST 遵循 provider contract 的前置条件、授权类别、tree-change semantics、结果证据和失败行为
- **AND** Task Finish MUST NOT 复制或覆盖 provider 对 rebase、fast-forward 或 merge 的具体 policy

#### Scenario: 默认 Git provider 保持现有集成策略
- **WHEN** `git-ops` 是已绑定的 `buildr.git-task-integration/v1` provider
- **THEN** 默认 task integration MUST 继续使用无语义冲突的必要 rebase 和 fast-forward-only 集成
- **AND** 默认 provider MUST NOT 创建 merge commit，除非用户对该具体动作另行明确授权

#### Scenario: Tree 未改变时复用验证
- **WHEN** commit、provider integration、push 或 cleanup 后的候选 Git tree 与已验证 tree 相同
- **THEN** Task Finish MUST 复用已有验证证据
- **AND** Task Finish MUST NOT 在主开发分支重复运行相同产品 E2E

#### Scenario: Tree 改变时重新验证
- **WHEN** provider integration、冲突解决或其他步骤使候选 Git tree 不同于已验证 tree
- **THEN** Task Finish MUST 在集成前重新运行受影响的验证
- **AND** 新验证失败时 MUST 停止尚未执行的 integrate、push 和 cleanup

#### Scenario: 默认收尾授权的固定排除项
- **WHEN** 收尾需要 force push、删除远端任务分支、丢弃改动、改写共享分支历史或解决语义冲突
- **THEN** “收尾” MUST NOT 授权这些动作
- **AND** Agent MUST 停止并取得用户对具体动作的明确授权或决策
- **AND** merge commit 是否属于常规动作 MUST 由已绑定 provider contract 和执行前披露决定，不得由 Task Finish 全局固定

#### Scenario: Optional 资产审查 provider 缺失
- **WHEN** `buildr.task-asset-review/v1` optional dependency 未绑定
- **THEN** Task Finish MUST 跳过资产审查阶段并明确记录该降级
- **AND** 收尾的其他 required 阶段 MUST 继续执行

#### Scenario: 安全清理 task worktree
- **WHEN** 目标分支已包含任务提交、远端目标分支已推送且 task worktree 干净
- **THEN** Task Finish MUST 调用已绑定 worktree-lifecycle provider 确认 cleanup preconditions 和本机入口迁移要求
- **AND** Task Finish MUST 按 provider contract 从保留的 workspace 执行本地 worktree 和本地任务分支清理
- **AND** Task Finish MUST 检查清理后的 worktree 列表和仓库状态

### Requirement: Git 工作区转换后诊断 Buildr Agent 环境
Buildr required Core MUST 固化“成功改变已检出 Git tree 后检查 Buildr Agent 环境”的 workspace transition invariant；执行 Git 或任务工作流的 Agent MUST 通过产品入口 Buildr Skill 完成具体诊断、同步询问和修复边界，而不依赖某个 optional Git Skill 的身份。

#### Scenario: Git 操作成功改变已检出内容
- **WHEN** Agent 通过任一 Git capability provider 成功完成 `pull`、`merge`、`rebase`、切换 tree 的 `checkout` 或 `switch`、改变工作区的 `reset`、`cherry-pick`、`revert`、`stash apply` 或 `stash pop`
- **AND** 当前仓库位于包含 `.buildr/workspace.yml` 的已初始化 Buildr workspace 中
- **THEN** Agent MUST 针对当前 Agent 和 Buildr workspace root 运行 `buildr doctor --agent <agent> --target <workspace-root> --json`
- **AND** 检查 MUST 发生在 Git 操作成功且工作区不存在未解决冲突之后

#### Scenario: Git 操作不改变已检出内容
- **WHEN** Agent 只执行 `fetch`、`push`、普通 `commit`，或复用未发生 tree 转换的既有 worktree
- **THEN** Agent MUST NOT 仅因该操作运行 Git 工作区转换后的 Buildr 环境检查

#### Scenario: 当前环境无需处理
- **WHEN** 工作区转换后的 doctor 没有报告需要用户处理的环境问题
- **THEN** Agent MUST NOT 提醒用户执行无必要的 `render` 或 `sync`

#### Scenario: 当前环境存在漂移或依赖问题
- **WHEN** 工作区转换后的 doctor 报告 Rules、Skills、capability bindings、Commands、Components、Contributions 或当前 Agent runtime 存在需要处理的问题
- **THEN** Agent MUST 向用户汇总当前环境问题及 doctor 指向的可执行下一步
- **AND** Agent MUST NOT 将全部问题笼统解释为 runtime 渲染问题
- **AND** Agent MUST 说明当前 session 是否重新发现新资产由 Agent runtime 决定

#### Scenario: 当前 provider 已报告 treeChanged
- **WHEN** 已绑定 Git provider 的结果证据包含 `treeChanged: true`
- **THEN** consumer 或 orchestrator MUST 触发 required workspace transition invariant
- **AND** Agent MUST NOT 因 provider id 不等于 `git-ops` 而跳过检查

#### Scenario: 环境漂移可由 workspace sync 修复
- **WHEN** 工作区转换后的 doctor 指出当前 Agent 的 workspace sync 是合适修复动作
- **THEN** Agent MUST 询问用户是否由 Agent 立即同步当前 workspace 和 Agent runtime
- **AND** Agent MUST 同时提供 `buildr sync <agent> --target <workspace-root>` 作为手动同步备选
- **AND** 面向用户的手动命令 MUST 使用已解析的实际 Agent 和 workspace root，不得保留占位符
- **AND** Agent MUST NOT 在用户确认前执行 sync
- **AND** Agent MUST NOT 把要求用户自行运行命令作为默认处理方式

#### Scenario: 用户确认由 Agent 同步
- **WHEN** 用户确认由 Agent 处理 workspace sync
- **THEN** Agent MUST 调用 Buildr Skill 执行 `buildr sync <agent> --target <workspace-root>`
- **AND** Agent MUST 使用 sync 的最终 doctor 或追加 doctor 确认当前环境结果
- **AND** Agent MUST 报告实际同步与诊断结果，而不是仅重复手动命令

#### Scenario: 用户选择手动同步或 Agent 无法执行
- **WHEN** 用户明确选择手动同步，或 Agent 因工具不可用、权限、登录态或外部环境无法完成同步
- **THEN** Agent MUST 提供准确的手动同步命令
- **AND** Agent MUST 在无法执行时说明具体原因
- **AND** 用户选择手动同步后，Agent MUST NOT 在缺少诊断证据时假设同步成功
- **AND** 用户报告完成且 Agent 能运行 doctor 时，Agent MUST 再次验证当前环境

#### Scenario: 诊断问题不应由 sync 修复
- **WHEN** doctor 报告 Commands、Components、CLI 或其他不能由 workspace sync 正确修复的问题
- **THEN** Agent MUST 按对应 Buildr 生命周期询问并在取得授权后执行可完成的动作
- **AND** Agent MUST 仅在自身无法完成或用户选择手动方式时要求用户操作

#### Scenario: 无法确认当前 Agent 环境
- **WHEN** Agent 无法匹配受支持的 runtime adapter，或 post-transition doctor 无法执行
- **THEN** Agent MUST 报告环境状态尚未确认及具体原因
- **AND** Agent MUST NOT 猜测本地 Agent runtime 已经同步

#### Scenario: 任务 Skill 内部发生工作区转换
- **WHEN** `task-worktree` provider 创建新的 worktree checkout，或 `task-finish` 通过绑定 provider 改变目标 workspace tree
- **THEN** 对应任务 Skill MUST 复用 required Core invariant 与产品入口 Buildr Skill 的环境检查、同步询问、Agent 执行和手动兜底边界
- **AND** 检查 MUST NOT 改变既有验证证据、Git 授权或 worktree 清理契约

#### Scenario: Git 操作由 Agent 之外执行
- **WHEN** 用户或其他程序绕过 Agent Skill 直接改变 Git 工作区
- **THEN** Buildr MUST NOT 声称能够即时感知该操作
- **AND** 后续 Buildr 工作流 MUST 继续通过执行循环中的基线 doctor 检查当前环境

## ADDED Requirements

### Requirement: 内置任务 Skills 按 capability contract 协作
Buildr 内置任务 Skills MUST 依赖 capability contracts 而不是硬编码其他 optional Skill identity，并 MUST 将 provider policy 保留在 provider 中。

#### Scenario: Task Finish 依赖 Git 集成能力
- **WHEN** Buildr 声明 `task-finish` builtin
- **THEN** its manifest entry MUST require `buildr.git-task-integration/v1` with `mode: required`
- **AND** its manifest entry MUST require `buildr.task-worktree-lifecycle/v1` with `mode: required`
- **AND** `task-finish` source MUST NOT 复制默认 Git provider 的 rebase、fast-forward 或 merge policy
- **AND** `task-finish` source MUST NOT 复制 worktree provider 的 placement、retention 或 cleanup policy

#### Scenario: Task Worktree 不依赖 Git provider identity
- **WHEN** `task-worktree` 创建、检查或清理 Git worktree
- **THEN** it MUST own worktree placement、retention 和 cleanup through `buildr.task-worktree-lifecycle/v1`
- **AND** it MUST directly follow the required Core workspace-transition invariant after changing a checkout
- **AND** it MUST NOT require `git-ops` or `buildr.git-single-operation/v1` only to reuse that invariant

#### Scenario: 替换默认 Git provider
- **WHEN** workspace binds compatible internal providers for the Git capabilities consumed by task workflows
- **THEN** `task-finish` MUST cooperate with the task-integration provider without requiring the `git-ops` Skill id
- **AND** `task-worktree` MUST remain independent of `git-ops`
- **AND** uninstalling `git-ops` MUST NOT break those consumers while Task Finish 的 required bindings remain compatible and ready

#### Scenario: 替换默认 Worktree provider
- **WHEN** workspace or Project binds an internal provider for `buildr.task-worktree-lifecycle/v1`
- **THEN** product routing and `task-finish` MUST use that provider without requiring the `task-worktree` Skill id
- **AND** uninstalling `task-worktree` MUST NOT break Task Finish while the replacement binding remains ready
