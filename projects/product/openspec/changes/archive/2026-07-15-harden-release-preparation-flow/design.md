## Context

Buildr 的发布流程由 Product Project-local `buildr-release` Skill 编排，日常开发在 `dev`，已验证候选通过 `dev -> main` PR 按仓库策略 squash merge。通用 `task-worktree`、`task-finish` 和 `git-ops` 提供 worktree、验证证据和线性任务集成边界，但不拥有 Buildr 产品发布的 `dev/main` 特殊拓扑。

当前流程有三个未被统一编排的缺口：

1. 发布任务分支由 Agent 临时命名，无法通过版本稳定定位和复用。
2. worktree checkout 不包含 `node_modules`，如果等到首次验证才运行依赖准备，会把可预防的环境缺失误报为候选失败。
3. squash merge 会在 `main` 创建新 commit identity，即使文件 tree 与已验证候选一致，`main` 也不会自动成为 `dev` 祖先；下次 `dev -> main` PR 可能因旧 merge base 产生大量伪冲突。

利益相关方是 Buildr 维护者和执行发布的 Agent。本设计不向用户 workspace 分发新 CLI 能力，而是收敛 Buildr 自举 Product Project 的发布 Skill 和契约。

## Goals / Non-Goals

**Goals:**

- 让发布任务通过版本号获得唯一、可预测的分支和 worktree identity。
- 让新发布 worktree 在任何版本文件修改或验证前具备 lockfile 定义的依赖。
- 让 squash merge 后的 `main -> dev` 历史衔接自动、幂等，并且只在已证明内容完全一致时执行。
- 复用候选 tree 的完整验证证据，不因 squash commit identity 或历史衔接 commit 重复运行产品 E2E。
- 为分支命名、操作顺序、tree 门禁、幂等性和 fail-closed 边界提供可重复验证。

**Non-Goals:**

- 不改变通用 task branch 命名、Git Ops 的 fast-forward-only 默认策略或普通 task-finish 授权。
- 不将 `npm ci` 扩展为所有 workspace/worktree 的通用硬编码命令；它只是 Buildr Product Project 发布任务的明确准备步骤。
- 不修改 npm publish、Git tag、GitHub Environment 审批、dist-tag 或发布后验证契约。
- 不引入 GitHub App、自动化 bot 或新的 CLI command。

## Decisions

### 1. 发布 identity 由目标 package version 唯一派生

发布任务 branch 固定为 `tasks/release-<version>`，task id 固定为 `release-<version>`，canonical worktree 固定为 `<workspace-root>/.worktrees/release-<version>`。`<version>` 使用不带 `v` 的完整 package version，例如 `0.1.0-rc.4`。

这使检查、准备、继续和排查可以对同一版本幂等定位已有 worktree。替代方案是保留 Agent 临时命名或只约定 `release-*` 前缀；它们不能对“继续发布”提供唯一 identity，因此不采用。

### 2. `npm ci` 是新发布 worktree 的 prepare gate

只有“新创建”发布 worktree 立即在 `projects/product` 运行 `npm ci`。该命令使用 committed lockfile，失败时停止版本文件修改、验证和 Git 集成。复用已有 worktree 时先检查依赖是否可用；缺失或 lockfile 已变时再运行 `npm ci`，不必在每次继续工作时无条件重装。

替代方案是依赖验证脚本的“缺什么再提示”，但这会把环境准备失败混入候选质量结果，因此不采用。

### 3. squash 后以候选 tree hash 证明内容等价

在候选完整验证通过后记录 `candidateTree = <validated-head>^{tree}`。PR squash merge 后 fetch `origin/main` 和 `origin/dev`，并要求：

```text
origin/main^{tree} == candidateTree
origin/dev^{tree}  == candidateTree
```

两者任一不一致都说明 squash 结果或共享 `dev` 已包含未验证内容，流程必须 fail closed，不得自动解决。

比较 commit SHA 会在 squash 下必然失败；比较 diff 文本又不如 tree object identity 直接和完整，因此选择 Git tree hash。

### 4. 历史衔接是 release-specific `ours` merge，但只能在 tree gate 后执行

如果 `origin/main` 已是 `origin/dev` 祖先，衔接已完成，直接返回成功。否则在确认两个远端 ref 仍指向已检查值后，从本地 `dev` 创建以 `origin/main` 为第二父提交的 `ours` merge commit，再次校验 merge 前后 tree 与 `candidateTree` 相同，然后普通 push `dev`。

`ours` 只用于已证明 tree 完全一致的历史拓扑衔接，不是冲突解决策略。该 merge commit 是 `buildr-release` 在“准备候选版/稳定版”授权内的发布专用状态收敛，不修改通用 Git Ops 和 Task Finish 对 merge commit 的默认禁止。

替代方案是 rebase 或 reset `dev` 到 squash `main`，但会改写共享分支历史；另一方案是不衔接、等下次 PR 临时解决冲突，会重复当前故障。两者都不采用。

### 5. 编排所有权保留在 Product Project-local `buildr-release`

分支 identity、Product Project `npm ci`、`dev/main` squash 拓扑和发布授权是 Buildr 自举维护事实，不应污染分发给用户 workspace 的通用 `task-worktree`、`task-finish` 或 `git-ops` Skill。因此主流程变更保留在 `projects/product/skills/buildr-release/SKILL.md`，仅在 canonical `agent-task-workflows` spec 记录发布特例的产品契约。

## Risks / Trade-offs

- [分支保护拒绝 `dev` merge commit] → 在发布前检查 branch protection 与当前身份是否允许该发布专用衔接；push 被拒绝时停止，不使用 force push。
- [tree identity 一致但生成物或外部状态不一致] → tree gate 只证明 Git 内容；npm/GitHub 状态仍由已有发布事实检查独立验证。
- [同名版本 worktree 残留] → 按已有 task-worktree reuse 契约检查并复用；存在 dirty 或无法证明归属时停止，不自动删除。
- [`npm ci` 增加准备时间] → 只对新建或依赖无效的发布 worktree 执行，用小量确定性成本换取更干净的验证信号。
- [squash 后 `dev` 在历史衔接前被更新] → fetch 后比较 ref SHA 和 tree identity，并在 merge/push 前再次确认远端 ref 未变；发生竞争时停止重新评估。

## Migration Plan

1. 先更新 delta spec、`buildr-release` Skill 和发布文档，并增加静态契约与 Git fixture 验证。
2. 本 change 完成后，下一个新版本直接使用 `tasks/release-<version>` 和新流程；已发布版本不回溯改名或重建 worktree。
3. 如果自动历史衔接在真实 branch protection 下被拒绝，保留已发布 `main`、tag 和远端 `dev` 现状，报告阻塞；不删 tag、不 force push、不回滚已发布版本。

## Open Questions

无。
