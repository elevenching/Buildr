# Agent Task Workflows

## Purpose

定义 Buildr 内置场景化 Skills、Agent 任务协作、OpenSpec/Git/worktree/finish 工作流和分层验证契约。
## Requirements
### Requirement: 内置场景化 Skills 引导产品工作流
Buildr MUST 为依赖用户任务意图或工作流阶段的 Buildr 维护流程提供内置 workspace Skills。

#### Scenario: Agent 需要任务分流指引
- **WHEN** 用户要求修 bug、实现或调整功能、改需求、重构、优化、补文档、补测试、调整 API、契约、权限、状态流、数据语义，或询问某项改动是否需要 spec 或 change 管理
- **THEN** Buildr MUST 通过内置 Skill 提供任务意图分流能力
- **AND** 该 Skill MUST 帮助 Agent 先理解用户任务意图和影响范围，再选择后续处理方式

#### Scenario: Agent 需要 OpenSpec 工作流指引
- **WHEN** Agent 需要探索、提案、实现、同步或归档 OpenSpec change
- **THEN** Buildr MUST 依赖可用的 `openspec-*` Skills 匹配该意图
- **AND** Buildr MUST NOT 要求 Agent 读取 optional OpenSpec Rule 来执行该工作流

#### Scenario: Agent 需要代码开发工作流指引
- **WHEN** 用户要求代码开发、修 bug、实现功能、执行构建或测试、多仓协作、隔离任务分支、处理长期任务上下文，或清理已上线、已归档或已收尾的任务
- **THEN** Buildr MUST 通过内置 Skill 提供任务 worktree 生命周期指引
- **AND** 该 Skill MUST 覆盖任务 worktree 的创建、使用、保留和清理边界

#### Scenario: Agent 需要 Git 操作指引
- **WHEN** 用户表达提交、commit、推送、push、提交并推送、合并、merge、rebase、发布、release、删除分支或清理远端分支的意图，或 Git 操作授权、提交范围、amend、远端改写、分支删除存在歧义
- **THEN** Buildr MUST 通过内置 Skill 提供 Git 协作策略
- **AND** 该 Skill MUST 覆盖意图消歧、授权边界、提交范围、amend 策略、远端安全默认值和失败处理
- **AND** 该 Skill MUST NOT 成为通用 Git 命令教程

#### Scenario: Agent 需要完整任务收尾
- **WHEN** 用户在 task worktree 中表达“收尾”、完成任务或自动完成剩余归档与集成动作的意图
- **THEN** Buildr MUST 通过独立的 Task Finish Skill 编排 OpenSpec、验证、Git 集成和本地 worktree 清理
- **AND** Git Ops Skill MUST NOT 同时把完整任务收尾解释为只检查状态并等待逐项授权

### Requirement: Buildr Skill 引导场景化内置 Skills
产品内置 Buildr Skill MUST 在用户意图匹配相关工作流时，引导 Agent 使用场景化内置 Skills。

#### Scenario: 用户询问 Rules 与 Skills
- **WHEN** 用户询问如何维护或重组 Buildr rules 和 skills
- **THEN** Buildr Skill MUST 说明任务触发型流程应归入 Skills
- **AND** Buildr Skill MUST 将 required Rules 视为 ontology、源资产边界和常驻 invariants 的承载位置

#### Scenario: Agent runtime 找不到场景化 Skill
- **WHEN** 某个工作流应由内置场景化 Skill 处理，但当前 Agent runtime 找不到该 Skill
- **THEN** Buildr Skill MUST 引导 Agent 检查 workspace Skills 源资产和 runtime 投射状态
- **AND** Buildr Skill MUST 优先引导 `skills render`、`sync` 或 doctor 指导的修复，而不是把工作流文本复制到 Rules

### Requirement: 任务工作流必须显式可见
Buildr task 和 OpenSpec Skills MUST 在改变 task state 前，以及已报告状态发生实质变化时，明确 workflow selection、task location 和当前 OpenSpec change status。

#### Scenario: 使用 OpenSpec 前说明 change
- **WHEN** Agent 决定 create、explore、apply、sync 或 archive OpenSpec change
- **THEN** Agent MUST 在执行动作前说明正在使用 OpenSpec
- **AND** Agent MUST 在已知时尽快明确 change id、resolved change path 和 intended action

#### Scenario: 采用 OpenSpec 时说明当前 change 状态
- **WHEN** task triage 选择或继续 OpenSpec change-flow
- **THEN** Agent MUST 在面向用户的回复中包含当前 change status
- **AND** status MUST 在已知时标识 change id、resolved change path、current action，以及 change 是 planned、active、blocked、apply-ready、complete 还是 archived
- **AND** 在可用时，status MUST 汇总 artifact 或 task progress，并明确 next executable action 或 blocking reason
- **AND** Agent MUST 在首次采用 OpenSpec、状态发生实质变化、工作暂停或完成，或用户询问进度时刷新该 status

#### Scenario: 创建或复用 task worktree 前说明位置
- **WHEN** Agent 决定 create 或 reuse task worktree
- **THEN** Agent MUST 在 task edits 前说明正在创建还是复用 worktree
- **AND** Agent MUST 明确当前 Buildr workspace root、task id、worktree path 和 task branch

#### Scenario: Task worktree canonical location
- **WHEN** Agent 在 Buildr workspace 中创建 task worktree
- **THEN** 其 canonical path MUST 为 `<workspace-root>/.worktrees/<task-id>`
- **AND** Agent MUST NOT 静默回退到 `/tmp` 或其他任意位置
- **AND** 同一 task MUST reuse 其现有 worktree
- **AND** multi-repository task MUST 使用 repo-qualified task ids 避免 path collisions

#### Scenario: Task worktree lifecycle remains a Skill concern
- **WHEN** Buildr 打包 task worktree guidance
- **THEN** placement、disclosure、reuse、retention 和 cleanup procedures MUST 保留在 task Skills 中
- **AND** required Core Rule MUST NOT 复制 worktree operation manual

### Requirement: 发布 worktree 在远端候选确认后默认清理
Buildr task-worktree guidance MUST 将发布 worktree 与需要持续联调的普通开发 worktree 区分，并在发布目标完成后默认清理不再需要的本地发布环境。

#### Scenario: 推送并确认发布分支后清理本地发布环境
- **WHEN** Agent 使用临时 worktree 制作发布分支
- **AND** 远端发布分支已推送且远端 ref 与候选提交一致
- **AND** worktree 干净且没有明确的后续本地构建、部署、修复或验证动作
- **THEN** Agent MUST 删除本地发布 worktree 和已由远端安全承载的本地发布分支
- **AND** Agent MUST NOT 因普通开发任务的保守保留策略继续保留该发布 worktree
- **AND** Agent MUST NOT 自动删除远端发布分支

#### Scenario: 存在后续本地发布动作时保留
- **WHEN** 发布分支推送后仍有明确的本地构建、部署、修复或验证动作
- **THEN** Agent MUST 保留发布 worktree
- **AND** Agent MUST 向用户说明保留原因和下一项本地动作

### Requirement: Buildr Skill 统一表达 doctor 生命周期
Buildr Skill MUST 通过统一执行循环表达 Buildr 状态变更后的 doctor 验证流程，并避免在每个资产章节重复相同要求。

#### Scenario: 状态变更后的统一验证
- **WHEN** Agent 通过 Buildr Skill 完成 workspace 状态变更
- **THEN** Buildr Skill MUST 要求运行 `buildr doctor --agent <agent> --target <dir> --json`
- **AND** 完成标准 MUST 要求不存在需要立即处理的 error

#### Scenario: 资产章节避免重复
- **WHEN** Buildr Skill 分别说明 Workspace、Project、Service、Rules 或 runtime 维护动作
- **THEN** 各资产章节 MUST 依赖共享执行循环完成通用 doctor 验证
- **AND** 只有该资产存在额外诊断语义时才能补充专项检查说明

#### Scenario: Bootstrap 兜底一致
- **WHEN** Buildr Skill 不可用且 Agent 使用 bootstrap guide
- **THEN** bootstrap MUST 保留状态变更后运行当前 Agent doctor 的最小兜底流程

### Requirement: Buildr 通过声明式 Skill Contribution 编排 OpenSpec 契约门禁
Buildr MUST 由 OpenSpec Component 向通用 workspace Skills 的稳定 slot 贡献门禁说明，在 change 建立、同步和归档边界调用契约门禁，并保持通用 Skills 与外部 OpenSpec Skills 可独立更新。

#### Scenario: Change artifacts 达到 apply-ready
- **WHEN** task triage 选择 change-flow 且 proposal、design、specs 和 tasks 已达到 apply-ready
- **THEN** installed OpenSpec Component MUST 在 `task-triage` runtime Skill 的 change-ready slot 贡献建立基线和 proposal stage check 的说明
- **AND** Agent MUST 使用 `openspec-contract-guard` 建立契约基线并运行 proposal stage check
- **AND** 门禁未通过时 Agent MUST 将 change 报告为 blocked 而不是开始实现

#### Scenario: Delta 实现期间改变触达范围
- **WHEN** Agent 修改 delta 使其新增或改变 Requirement identity
- **THEN** Agent MUST 再次运行 proposal stage check
- **AND** Agent MUST 显式更新不完整基线而不是由普通 check 自动采用当前事实

#### Scenario: Task Finish 同步前后执行门禁
- **WHEN** `task-finish` 准备同步并归档带 delta specs 的 change
- **THEN** installed OpenSpec Component MUST 分别向 `task-finish` runtime Skill 的 pre-sync 和 post-sync slot 贡献对应门禁说明
- **AND** Task Finish MUST 在 canonical spec sync 前运行 pre-sync check
- **AND** Task Finish MUST 在 sync 后、archive 前运行 post-sync check
- **AND** 任一检查失败时 MUST 停止尚未执行的 archive、commit、push 和 cleanup

#### Scenario: OpenSpec Component 已卸载
- **WHEN** OpenSpec Component 为 disabled 或 uninstalled 且 Agent runtime 被重新渲染
- **THEN** `task-triage`、`task-finish` 和产品入口 Buildr Skill MUST NOT 包含 OpenSpec contract guard 的专用命令或路由
- **AND** 通用 Skills MUST 继续支持其不依赖 OpenSpec Component 的既有职责

#### Scenario: 外部 OpenSpec workflow 保持原样
- **WHEN** Buildr 发布或升级契约门禁
- **THEN** Buildr MUST 通过 Component-owned contribution、自有 Skill 和 CLI 编排门禁
- **AND** Buildr MUST NOT 要求修改外部 `openspec-*` Skills 来承载 Buildr 检查逻辑

#### Scenario: 门禁诊断对用户可见
- **WHEN** 契约检查阻塞 change-flow 或 task finish
- **THEN** Agent MUST 报告 change、stage、冲突或陈旧 Requirement、当前状态和可执行下一步
- **AND** Agent MUST NOT 把 warning 或未验证状态描述为门禁通过

### Requirement: task-triage 明确 OpenSpec 中文文档约束
Buildr 的 task-triage Skill MUST 在选择或继续 OpenSpec 工作流时，要求 Agent 使用中文编写 Buildr 自有 OpenSpec 文档和用户可见说明，并说明允许保留英文的格式与技术内容。

#### Scenario: task triage 选择 OpenSpec
- **WHEN** task triage 选择或继续 OpenSpec change-flow
- **THEN** 其面向用户的 guidance MUST 要求 Buildr 自有文档正文使用中文
- **AND** 它 MUST 允许 English commands、paths、code identifiers、protocol fields、YAML/frontmatter 和 OpenSpec format keywords

### Requirement: Git Ops 默认保持线性任务历史
Buildr Git Ops Skill MUST 对任务分支采用 rebase-first、fast-forward-only 的默认集成策略，并保留 Git 写操作授权边界。

#### Scenario: 本地未推送任务分支发生分叉
- **WHEN** 任务分支包含本地未推送提交且目标分支出现新提交
- **THEN** Agent MUST 先 fetch 最新目标分支
- **AND** Agent MUST 默认将任务分支 rebase 到最新目标分支
- **AND** Agent MUST 比较 rebase 前后的 Git tree
- **AND** 仅当 tree 改变时，Agent MUST 在集成前重新运行受影响的验证

#### Scenario: 集成任务分支到目标分支
- **WHEN** Agent 已获当前轮次的合并授权并准备把任务分支集成到目标分支
- **THEN** Agent MUST 默认使用 fast-forward-only 集成
- **AND** Agent MUST NOT 自动创建 merge commit

#### Scenario: 用户明确要求 merge commit
- **WHEN** 用户当前轮次明确要求 merge commit，或项目规则明确要求 non-fast-forward merge
- **THEN** Agent MAY 使用 merge commit
- **AND** Agent MUST 在执行前报告目标分支和集成方式

#### Scenario: 已推送或共享任务分支
- **WHEN** 任务分支提交已经推送或被多人共享
- **THEN** Agent MUST NOT 自动 rebase 或 force push
- **AND** Agent MUST 等待用户明确授权历史改写或选择其他集成方式

#### Scenario: Rebase 冲突需要语义决策
- **WHEN** rebase 冲突无法通过保持双方既有语义机械解决
- **THEN** Agent MUST 停止并报告冲突
- **AND** Agent MUST 等待用户确认后继续

### Requirement: Task worktree 提供 change 单写入与验证证据边界
Buildr task-worktree 和 git-ops guidance MUST 在创建预计进入实现的 OpenSpec change 前完成 worktree 决策，并在采用 worktree 后保持唯一任务写入位置与可复用的最终候选 tree 验证证据。

#### Scenario: 实现型 change 在 propose 前创建 worktree
- **WHEN** task triage 选择 change-flow，且任务预计包含代码修改、构建、测试或长期实现上下文
- **THEN** Agent MUST 在创建 OpenSpec change artifacts 前创建或复用 canonical task worktree
- **AND** proposal、design、specs、tasks、实现和候选验证 MUST 只写入该 worktree

#### Scenario: 纯元内容任务不创建 worktree
- **WHEN** 任务明确只维护 OpenSpec artifacts、规则、Skills、文档或模板，且不进入代码实现、构建或测试
- **THEN** Agent MAY 在当前 workspace 直接维护这些元内容
- **AND** Agent MUST 在任务升级为实现前重新执行 worktree 决策

#### Scenario: artifacts 任务升级为实现
- **WHEN** 未使用 worktree 的 OpenSpec 任务后来需要代码实现、构建或测试
- **THEN** Agent MUST 先创建或复用 task worktree 并将 change artifacts 收敛到该唯一位置
- **AND** Agent MUST 清除原工作区的重复副本并确认主工作区没有该任务的开发改动后再继续

#### Scenario: 最终候选 tree 已完成验证
- **WHEN** worktree 中准备集成的最终候选 Git tree 已完成项目要求的完整验证
- **THEN** 后续 commit、保持相同 tree 的集成、push 和 worktree 清理 MUST 复用该验证证据
- **AND** Agent MUST NOT 仅因 checkout 切换到主开发分支而重复运行相同产品 E2E

#### Scenario: 集成前候选 tree 发生变化
- **WHEN** rebase、冲突解决、后续编辑或其他操作使准备集成的 Git tree 不同于已验证 tree
- **THEN** 原验证证据 MUST 失效
- **AND** Agent MUST 在集成前对新 tree 重新运行受影响的验证

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

### Requirement: Task Finish 必须报告可信的完整验证 timing 证据
Buildr `task-finish` MUST 消费最终完整 Candidate verification 的 timing summary，并将其作为收尾 Result Evidence 的一部分。

#### Scenario: 最终 Candidate 验证成功
- **WHEN** `task-finish` 使用当前候选 tree 的成功 Candidate 验证作为收尾证据
- **THEN** `task-finish` MUST 从验证输出读取 timing summary 路径并解析 summary
- **AND** MUST 核对 summary status、run kind 和 source identity 与当前 worktree/候选证据一致
- **AND** 最终收尾报告 MUST 说明总耗时、最慢阶段、失败阶段（成功时为无）和 summary 路径

#### Scenario: timing summary 不可信
- **WHEN** summary 缺失、不可读、已被其他 run 覆盖或 source identity 无法匹配当前候选
- **THEN** `task-finish` MUST NOT 引用其他 run 的耗时或根据并行 step 耗时推算整体 wall-clock
- **AND** 在仍可安全重跑完整验证时 MUST 重新生成可信 Candidate timing evidence
- **AND** 无法重跑时 MUST 将 timing evidence 缺口作为剩余风险如实报告

#### Scenario: 只有 Changed timing
- **WHEN** 当前任务只有 Changed verification timing 而没有可信的最终 Candidate timing
- **THEN** `task-finish` MUST NOT 将 Changed summary 表述为完整 Candidate 验证耗时

### Requirement: 实现任务采用分层验证门禁
Buildr 任务流程 Skills MUST 将实现期间的验证分为单任务最小反馈、任务组受影响范围验证和最终候选完整验证，并 MUST 防止同一候选状态重复执行已被上层入口覆盖的检查。

#### Scenario: 单任务只做最小反馈检查
- **WHEN** Agent 完成任务组内的一个实现任务且没有跨越高风险边界
- **THEN** Agent MUST 只运行语法、类型或与该任务直接相关的小范围检查
- **AND** Agent MUST NOT 默认运行当前 workspace 或 Project 定义的完整验证入口

#### Scenario: Workspace 定义具体验证入口
- **WHEN** Buildr 将任务流程 Skills 交付到用户 workspace
- **THEN** Skills MUST 使用通用的最小反馈、受影响范围和完整验证语义
- **AND** 具体检查命令 MUST 由当前 workspace 或 Project 的规则、OpenSpec 或开发文档定义
- **AND** Skills MUST NOT 将 Buildr 产品仓的 package check、临时 workspace E2E 或产品总验证命令规定为所有项目的固定入口

#### Scenario: 任务组边界集中验证
- **WHEN** 一组共享实现区域、验证入口或失败影响面的任务全部完成
- **THEN** Agent MUST 对该任务组运行一次受影响范围验证
- **AND** Agent MUST NOT 为组内每个任务机械重复同一专项检查

#### Scenario: 最终候选冻结后完整验证
- **WHEN** 计划中的实现、自然语言资产、生成资产同步和 review 修订均已完成
- **THEN** Agent MUST 将当前状态视为最终候选并运行一次完整验证
- **AND** 完整验证通过后相同 tree 的 commit、集成、push 和清理 MUST 复用该证据

#### Scenario: 上层入口覆盖底层检查
- **WHEN** Agent 能够证明即将运行的上层验证入口包含某个底层检查
- **THEN** Agent MUST NOT 在同一候选状态中先后单独重复运行该底层检查
- **AND** 无法证明覆盖关系时 Agent MUST 保留必要检查

#### Scenario: 运行中验证复用进程
- **WHEN** 验证命令返回 session、cell、process id 或仍在运行状态
- **THEN** Agent MUST 使用 wait、poll 或 resume 继续同一进程
- **AND** 暂时没有新输出 MUST NOT 触发相同命令的重复启动

#### Scenario: 完整验证失败后的修复循环
- **WHEN** 最终完整验证失败且 Agent 正在修复失败原因
- **THEN** Agent MUST 优先重跑失败项和受修复影响的专项检查
- **AND** 候选重新稳定后 Agent MUST 再执行一次最终完整验证

#### Scenario: OpenSpec tasks 表达验证阶段
- **WHEN** Agent 为实现型 change 编写或调整任务清单
- **THEN** tasks MUST 将实现工作组织为有语义的任务组
- **AND** tasks MUST 将任务组专项验证置于对应实现之后
- **AND** tasks MUST 将完整候选验证置于所有实现、文档、同步和 review 修订之后

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

### Requirement: Buildr 发布准备使用版本化任务环境
Buildr Product Project 的发布引导 MUST 从目标 package version 派生唯一发布任务 identity，并在新发布 worktree 中先准备 lockfile 定义的依赖，再修改或验证候选内容。

#### Scenario: 创建发布任务分支和 worktree
- **WHEN** Agent 为目标版本 `<version>` 准备 Buildr 候选版或稳定版
- **THEN** 发布 task id MUST 为 `release-<version>`
- **AND** 发布任务分支 MUST 为 `tasks/release-<version>`
- **AND** canonical worktree path MUST 为 `<workspace-root>/.worktrees/release-<version>`
- **AND** `<version>` MUST 是不带 `v` 前缀的完整 package version

#### Scenario: 新发布 worktree 先准备依赖
- **WHEN** Agent 创建了新的 Buildr 发布 worktree
- **THEN** Agent MUST 在该 worktree 的 `projects/product` 中执行 `npm ci`
- **AND** `npm ci` MUST 发生在版本文件修改、发布材料修改和候选验证之前
- **AND** `npm ci` 失败时 Agent MUST 停止发布准备并报告依赖准备阻塞

#### Scenario: 继续已有版本的发布任务
- **WHEN** `tasks/release-<version>` 和对应 canonical worktree 已存在
- **THEN** Agent MUST 复用该分支和 worktree
- **AND** Agent MUST 在依赖缺失或 lockfile 已变时重新执行 `npm ci`
- **AND** Agent MUST NOT 为同一版本创建第二个发布任务 identity

### Requirement: squash 发布候选以 tree identity 幂等衔接回 dev
Buildr Product Project 的发布引导 MUST 在 `dev -> main` 发布 PR squash merge 后，以已验证候选的 Git tree identity 为内容门禁，将 squash `main` 的历史幂等衔接回 `dev`。

#### Scenario: squash 后候选 tree 完全一致
- **WHEN** `dev -> main` 发布 PR 已按仓库策略 squash merge
- **AND** `origin/main^{tree}` 与已通过完整验证的 candidate tree identity 相同
- **AND** `origin/dev^{tree}` 与该 candidate tree identity 相同
- **THEN** Agent MUST 将 `origin/main` 的历史衔接到 `dev`
- **AND** 衔接 commit MUST 保持与 candidate tree identity 相同的 Git tree
- **AND** Agent MUST 普通 push `dev` 并确认远端 `dev` 包含该衔接
- **AND** Agent MUST NOT 仅因 squash commit 或衔接 commit 的 commit identity 不同而重复执行已通过的完整候选验证

#### Scenario: main 已是 dev 祖先
- **WHEN** Agent 准备执行 squash 后历史衔接
- **AND** `origin/main` 已是 `origin/dev` 的祖先
- **THEN** Agent MUST 将历史衔接视为已完成
- **AND** Agent MUST NOT 重复创建历史衔接 commit

#### Scenario: squash 结果与已验证候选 tree 不一致
- **WHEN** `origin/main^{tree}` 或 `origin/dev^{tree}` 与已记录的 candidate tree identity 不同
- **THEN** Agent MUST 停止自动历史衔接、push 和后续 tag 动作
- **AND** Agent MUST 报告实际 tree identity、预期 candidate tree identity 和需要重新评估的 ref
- **AND** Agent MUST NOT 使用 `ours` merge、force push、reset 或其他历史操作掩盖内容差异

#### Scenario: 远端 ref 在衔接前发生竞争更新
- **WHEN** tree identity 检查后、历史衔接或 push 前 `origin/main` 或 `origin/dev` 不再指向已检查的 ref
- **THEN** Agent MUST 停止尚未执行的历史衔接和 push
- **AND** Agent MUST 重新 fetch 并从 tree identity 门禁开始重新评估

#### Scenario: 发布授权覆盖发布专用历史衔接
- **WHEN** 用户当前轮次明确要求准备 Buildr 候选版或稳定版
- **AND** 历史衔接的 tree identity 门禁已通过
- **THEN** Buildr Release Skill MAY 自动创建仅衔接 squash `main` 历史且不改变 tree 的 merge commit
- **AND** 该授权 MUST NOT 扩展为通用 Git Ops 或 Task Finish 的 merge commit 授权
- **AND** 该授权 MUST NOT 包含 force push、改写共享分支历史或解决内容冲突

### Requirement: task-triage 路由任务驾驶舱
Buildr 的 task-triage Skill MUST 在理解任务意图和影响范围后判断任务驾驶舱（任务看板）是“不需要”“创建”还是“继续维护”，并 MUST 在需要看板时引导 Agent 使用独立 `task-cockpit` Skill，而不是在 task-triage 中复制完整可视化流程；创建看板前 MUST 已解析至少一个真实 OpenSpec change。

#### Scenario: 复杂任务需要任务看板
- **WHEN** task triage 发现任务跨批次、跨 change、跨服务或团队，存在交叉依赖、长期跟踪或多次用户判断
- **THEN** task triage MUST 将任务看板判定为“创建”或“继续维护”
- **AND** Agent MUST 使用 `task-cockpit` 执行创建或维护

#### Scenario: 看板需要先建立 change 锚点
- **WHEN** task triage 判定复杂任务需要创建任务看板但尚无已创建的 OpenSpec change
- **THEN** task triage MUST 先将任务路由到 change-flow 并创建、核实 change
- **AND** Agent MUST NOT 用未来 change 名称或普通计划代替真实关联

#### Scenario: task triage 输出看板状态
- **WHEN** task triage 选择创建或继续维护任务看板
- **THEN** 面向用户的路径判定 MUST 在可确认时包含 task id、看板路径、关联 change 和当前状态
- **AND** task triage MUST NOT 猜测尚未解析的 Project、change 或文件路径

### Requirement: 任务进展回复保持驾驶舱可发现
Buildr task workflow guidance MUST 要求 Agent 在驾驶舱首次创建、实质更新、用户询问进度、任务暂停或完成时提供驾驶舱入口，并 MUST 避免在没有状态变化的每条短暂中间消息中机械重复链接。

#### Scenario: 实质状态变化后回复
- **WHEN** 驾驶舱对应任务的阶段、目标、方案、完成项、阻塞或验证结论发生实质变化
- **THEN** Agent MUST 先更新驾驶舱再汇报进展
- **AND** 回复 MUST 包含驾驶舱入口

#### Scenario: 短暂中间动作
- **WHEN** Agent 仅执行没有改变任务认知的短暂命令或检查
- **THEN** Agent MAY 省略驾驶舱链接
- **AND** 驾驶舱 MUST 在下一次实质状态回复中继续可发现

### Requirement: 内置任务资产审查与任务收尾保持分层
Buildr MUST 通过独立场景化 Skill 提供任务执行质量反思和资产沉淀审查，并 MUST 由 `task-finish` 在轻量资格判断命中后，在不改变现有收尾成功条件和授权边界的前提下非阻塞调用该能力。

#### Scenario: 用户要求复盘或沉淀任务成果
- **WHEN** 用户要求复盘任务执行质量或把可复用成果沉淀为 Rule 或 Skill
- **THEN** Buildr MUST 通过 `task-asset-review` Skill 指导 Agent 审查可观察任务节点和最终证据
- **AND** `task-triage`、`task-worktree` 和 `task-finish` MUST 继续分别负责语义分流、任务环境和完整收尾

#### Scenario: Task Finish 先检查当前任务语义完整性
- **WHEN** `task-finish` 准备完成一个包含 OpenSpec change 的任务
- **THEN** `task-finish` MUST 对照用户已确认目标和决策、change artifacts、最终实现及验证结果检查当前任务语义完整性
- **AND** 任务范围内的语义缺失或实现偏差 MUST 在资产审查门控前停止收尾并回到修正流程

#### Scenario: Task Finish 复用 OpenSpec contract sidebar
- **WHEN** 当前任务的语义完成检查通过且包含 active OpenSpec change
- **THEN** `task-finish` MUST 继续使用 proposal、pre-sync 和 post-sync contract checks 验证已记录契约、baseline、canonical specs、active conflict 和同步结果
- **AND** `task-asset-review` MUST NOT 重复承担当前 change 完整性或契约一致性判断

#### Scenario: Task Finish 先执行轻量资格判断
- **WHEN** `task-finish` 已确认当前任务候选 tree 和最终验证证据有效
- **THEN** `task-finish` MUST 先根据当前上下文检查工作边界纠正、假设被推翻、有效失败根因、无效重复、token 浪费、新长期约束、可复用流程或明确 Rule/Skill 候选等强信号
- **AND** 该资格判断 MUST NOT 调用工具、重新读取任务文件或加载完整 `task-asset-review`

#### Scenario: 轻量资格判断未命中
- **WHEN** `task-finish` 没有发现任何完整审查强信号
- **THEN** `task-finish` MUST 跳过 `task-asset-review` 并继续正常收尾
- **AND** 最终报告 MUST NOT 为形式完整增加任务复盘

#### Scenario: 轻量资格判断命中
- **WHEN** `task-finish` 发现至少一个完整审查强信号，且任务上下文与 worktree 证据仍可访问
- **THEN** `task-finish` MUST 调用 `task-asset-review` 或复用当前候选 tree 的有效审查结果
- **AND** 审查 MUST 在归档、提交、集成和清理的既有边界内保持只读和非阻塞

#### Scenario: 条件审查没有候选
- **WHEN** `task-finish` 的资格判断命中并执行任务资产审查，但没有重要质量发现或合格沉淀候选
- **THEN** `task-finish` MUST 继续正常收尾
- **AND** 最终报告 MAY 不增加形式化复盘内容

#### Scenario: 条件审查不可用或失败
- **WHEN** 资格判断命中，但 `task-asset-review` 已被用户卸载、当前 runtime 无法发现该 Skill，或审查执行失败
- **THEN** `task-finish` MUST 报告跳过或降级原因并继续正常收尾
- **AND** Buildr MUST NOT 将审查成功作为归档、提交、集成、推送或清理的新增前置条件

#### Scenario: 条件审查发现沉淀候选
- **WHEN** `task-finish` 的任务审查发现合格沉淀候选
- **THEN** `task-finish` MUST 在最终收尾报告中说明候选摘要、证据、目标资产和 scope
- **AND** `task-finish` MUST NOT 中断收尾等待确认、直接写入组织资产或把“收尾”解释为写入授权

#### Scenario: 当前能力不依赖任务 Hook
- **WHEN** Buildr 执行或描述任务资产审查
- **THEN** Buildr MUST 将当前 session 可访问的节点和最终证据作为输入
- **AND** Buildr MUST NOT 要求或规划 runtime Hook、daemon、watcher、事件总线或完整轨迹存储

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
