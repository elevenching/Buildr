## 1. Workspace E2E 基础设施

- [x] 1.1 建立 Workspace E2E suite registry、独立进程 runner、`--list` 与多 selector 入口，并补充未知/重复 selector 的契约测试
- [x] 1.2 建立 suites 共享的隔离临时 workspace、CLI 执行、diagnostics 和清理 helper，保证 suites 不使用共享可变状态

## 2. 黄金路径与覆盖收敛

- [x] 2.1 实现 `workspace-lifecycle` suite，覆盖 init、Project/Service、代表性资产、Codex sync 与最终 doctor
- [x] 2.2 实现 `ownership-recovery` suite，覆盖代表性受管资产 ownership 拒绝、状态保护和恢复
- [x] 2.3 实现 `runtime-reconciliation` suite，覆盖 Codex、Claude bridge、drift fail-closed 与恢复收敛
- [x] 2.4 审查旧 MVP assertions 的 focused verifier owner，迁移仍必要的契约覆盖并删除 help、onboarding、runtime parity、package/release 重复断言
- [x] 2.5 运行 Workspace E2E selector 契约和三个 suites 的受影响验证

## 3. Candidate 编排与耗时预算

- [x] 3.1 让 Candidate 从 suite registry 直接取得并有界并行执行全部 Workspace E2E suites，保持逐 suite timing 和失败结果
- [x] 3.2 为 Candidate 总耗时与各 Workspace E2E suite 声明目标预算，在 timing summary 中输出 `budgetMs`、`budgetStatus` 和非阻断 warning
- [x] 3.3 补充 timing reporter、Candidate 全量 suite 选择及超预算不改变退出码的自动化测试

## 4. 兼容入口与维护文档

- [x] 4.1 更新 `package.json`、CLI architecture verifier 和维护文档，使用 `test:workspace` / Workspace E2E terminology
- [x] 4.2 删除旧 `verify-buildr-product-mvp` 与 `tools/verify/mvp/`，确认公开 Candidate 与历史兼容入口保持不变
- [x] 4.3 运行 `npm run test:affected -- cli package openspec` 并修复受影响范围问题
- [x] 4.4 修复开源候选扫描对 tracked deletion 的读取错误，并运行 `npm run test:affected -- public openspec`

## 5. 最终候选验证

- [x] 5.1 审阅最终 diff、覆盖职责矩阵、OpenSpec artifacts 和生成资产，完成所有候选内容修订
- [x] 5.2 冻结任务状态后运行 `npm run test:candidate`，读取 timing summary 并确认全部 suites、预算字段和失败诊断满足契约

## 6. 审阅后第一批修复

- [x] 6.1 为每个 Candidate step 落盘 stdout/stderr，扩展 timing summary 的诊断路径与运行环境元数据，并补充自动化测试
- [x] 6.2 让 Workspace E2E 在失败时保留 fixture 证据、成功时继续清理，并验证直接 selector 的失败诊断行为
- [x] 6.3 在 fast 之前完成 affected `--help`、未知 group 和重复 group 规划，拆分 `cli`/`runtime` group 并补充行为测试
- [x] 6.4 为已识别高耗时 Candidate 阶段声明非阻断预算，更新维护文档和 CI/入口说明
- [x] 6.5 新增 verification ownership matrix，记录旧 MVP section 的当前 owner、必要交叉和后续 `package check` 拆分边界
- [x] 6.6 运行第一批直接测试和 `npm run test:affected -- cli runtime openspec`，更新任务驾驶舱进度
- [x] 6.7 冻结第一批修订后重新运行完整 Candidate，并核对 timing/diagnostics 产物
