## 1. Replacement restore 契约与测试基线

- [x] 1.1 为 replacement preflight/outcome 增加对象级 restore 授权与结果模型，明确普通 sync、显式 restore、blocked 和幂等状态
- [x] 1.2 增加直接测试 fixture，覆盖未知 `legacyIntegrities` 但 manifest/target/source 可证明为 Buildr-managed 的 predecessor，以及 foreign ownership、target conflict 和 missing predecessor
- [x] 1.3 增加历史 `openspec/knowledge/task-cockpits/*.html` 与 replacement target 隔离断言，确认所有成功和失败计划都不包含用户历史页面

## 2. Source replacement 与命令结果

- [x] 2.1 将 `restoreId` 或等价 operation mode 传入 replacement handler，只在显式 restore 下放宽 predecessor 内容完整性校验
- [x] 2.2 通过受管 mutation 完成 predecessor source/receipt 删除、canonical source 安装、manifest identity 切换和当前 receipt 写入，并覆盖失败回滚与重复执行
- [x] 2.3 调整 `builtin restore` lifecycle，以目标对象最终 outcome 判断成功；blocked、missing 或 mutation 未完成时返回失败且不输出假成功
- [x] 2.4 运行 replacement 和 Builtin lifecycle 直接相关测试，修复实现反馈后确认本任务组通过

## 3. Runtime 收敛与 Agent 诊断

- [x] 3.1 将可证明受管的 predecessor runtime orphan 纳入 restore/sync 收敛计划，ownership 无法证明时保持零写入并返回冲突路径
- [x] 3.2 更新 doctor、sync 和 restore 的 diagnostics/nextActions，区分 source 已恢复待 sync、restore blocked 与 workspace sync 完成
- [x] 3.3 增加临时 workspace CLI integration，覆盖 `task-cockpit` 未知旧版显式 restore 后 `sync codex` 删除旧 runtime、安装 `task-board` 并达到最终 doctor ready
- [x] 3.4 运行受影响的 package maintenance、runtime 和 CLI integration focused checks，确认本任务组通过

## 4. 产品资产与完整验证

- [x] 4.1 更新 Buildr Skill、CLI help 或产品文档中与 replacement restore 决策和成功语义有关的 Agent 指引，不要求用户手工移动 Skill 目录
- [x] 4.2 审计 package manifest、bootstrap/static validation、受管 mutation 路径和测试 registry，确保新增实现与验证入口都有明确 owner
- [x] 4.3 完成所有实现、自然语言资产和 review 修订后运行 `npm run test:changed`，使用失败项或 `test:focus` 完成最终候选前反馈
- [x] 4.4 审阅最终 diff、OpenSpec 状态和候选 identity，确认除最终 Candidate 结果任务外没有未完成实现或文档动作
- [x] 4.5 冻结最终实现候选后运行一次 `npm run test:candidate`，记录 candidate identity、总耗时、最慢阶段、失败阶段、evidence retention 和 cleanup 状态；成功后仅更新本任务 checkbox
