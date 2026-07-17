## 1. 统一发布任务 identity 和环境准备

- [x] 1.1 更新 Product Project-local `buildr-release` Skill，从完整 package version 派生 `release-<version>` task id、`tasks/release-<version>` 分支和 canonical worktree path，并要求同版本复用已有任务环境。
- [x] 1.2 在新发布 worktree 创建后加入 Product Project `npm ci` prepare gate，明确其必须先于版本/发布材料修改和验证，且失败时 fail closed。
- [x] 1.3 更新发布检查清单和相关 Product Project 维护文档，将版本化任务 identity 与依赖准备顺序表达为 canonical 发布流程。
- [x] 1.4 增加或调整发布 Skill 静态契约测试，覆盖分支/worktree 命名、同版本复用、`npm ci` 顺序与失败停止。
- [x] 1.5 运行任务组最小反馈和 `npm run test:affected -- release`，确认发布任务初始化契约通过。

## 2. 实现 squash 后 tree-identity 历史衔接

- [x] 2.1 在 `buildr-release` Skill 的准备流程中记录已验证 candidate tree identity，并在 PR squash merge 后对 `origin/main^{tree}` 和 `origin/dev^{tree}` 执行 fail-closed 一致性门禁。
- [x] 2.2 加入发布专用的幂等 `main -> dev` 历史衔接：已是祖先时 no-op，否则仅在 tree gate 通过后创建不改变 tree 的 merge commit，复核 tree 后普通 push `dev`。
- [x] 2.3 明确竞争更新、tree mismatch、branch protection/push 拒绝的停止与恢复边界，不使用 force push、reset 或 `ours` 掩盖内容差异。
- [x] 2.4 增加临时 Git repository fixture 或等价行为测试，覆盖 tree 一致成功衔接、已衔接幂等 no-op、tree mismatch 停止和远端 ref 竞争。
- [x] 2.5 运行任务组最小反馈和 `npm run test:affected -- release`，确认 squash 后拓扑收敛不会改变候选 tree 或重复消耗完整验证证据。

## 3. 契约、事实与最终候选验证

- [x] 3.1 对齐 `agent-task-workflows` canonical 契约、Buildr current-state knowledge、`buildr-release` Skill 和发布文档，确认发布特例不扩展通用 Git Ops/Task Finish 授权。
- [x] 3.2 运行 `git diff --check`、OpenSpec strict validation 和 proposal 契约门禁，确认 delta Requirement identity 与 baseline 完整。
- [x] 3.3 冻结全部实现、自然语言资产、测试和 review 修订后，运行一次 `npm run test:candidate`，读取 timing summary 并报告总耗时、最慢阶段、失败阶段和 summary path。
