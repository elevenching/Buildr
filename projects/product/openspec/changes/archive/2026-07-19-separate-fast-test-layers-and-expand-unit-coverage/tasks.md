## 1. 测试归属与入口

- [x] 1.1 建立 `test/unit`、`test/contract`、`test/integration-fast` 目录并按真实边界迁移现有测试
- [x] 1.2 新增 `test:contract`、`test:integration:fast` scripts，确保 `test:unit` 只发现 unit owner
- [x] 1.3 将三层注册为独立 verification steps，并更新 DAG 依赖、inputs 与 entrypoint contract tests
- [x] 1.4 运行三层专项测试和 fast profile，确认没有覆盖丢失或昂贵生命周期混入

## 2. Unit coverage 与核心 owner

- [x] 2.1 新增 Node 内置 `test:coverage:unit` 入口和可保存机器可读 summary 的 wrapper
- [x] 2.2 为 package validation/doctor diagnostics 的可隔离核心逻辑补直接 unit tests
- [x] 2.3 为至少一个当前无直接 owner 的 CLI domain 或 application 核心纯逻辑补 unit tests
- [x] 2.4 采集 unit-only 基线并核对测试发现范围、模块直接导入和 summary schema

## 3. 文档、驾驶舱与候选验证

- [x] 3.1 更新验证职责矩阵、release checklist 和 current-state 中的测试层级、coverage 与阈值边界
- [x] 3.2 更新任务驾驶舱第四批范围、进度、覆盖基线和验证证据
- [x] 3.3 运行 OpenSpec strict、受影响验证和最终 `npm run test:candidate`
- [x] 3.4 读取 timing summary，记录总耗时、最慢阶段、失败阶段和 summary 路径
