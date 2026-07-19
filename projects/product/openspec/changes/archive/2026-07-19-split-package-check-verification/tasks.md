## 1. 基线与所有权

- [x] 1.1 记录现有 `package check` 各场景耗时、断言清单和目标 owner
- [x] 1.2 为 package verifier identity、selector 和聚合完整性补充失败优先测试

## 2. Package Verifier 拆分

- [x] 2.1 建立 package verifier registry、统一 context/result contract 和内部执行入口
- [x] 2.2 将 package static validation 抽成无临时 workspace 的独立 verifier
- [x] 2.3 将 init baseline、Project baseline、existing `AGENTS.md` 和最终 doctor 抽成隔离 workspace smoke
- [x] 2.4 将 Commands/Rules/Skills 生命周期迁移到 focused package asset integration
- [x] 2.5 将 recursive Rules discovery 与 runtime bridge reconciliation 迁移到 focused runtime integration
- [x] 2.6 删除旧共享 `runPackageSmokeChecks` runner 并用架构边界防止回退

## 3. 验证入口与耗时

- [x] 3.1 让 `buildr package check` 聚合 registry 全部 verifier 并保留兼容成功/失败语义
- [x] 3.2 让 Candidate 直接编排独立 package steps，记录预算和 diagnostics
- [x] 3.3 为 affected package group 提供稳定 focused selector、去重和未知参数 fail-closed
- [x] 3.4 建立 package steps 阶段预算并验证状态隔离后才允许有界并行

## 4. 文档、驾驶舱与验证

- [x] 4.1 更新验证职责矩阵、CLI 架构、release checklist 和 package 维护说明
- [x] 4.2 更新任务驾驶舱第二批次状态、证据与下一阶段依赖
- [x] 4.3 运行 OpenSpec proposal gate、focused tests、package aggregate、affected 和完整 Candidate
- [x] 4.4 根据最终 timing 对比基线，记录收益、剩余重复和后续优化入口
