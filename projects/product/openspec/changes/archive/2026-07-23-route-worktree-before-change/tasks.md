## 1. 任务分流与 OpenSpec 路由

- [x] 1.1 扩展 `task-triage` 的判断目标、步骤和用户可见输出，独立表达执行形态、worktree 结论与依据
- [x] 1.2 在 `change-flow + implementation` 与 `code-only + implementation` 场景中明确先使用 `task-worktree`，纯元内容和待确认场景保持各自边界
- [x] 1.3 扩展 OpenSpec propose contribution，在首次 artifact 写入前提供直接入口兜底，并保持上游 `openspec-propose` 正文不变
- [x] 1.4 运行 package 静态检查和相关专项测试，验证 Skill 源与 contribution 的最小反馈

## 2. 防回退验证

- [x] 2.1 扩展 package 静态 verifier，检查 task triage 的位置判断、propose 写入前门禁和既有 worktree 单写入约束
- [x] 2.2 增加组合场景测试，覆盖实现型 change、直接 propose、纯元内容、code-only 和 artifacts 升级为实现
- [x] 2.3 验证 installed runtime 同时包含正常路由与直接入口兜底，且 manifest、capability contract 和 binding 未被意外修改
- [x] 2.4 运行 affected 验证并修复发现的问题

## 3. 候选收敛

- [x] 3.1 复审 proposal、design、delta spec、Skill guidance、测试和实际 diff 的一致性
- [x] 3.2 同步所需生成资产，并确认主 workspace 不存在本 change 的重复 artifacts
- [x] 3.3 冻结最终候选并运行 Product Candidate 验证，记录候选 identity、完整性、wall-clock、最慢阶段和 evidence 生命周期
