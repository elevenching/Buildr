## Why

Buildr 已有 fast、affected、workspace、package 和 candidate 分层，但 step identity、命令、依赖、预算、并发边界和输入范围仍分散在 shell、Candidate 数组及两个局部 registry 中；`test:affected` 依赖人工选择 group，也无法解释一个 Git 改动为什么需要某项验证。第三批需要把这些事实收敛为一个可验证的 DAG，让日常文档小改只运行匹配检查，而最终 Candidate 仍无条件执行完整门禁。

## What Changes

- 建立唯一 verification step registry，声明稳定 id、命令、inputs、dependencies、profile/group、budget、concurrency class 和 artifact 需求。
- 建立 fail-closed planner：按 profile、人工 group 或 Git changed paths 选 step，展开依赖、去重并输出选择原因。
- 建立有并发上限的 DAG scheduler，只有依赖完成且 concurrency class 有容量时才启动 step，失败后不启动依赖它的后续 step。
- 新增 `npm run test:changed`，支持默认 Git diff、`--base <ref>`、显式路径与 `--plan`，普通文档改动只选择轻量 docs verifier。
- 让 fast、affected 和 Candidate 从统一 registry 取步骤；Candidate 继续忽略 diff 并执行完整 release gate，共享 tarball 仍由冻结候选 run 唯一生成。
- 迁移现有 Workspace/package registries 为统一 registry 的可选择子集，保持既有 selectors 与兼容入口。
- 不改变 Buildr 用户 CLI、workspace 资产格式或正式发布前完整 Candidate 要求，不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-verification-quality`: 新增统一 step registry、DAG 调度、diff-aware changed plan、计划解释与最终 Candidate 完整性要求。
- `cli-modular-architecture`: 新增验证入口必须共享单一声明源、薄 wrapper 和 registry/planner/scheduler 依赖方向约束。

## Impact

- 影响 `tools/verification/`、`verify-buildr-product-fast`、`verify-buildr-product-affected`、Candidate、Workspace/package selectors、timing budgets 与 `package.json` scripts。
- 新增 planner/scheduler/docs quality 的 Node tests 和架构门禁。
- 更新验证职责矩阵、CLI 架构、release checklist、Product README 与任务驾驶舱。
- 不引入外部运行时依赖；glob、Git diff 和 DAG 算法使用 Node 与 Git 实现。
