## Context

Buildr 当前已将任务验证独立为 `buildr.task-verification/v1`，但这一变化之后仍存在两类遗留：`git-ops` 继续直接叙述验证失效、复用和重跑，`task-worktree` 继续判断非 lifecycle 内容变化并重复说明自举 sync/CLI 入口。这些文本同时被静态 verifier 逐字要求，导致职责虽然在 manifest 中分离，playbook 和测试仍有交叉 ownership。

当前 capability 图是稳定基线：`git-ops` 提供三项 Git capabilities，`task-worktree` 提供 worktree lifecycle，`task-verification` 提供验证能力，`task-finish` 消费后三者。此次调整必须保持该拓扑、contract version 和替换语义不变。

## Goals / Non-Goals

**Goals:**

- 让 Git provider 只拥有 Git policy、执行效果和前后 candidate/tree 对比事实。
- 让 worktree provider 只拥有 canonical checkout、生命周期状态和由其自身 checkout 操作产生的 transition evidence。
- 让 task-verification provider/consumer 独占验证政策、Candidate evidence 有效性、复用和重跑决策。
- 删除重复段落，并用职责断言和 forbidden-text 检查防止回退。

**Non-Goals:**

- 不合并 `git-ops` 与 `task-worktree`。
- 不新增、删除或重新绑定 capability，不改变 provider identity。
- 不改变默认 rebase、fast-forward、授权、冲突或 worktree placement/cleanup policy。
- 不改变 Task Finish 状态机，也不修改 CLI 命令行为。

## Decisions

### 1. 保持 capability contract v1，只澄清交接语义

`buildr.git-task-integration/v1` 继续要求 provider 对比集成前后的候选内容并返回可审计证据，但把“复用或重跑验证的判断”明确为 tree/content 等价性信号；Candidate evidence 是否仍有效以及是否执行验证，由 task-verification provider/consumer 决定。现有 provider 仍能返回原有结果，consumer 也没有失去安全所需字段，因此无需升级 major version。

替代方案是发布 `v2` 并删除所有验证相关字段。该方案会制造 manifest、binding、replacement provider 和迁移成本，而当前只需消除 ownership 歧义，不采用。

### 2. `treeChanged` 按动作 owner 返回，不让 worktree provider观察所有内容编辑

`task-worktree` 只对自己创建、切换或清理 checkout 产生的 tree transition 返回 `treeChanged`。rebase、merge、reset 等 Git 操作由 Git provider 返回前后 identity；普通编辑和生成资产变化由调用方建立新的 candidate fingerprint。最终由 task-verification provider比较当前 candidate 与 evidence identity。

替代方案是让 worktree provider持续监控 worktree 中所有内容变化。该方案会把 lifecycle provider扩张为 watcher/verification coordinator，不符合现有 contract。

### 3. 静态验证检查职责边界，不继续固化旧段落

更新 package verifier：保留 canonical path、placement、Git 安全策略等正向断言；新增 Git provider不得执行/决定 Candidate verification、worktree provider不得判断验证复用/重跑及重复自举段落的断言。专项 contract test同时验证 capability/binding拓扑未变。

替代方案是只删除肉眼可见的重复行。该方案无法防止旧验证 policy 再次进入两个 Skills，也不能证明 replacement consumer 仍保持可组合，因此不采用。

## Risks / Trade-offs

- [Risk] 文本变短后 Agent 不知道何时重新验证。→ `task-verification`、Task Finish 和 Project rules 继续完整定义 evidence 有效性；Git/worktree providers返回 identity/transition facts供其判断。
- [Risk] contract v1 澄清被误解为兼容性变化。→ 不删除 Minimum Guarantees 或现有安全输入，只明确 decision owner，并用现有 replacement tests验证 readiness。
- [Risk] 静态 verifier 从required text改为forbidden text后覆盖不足。→ 同时保留结构性 capability/description断言，并在专项 test中检查职责和拓扑。
- [Risk] 清理范围扩张到 Task Finish。→ 本 change 不修改 Task Finish playbook；如实现发现必须改变状态机则暂停并更新 artifacts。
