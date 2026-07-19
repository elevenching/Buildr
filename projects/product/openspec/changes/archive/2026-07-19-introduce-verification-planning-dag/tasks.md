## 1. 现状基线与契约测试

- [x] 1.1 固化 fast、affected groups、Workspace/package selectors 和 30 个 Candidate steps 的现有清单
- [x] 1.2 为 registry 重复 id、未知依赖、dependency cycle、未知 executor 和缺失 input owner 编写失败优先测试

## 2. 统一 Registry 与 Planner

- [x] 2.1 建立统一 verification registry，迁移 step identity、命令、inputs、dependencies、profiles/groups、budget、concurrency class 和 artifact metadata
- [x] 2.2 实现 Node 20 兼容的 Product 相对路径规范化与受限 glob matcher
- [x] 2.3 实现 profile/group/path selection、依赖展开、稳定拓扑排序、去重和 reason 解释
- [x] 2.4 实现 tracked Product inventory coverage audit，对未映射路径 fail closed
- [x] 2.5 让 Workspace/package selectors 从统一 registry 解析稳定 step identity

## 3. DAG Scheduler

- [x] 3.1 实现全局和 concurrency class 容量限制、ready queue 与稳定启动顺序
- [x] 3.2 实现 failed/blocked 传播，并保留已启动无关 step 的实际结果
- [x] 3.3 将 timing、budget、stdout/stderr diagnostics 和 blocked reason 纳入统一执行结果
- [x] 3.4 为并发上限、exclusive step、依赖失败和输出顺序补充 scheduler tests

## 4. 验证入口迁移

- [x] 4.1 将 fast wrapper 迁移到 registry profile 与统一 runner
- [x] 4.2 将 affected groups 迁移到 planner，保持 help、未知 group、重复 group 和 fast 前置语义
- [x] 4.3 将 Candidate 迁移到完整 profile，保留单一 tarball artifact、全部 gates、阶段预算和 diagnostics
- [x] 4.4 更新架构门禁，禁止入口重新内联 step 命令、预算或 group mapping

## 5. Diff-aware Changed Plan

- [x] 5.1 实现默认 base、`--base`、staged/unstaged/untracked 和显式路径收集
- [x] 5.2 新增轻量 docs quality verifier，并声明普通文档与发布/OpenSpec 文档的分层 inputs
- [x] 5.3 新增 `test:changed` 的执行、`--plan` 与 `--json` 输出，未知/越界参数 fail closed
- [x] 5.4 覆盖 docs-only、CLI、runtime、package、OpenSpec、verification framework 和未映射路径 fixtures

## 6. 文档、驾驶舱与验证

- [x] 6.1 更新验证职责矩阵、CLI 架构、release checklist、Product README 和测试入口说明
- [x] 6.2 更新任务驾驶舱第三批状态、依赖、计划示例和验证证据
- [x] 6.3 运行 proposal gate、planner/scheduler unit、代表 changed plans、affected 和入口兼容验证
- [x] 6.4 冻结最终树运行完整 Candidate，对比 30-step parity、总耗时、预算和 diagnostics
