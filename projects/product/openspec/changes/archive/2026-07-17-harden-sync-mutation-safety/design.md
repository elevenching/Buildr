## Context

`syncRuntime()` 当前先用集合根路径开启 `withWorkspaceMutation()`，在回调内执行 Builtin 与 Component reconcile，最后才检查用户决策点。事务因此会完整复制 `projects/`，失败时再递归删除并恢复整个目录。普通临时 workspace 中回滚通常成功，现有测试只看到最终内容不变；在包含多个活跃独立 Service 仓的大型 workspace 中，快照成本和递归删除失败的影响面都不可接受。

现有 Builtin 已有只读状态识别，Component 也已有 `buildComponentReconcilePlan()`，但两者尚未组合成 `sync` 的统一计划。registry convergence 仍是边扫描边写，mutation primitive 也没有删除重试、恢复后验证或成功 recover 回执。

## Goals / Non-Goals

**Goals:**

- 用户决策点在创建 mutation lock、transaction 或 backup 前一次性返回。
- sync 使用封闭 source plan，affected paths 只包含 Buildr 可能实际改变的精确受管文件、具体 Builtin/Component 成员，以及仅在原本缺失时需要创建的目录。
- Component preflight 覆盖 apply 使用的完整 reconcile 校验，而不是只返回 inventory 状态。
- rollback 与 recover 对短暂目录删除失败进行有限重试，验证恢复结果，失败时完整保留恢复材料。
- 同一 transaction 恢复成功后再次 recover 为可证明的成功 no-op。

**Non-Goals:**

- 不改变 Builtin 的 installed/modified/missing/uninstalled 判定。
- 不改变 source commit 后 runtime render 或 doctor 失败时保留源资产的边界。
- 不把全部 Buildr mutation 命令一次性改写成新的通用 planner。
- 不自动替用户选择 optional Builtin restore 或 uninstall。

## Decisions

### 1. `sync` 使用显式 plan/preflight/apply 三段式

新增只读 sync plan，包含 Builtin findings、Component reconcile plans、用户决策点、错误和精确 affected paths。`syncRuntime()` 先生成并校验计划；存在用户决策或 Component 冲突时直接返回，不进入 `withWorkspaceMutation()`。进入事务后再次生成计划并比较稳定签名，确认 workspace 没有在 preflight 与 commit 之间漂移，再应用已验证计划。

选择复用现有状态识别和 Component reconcile planner，而不是维护第二套冲突算法。仅在 apply 前调用现有写入函数，避免 `checkOnly` 与真实行为长期分叉。

### 2. registry convergence 提供精确 potential paths

registry convergence 仍负责已有 workspace 的 baseline 修复，但在事务前枚举其可能触达的具体路径：root/project Skills manifests、Project/Service manifests、legacy manifest、Project baseline 文件、相关父 Git repo 的 `.gitignore`，以及原本不存在且本次可能创建的 baseline 目录。

已存在的 `projects/`、Project 根、`services/` 和 Service repo 根不作为 affected path。原本不存在的空 baseline 目录可以作为 `existed: false` snapshot，以便失败时清理本次创建的目录，而不会触碰已有 Service 内容。

相比把实际写入函数完全重写为 operation DSL，这一方案能以较小改动恢复安全边界；后续如果更多命令需要 planner，可再统一抽象。

### 3. Component checkOnly 返回真实 reconcile 计划

对本次应安装、升级或恢复的随包 Component 调用 `buildComponentReconcilePlan()`，把 issues 转成 preflight errors，并汇总其成员、manifest 和 definition 精确路径。apply 使用同一计划对应的 Component 集合；事务内重检用于防止并发漂移。

不把 disabled/uninstalled 或默认不可用 Component 误当成需要 apply 的对象。

### 4. 恢复使用一个共享的验证型原语

普通 rollback 与 `mutation recover` 共用 `restoreMutationSnapshot()`：递归删除配置有限 `maxRetries/retryDelay`，删除后确认路径不存在，复制 backup 后确认目标存在且类型与 backup 一致。任何步骤失败都抛错，调用方继续保留 transaction、backup、journal 和 lock。

recover 成功后在 mutation state root 写入轻量 recovered receipt，再删除 transaction 和匹配 lock。后续对同一 ID 的 recover 读取 receipt 并报告已恢复，不重新删除或复制数据；未知 ID 仍然失败。

### 5. 用故障注入验证失败路径

扩展现有测试用故障注入，只用于确定性模拟 restore 删除失败。验证关注最终内容、Git 状态、transaction 生命周期和 recover 可重入性，不依赖 GUI 或真实后台竞态。

## Risks / Trade-offs

- [Risk] potential paths 漏掉真实写入，导致失败时不能完整回滚。→ 在受影响验证中记录 sync 前后差异，并增加静态/运行时断言：事务内写入必须落在 declared affected paths 内。
- [Risk] preflight 与 commit 之间发生外部修改。→ 事务取得 lock 后重建计划并比较稳定签名；不一致时在源资产首次写入前失败。
- [Risk] 精确文件 snapshot 数量增加。→ 以去重排序后的路径集合处理；相比复制完整 Service 树，I/O 总量显著下降。
- [Risk] recovered receipt 累积。→ receipt 很小且位于已忽略的 mutation state root；本次不引入自动清理策略，避免影响恢复审计。
- [Risk] `rmSync` 重试不能解决持续占用。→ 重试有上限，最终仍 fail closed 并保留完整恢复材料。

## Migration Plan

无需数据迁移。新版本首次 sync 即采用新 preflight 与精确事务路径；已有未完成 transaction 继续由兼容的 `mutation recover` 读取 `buildr.mutation/v1` journal。发布前在隔离 workspace 验证旧 journal、optional Builtin 决策、Component 冲突和嵌套 Git Service 仓场景。

## Open Questions

无阻塞问题。recovered receipt 的长期清理策略可在未来独立维护，不影响本次安全修复。
