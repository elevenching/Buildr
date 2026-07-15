## 1. Skill 工作流

- [x] 1.1 扩展 `git-ops` 与产品入口 Buildr Skill 的 Git 工作区转换路由和 post-transition doctor 检查点
- [x] 1.2 让 `task-worktree` 与 `task-finish` 在内部工作区转换节点复用诊断、同步询问与授权边界
- [x] 1.3 对齐 package manifest、workspace Skills manifest 中的 Skill description

## 2. 产品验证

- [x] 2.1 扩展 package 静态验证，覆盖触发/排除操作、workspace 判定、doctor、Agent 执行和手动兜底边界
- [x] 2.2 运行 OpenSpec proposal 门禁与 strict validation
- [x] 2.3 运行 fast 和 package/openspec affected verification，并修复发现的问题
- [x] 2.4 为变更的内置 Skills 声明旧版 integrity，并验证 receipt-less workspace 的受控升级

## 3. 最终候选

- [x] 3.1 审查最终 diff、任务状态和工作区状态
- [x] 3.2 运行 `npm run test:candidate`，记录 timing summary 和最慢阶段

## 4. Agent-first 反馈修订

- [x] 4.1 补齐 Product Rule、随包 Core、产品主说明与 Agent-first delta spec 的 Agent 代执行优先原则
- [x] 4.2 将 Git 转换后流程改为询问同步、用户确认后由 Agent 执行，并保留手动同步兜底
- [x] 4.3 更新任务 Skills 与 package 静态验证，防止回退为默认要求用户手动执行
- [x] 4.4 更新 OpenSpec baseline 并通过 proposal、strict、fast 和 affected verification

## 5. 修订后最终候选

- [x] 5.1 审查最终 diff、任务状态和 workspace 状态
- [x] 5.2 在全部任务完成后的最终 tree 上运行 `npm run test:candidate` 并记录 timing summary
