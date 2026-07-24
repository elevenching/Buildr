## Context

当前 `buildr worktree create` 只接受同时为 Buildr Workspace 根和 Git repository 根的 `--target`，并在 `<workspace>/.worktrees/<task-id>` 创建一个 root worktree。它没有消费 Project/Service registry 中的独立 Git source，也没有为后续命令返回可验证的执行上下文。`task-worktree` Skill 已要求 artifacts、实现和候选验证留在 canonical checkout，但该要求主要依赖 Agent 自律；`task-verification` 只绑定候选内容 identity，不能证明命令实际来自任务 checkout。

Git worktree 隔离 working tree 和 index，但天然共享同一 repository 的 objects、refs 与 worktree metadata，因此“隔离环境”不能解释为独立 clone 或 OS/容器沙箱。Codex 桌面端的 Worktree chat 同样以一个 Git repository 为单位；其 integrated terminal 绑定所选 project/worktree，但不会自动为 Workspace 下的其他独立 Git repositories 建立 worktrees。Buildr 需要在 Codex 单仓入口之上组合多仓 task environment。

## Goals / Non-Goals

**Goals:**

- 一个 task id 对应一个 canonical task environment，包含 Workspace 根 worktree 和零到多个显式选中的独立 Project/Service repository worktrees。
- 所有 repository checkout 在 task environment 内保持 canonical Workspace 相对路径，使 Rules、Project/Service metadata、构建脚本和跨仓相对引用继续成立。
- 创建、复用、检查、验证和清理共享同一 environment identity，并在 checkout、branch、remote、target 或 evidence 不匹配时 fail closed。
- 保持单仓调用兼容的用户体验，并允许 Agent/Codex 把 task environment root 当成一个新本地工作目录。
- 对隔离保证做精确披露：source/index、CLI target、preview 和 evidence 可隔离；Git shared metadata 与未声明的进程/外部副作用不在 worktree 的自动保证内。

**Non-Goals:**

- 不把多个 Git repositories 合并成一个 repository、submodule 或 monorepo。
- 不让 Codex 自带 Git diff/stage UI 同时原生管理多个 repositories；多仓 Git 生命周期仍由 Agent 与 Buildr provider 编排。
- 不自动包含 Workspace 中全部 repositories；任务范围必须显式选择。
- 不自动隔离数据库、Docker daemon、远端环境、账号、凭证或任意项目缓存。
- 不提供跨多个远端 repository 的原子 push；部分远端操作成功时保留事实并停止后续动作，不伪造回滚。

## Decisions

### 1. Task environment 以 Workspace 根 worktree 为入口

`<workspace>/.worktrees/<task-id>` 继续作为 environment root，同时也是 Workspace 根 repository 的 worktree。独立 Project/Service repository worktrees 按 registry 的 `source.path` 创建在该根目录下，例如：

```text
<workspace>/.worktrees/<task-id>/
  .buildr/
  projects/
    foundation/
      services/
        business-common/   # independent repository worktree
    meat/
      services/
        freshx-meat/       # independent repository worktree
```

这样 Codex 可以把 environment root 作为一个 project/worktree 打开，终端和文件操作自然位于同一目录树；Project/Service 的 canonical path、嵌套 `AGENTS.md` 和相对构建入口无需重写。独立 repository 的 `.git` worktree metadata 仍指向各自原始 repository 的 common Git dir，这是 Git worktree 的正常共享边界。

替代方案是在 `.worktrees/<task-id>/repos/<repo-id>` 建立扁平目录，再生成路径映射或 symlink。该方案会破坏 canonical path、Rule 发现和现有脚本假设，因此不采用。

### 2. Repository set 必须显式选择并从 registry 解析

`buildr worktree create` 保持默认只包含 Workspace root；多仓任务通过重复的 selector 显式加入 `project:<project>` 或 `service:<project>/<service>`。Buildr 从 canonical registries 解析 `source.path`、remote 和 `integrationBranch`，再用实际 `git rev-parse --show-toplevel` 和 remote URL 核对 source repository。

同一 remote URL 不代表同一 Workspace entity；不同 source paths 即使指向相同 remote，也按独立 repository boundary 处理，避免错误合并不同 integration branches。选择非 Git entity、路径越界、nested target 被 root repository 跟踪、remote 冲突或 selector 重复不一致时，在创建前 fail closed。

默认任务分支在每个 repository 中使用相同逻辑名 `codex/<task-id>`；root start point 保持显式参数/既有默认，Project/Service 默认使用声明的 `integrationBranch`。调用方可对具体 selector 显式覆盖 start point，但 Buildr 不根据当前 checkout 漂移猜测稳定基线。

### 3. 创建采用完整预检和可恢复的非原子应用

CLI 先解析并验证整个 repository plan，再进行任何 `git worktree add`。全部预检通过后按 root、Project、Service 顺序创建。Git 不提供跨 repository 事务；中途失败时，Buildr 记录 environment 为 `blocked`，保留已创建 checkout，返回逐仓状态和 `nextActions`，不自动删除或回滚用户可恢复的 Git 状态。相同 plan 重试必须幂等继续；不同 plan 重用同一 task id 必须拒绝，除非通过未来显式扩展动作改变 repository set。

本地 control receipt 存在 root repository 的 shared Git metadata 下，而不是 task checkout 的 tracked tree；它记录 task id、environment root、owner Agent、source workspace、repository set、branch/start point 与生命周期状态。receipt 不成为组织源资产，也不随 commit/push 传播。

### 4. Task environment context 成为阶段门禁

CLI 提供机器可读的 create/inspect/context 结果。context identity 至少包含：

- `taskId`、owner Agent、source Workspace 和 environment root；
- 每个 repository entity、source repository、checkout path、relative path、branch、HEAD、dirty 与 remote comparison；
- 当前请求路径所属 repository、允许执行根和 CLI source；
- environment state 与可执行 next actions。

`task-triage` 负责选择环境；`task-worktree` 负责创建、检查和返回 context；实现动作必须把工具 `workdir` 设置为 environment root 或其中目标 repository，并使用 task checkout 内可用的 CLI 入口。正式验证在 task-environment 模式下必须消费 context identity，并将实际 execution root 与 repository candidate set 写入 evidence。Task Finish 只接受同一 task environment 产生且覆盖待交付 repository set 的 evidence。

不为每个命令增加全局透明 cwd 重写。透明重写会隐藏错误调用并让裸 `buildr` 的主开发入口含义不稳定；显式 context 检查和 evidence fail-closed 更可审计。

### 5. JSON contract 升级并保留单仓迁移路径

`worktree create` JSON 升级到 `buildr.worktree-create/v2`，用 `environment` 和 `repositories[]` 表达多仓状态；单仓结果仍包含一个 Workspace root repository。旧顶层 `workspaceRoot`、`taskId`、`state`、`treeChanged`、`ready`、`bootstrap`、`blocked` 和 `nextActions` 在 v2 保持等价字段，方便调用方迁移，但 schema identity 明确变化，避免把新增多仓语义伪装成 v1。

### 6. Preview、验证和收尾都按 environment owner 工作

Local App preview 的 owner identity 从单一 worktree path 扩展为 task id、environment root 和运行 Buildr Product 的具体 repository checkout。实例命名空间仍彼此隔离；stop/cleanup 只操作同一 environment owner。

多仓验证 evidence 返回 repository candidates 列表和 task environment identity。单仓/非 worktree 验证继续支持原 contract，不要求 task environment。

Task Finish 对 repository set 逐仓执行验证、提交和 integration provider；任何仓库无法消歧、存在无关 dirty changes、证据不覆盖或集成失败时，保留整个 environment。所有仓库已经安全集成后，先停止当前 environment 的 preview/本机资源，再按 nested repositories 后 root 的顺序清理 worktrees；其他 task environments 不受影响。

### 7. 隔离级别必须进入用户和 evidence 表达

Task environment 报告 `isolation`：

- `source: isolated`：working tree 与 index 独立，写入路径受 context 检查；
- `gitMetadata: shared`：objects、refs 与 worktree metadata 由 Git repository 共享；
- `localRuntime: namespaced | declared | unknown`：preview/evidence 等 Buildr-owned 状态为 namespaced，Project 声明的临时副作用按声明处理，其他状态为 unknown；
- `externalSystems: project-owned`：外部依赖沿用 Project 既有环境；仅共享可变状态需要项目已有边界或授权。

只有 source、CLI target 和 evidence 全部匹配，才能声称“任务代码与验证已收敛到 task environment”；不得简写为整个操作系统环境完全隔离。

## Risks / Trade-offs

- [嵌套 worktree target 与 root tracked path 冲突] → 创建前使用 root index 和 registry path 做完整预检；任何被跟踪或越界路径直接阻塞。
- [多个 repository 创建中途失败] → 保存 blocked receipt 和逐仓结果，幂等重试，不自动删除已创建 checkout。
- [同一任务跨仓分支基线不同] → 每个 repository 单独记录 start point/HEAD；Task Finish 逐仓核验目标 integration branch。
- [Codex Git UI 只展示入口 repository] → 明确这是 Codex 原生限制；Agent 使用 Buildr context、逐仓 Git evidence 和 integrated terminal，不能把 UI 单仓 diff 当作多仓完整证据。
- [Agent 仍有权限访问 environment 外路径] → Skill 要求显式 workdir，CLI/context 和 verification evidence fail closed；需要强 OS 边界时由 Codex sandbox/workspace roots 或组织 hook 额外限制，Buildr 不虚构权限隔离。
- [构建缓存、端口或外部数据冲突] → Buildr-owned 状态使用 task namespace；Project verification 声明 effects/environment；unknown/shared effects 必须阻塞或取得授权。
- [多仓远端 push 部分成功] → 不自动回滚或 force push；保留 environment，报告逐仓远端事实和剩余动作。

## Migration Plan

1. 新增 task-environments capability、v2 JSON schema、repository plan/receipt 和多仓 integration fixtures。
2. 保持无 selector 的单仓创建行为，在文档与 Skill 中迁移到 environment 术语。
3. 增加 context inspection 与验证 evidence 字段，再更新 Task Finish/preview consumer。
4. 更新 packaged Skills、contracts、static validation 和 runtime projection tests。
5. 用单仓向后路径、Jixian 风格 nested Service repositories fixture、错误 checkout/evidence 和并发 preview 场景验证。
6. 发布后旧 v1 worktree 没有 receipt 时只读识别为 legacy single-repo environment；需要继续开发时显式 adopt/重建 context，不根据目录名静默推断多仓集合。

回滚时保留现有 Git worktrees，不删除用户分支；恢复旧 CLI 后，v2 receipt 作为未知本机状态被忽略，用户仍可用标准 Git 命令处理 checkout。

## Open Questions

- 本 change 先实现创建时固定 repository set；运行中动态 add/remove repository 是否需要后续独立能力。
- Codex app 是否未来提供原生 multi-root/multi-repository worktree UI；Buildr 当前按单入口目录树适配，不依赖未公开能力。
