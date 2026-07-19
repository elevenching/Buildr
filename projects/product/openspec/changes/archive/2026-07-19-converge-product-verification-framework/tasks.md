## 1. 统一 Focus 入口

- [x] 1.1 扩展 verification planner，使其可以按稳定 step id 和 group 生成去重计划并展开真实依赖
- [x] 1.2 新增 `test:focus` 入口，支持 selector 列表、step/group 执行、plan/JSON 输出和未知 selector fail closed
- [x] 1.3 收敛 `package.json` 验证 scripts，移除 affected/package/workspace 平级入口、将 release 降为 CI 兼容 wrapper，并将 unit coverage 改为观测命名
- [x] 1.4 为 focus parser、planner、执行计划和迁移后的 package/workspace/release selector 补充直接测试

## 2. 收紧 Registry 与 Changed 规划

- [x] 2.1 清理只表达门禁顺序的 DAG 假依赖，仅保留候选 artifact 的真实 producer/consumer 关系
- [x] 2.2 收窄 Unit、Contract、Fast Integration、CLI architecture inputs，并验证单一实现 owner 不展开全部低成本测试层
- [x] 2.3 将 docs quality 纳入 Candidate，增加 artifact dependency invariant，并移除固定 Candidate step 数量契约
- [x] 2.4 运行 Unit、Contract、Fast Integration、focus 和 changed planner 的直接验证

## 3. 收缩重复生命周期与维护文档

- [x] 3.1 从 repository onboarding 删除重复 init/doctor happy path，保留干净 checkout、开发 CLI 安装和 update source 证据
- [x] 3.2 更新验证职责矩阵、release checklist、CLI architecture、README 和 current-state knowledge，统一三门禁加 focus 的心智模型
- [x] 3.3 更新源码和当前 CI/维护入口引用，确认旧 selector 均可映射到 focus step/group 且不改写历史归档 artifacts
- [x] 3.4 运行 `test:changed -- --plan` 和代表性的 focus group/step，确认选择原因、去重和真实依赖符合契约

## 4. 契约与候选验证

- [x] 4.1 建立 OpenSpec baseline 并通过 proposal contract check
- [x] 4.2 运行 OpenSpec strict validation 和本 change 的受影响范围验证，修复所有 finding
- [x] 4.3 审阅最终 diff、验证 owner 没有减少并冻结完整候选 tree
- [x] 4.4 在包含最终任务状态的冻结 tree 上运行一次 `npm run test:candidate`，读取 timing summary 并确认全部门禁通过
