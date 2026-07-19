## 1. 契约与任务看板

- [x] 1.1 建立 change baseline 并通过 proposal-stage contract check
- [x] 1.2 将当前任务驾驶舱迁移为任务看板模型并关联已归档与 active changes

## 2. Builtin Skills

- [x] 2.1 融合 task-cockpit 的批次、依赖池、change 关联和方案/技术事实分层
- [x] 2.2 升级 task-cockpit 自包含模板、runtime metadata 与 manifest 描述
- [x] 2.3 融合 task-asset-review 的源资源核对和覆盖度分类，同时保留 provider contract

## 3. 验证与当前事实

- [x] 3.1 增补任务看板和资产审查契约测试并运行 Skill 快速校验
- [x] 3.2 更新必要的 current-state 文档并通过 OpenSpec strict validation
- [x] 3.3 运行 package/contract focused tests 与最终 candidate 验证
- [x] 3.4 安装并验证当前 Product checkout 的 development CLI

## 4. Adapter 发布边界优化

- [x] 4.1 将 OpenAI metadata 修订为可选 extension 并更新 change baseline
- [x] 4.2 将 Codex/OpenAI 校验改为“存在时校验、缺失不生成也不阻塞”
- [x] 4.3 撤回无 UI 定制需求的批量 metadata，并更新文档、测试和任务看板
- [x] 4.4 运行 focused、OpenSpec strict、package 和最终 candidate 验证，并重新验证 development CLI
