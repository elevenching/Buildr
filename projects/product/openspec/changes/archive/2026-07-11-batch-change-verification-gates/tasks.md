## 1. 任务流程源实现

- [x] 1.1 更新随包 `task-triage` Skill，使实现型 change 的任务清单按语义任务组组织，并把专项验证与最终候选验证放在正确阶段
- [x] 1.2 更新随包 `task-worktree` Skill，加入单任务最小反馈、任务组受影响范围验证、候选冻结和上层检查去重协议
- [x] 1.3 更新随包 `task-worktree` Skill，要求运行中 session/cell/process 通过 wait、poll 或 resume 复用同一进程
- [x] 1.4 更新随包 `task-finish` Skill，使失败修复循环与最终候选证据复用兼容三级验证门禁

## 2. Product Project 契约与交付一致性

- [x] 2.1 更新 Product Project 开发规则，以简洁不变量约束 apply 阶段不得逐任务运行完整 E2E，并要求候选冻结后一次完整验证
- [x] 2.2 检查 Buildr 入口 Skill、package manifest 和 workspace Skill manifest，确认无需新增 Skill 或修改外部 `openspec-apply-change` Component member
- [x] 2.3 从当前 Product checkout 同步受影响的 Buildr-owned Skills 到 task worktree runtime，并确认没有直接编辑 runtime 结果

## 3. 任务组专项验证

- [x] 3.1 扩展 `tools/buildr` 的 package 静态契约检查，覆盖三级验证、运行中进程复用、失败后专项重验和候选冻结语义
- [x] 3.2 扩展 `tools/verify-buildr-product-mvp` 的随包资产断言，覆盖相同协议并确认外部 `openspec-apply-change` 保持 Component 所有权
- [x] 3.3 运行一次受影响范围专项验证，覆盖修改后的 Skills、Product Project 规则和新增静态断言；修复期间只重跑失败项或受影响检查

## 4. 文档与审阅

- [x] 4.1 审阅 release checklist 和产品文档，按需说明分层验证入口与完整验证时机，避免复制完整 Skill 操作手册
- [x] 4.2 审阅所有自然语言代码，确认“减少重复验证”不被表述为跳过最终验证或忽略高风险即时检查
- [x] 4.3 核对 OpenSpec delta、实现、package 断言和 runtime 投射保持一致，并完成必要修订

## 5. 最终候选冻结与完整验证

- [x] 5.1 确认实现、文档、runtime 同步和 review 修订全部完成，冻结最终候选 tree
- [x] 5.2 对冻结后的候选运行一次产品级总验证；若失败则恢复受影响范围修复，候选重新稳定后再执行一次最终完整验证
- [x] 5.3 记录最终候选 tree identity 和验证证据，供后续归档、commit、集成、push 与 cleanup 复用
