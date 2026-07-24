## 1. 收尾契约与编排

- [x] 1.1 更新 `buildr.task-finish` capability contract，声明健康 Local App 的同端口交接、失败停止与结果证据。
- [x] 1.2 更新随包 task-finish Skill：在删除 task worktree 前，按“读取健康实例端口 → 主 checkout 重装入口 → 停止旧实例 → 同端口启动并验证 → 清理”的顺序执行。

## 2. 验证与交付一致性

- [x] 2.1 扩展 task-finish 相关静态契约测试，覆盖同端口成功、无健康实例和端口交接失败边界。
- [x] 2.2 运行受影响验证与 OpenSpec strict validation，确认 package/runtime 投射仍可用。
- [x] 2.3 所有实现、文档和生成资产冻结后，按 Product policy 运行一次 `npm run test:candidate` 并记录 timing summary。
