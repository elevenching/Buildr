## ADDED Requirements

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
