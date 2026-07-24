## 1. Capability 与包契约

- [x] 1.1 新增 `buildr.task-asset-review/v2` contract，并将 provider、binding、产品入口和 Task Finish optional dependency 迁移到 v2
- [x] 1.2 更新 package 与 workspace manifests，使完整 Skill companion resources 参与安装、同步和 runtime 投射

## 2. Observation 生命周期实现

- [x] 2.1 实现内部 observation helper，覆盖共享路径解析、最小 Markdown schema、owner 校验和原子替换
- [x] 2.2 实现 start、observe、finalize、accept、handoff、reject 与 list lifecycle actions
- [x] 2.3 增加 observation 与 asset-maintenance record 模板

## 3. Skill 协作与产品事实

- [x] 3.1 重构 task-asset-review，使其从任务开始持续轻量观察并独立完成资格审查、候选分类和人工处置
- [x] 3.2 重构 task-finish，使其只触发 finalize、等待结果并按 optional provider semantics 降级
- [x] 3.3 更新产品入口、current-state knowledge 和相关文档，说明共享 inbox、新任务 handoff 与 tracked 维护历史边界

## 4. 验证与自举

- [x] 4.1 更新静态 capability/package fixtures，覆盖 v2 路由和职责边界
- [x] 4.2 增加 helper 行为测试，覆盖跨 worktree 共享、Workspace 隔离、owner mismatch、原子写入、accept/reject 和 handoff
- [x] 4.3 运行 OpenSpec strict、contract sidebar、affected verification、package/runtime 检查和 workspace doctor
- [x] 4.4 使用新流程生成本次 task-asset-review 维护记录，并核对 observation 到 tracked record 的去向
