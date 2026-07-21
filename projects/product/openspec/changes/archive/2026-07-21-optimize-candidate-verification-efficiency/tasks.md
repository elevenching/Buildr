## 1. 基线与覆盖矩阵

- [x] 1.1 从同一冻结 tree 采集 Fast、单独重项和 Candidate 的多轮本机 timing 基线，记录整体耗时、executor duration、queue duration 与环境元数据。
- [x] 1.2 建立当前 Fast/Candidate required steps、integration 测试场景与 runtime adapter implementation family 的覆盖矩阵，标记每个场景的唯一主 owner。
- [x] 1.3 补充契约测试，确保后续拆分不会删除 Candidate gate、关键 recovery/migration 场景或 supported adapter 事实覆盖。

## 2. Fast Integration 分层

- [x] 2.1 将低成本 CLI update、public JSON 与 verification scheduler/timing 契约保留在 Fast Integration，使默认 Fast 不创建重型恢复矩阵。
- [x] 2.2 将 builtin replacement、task-board migration、rollback/fail-closed 矩阵拆为独立 Candidate-only step，保留完整断言、失败 fixture 与诊断。
- [x] 2.3 将 release convergence/history bridge 真实 Git 场景拆为可独立 Focus 的 Candidate step，并保留远端竞争、tree/version mismatch 与幂等回归。
- [x] 2.4 更新 verification registry、Changed inputs、Focus groups、预算和显示名称，证明 `test:fast` 排除重型 owner 而 Candidate 仍包含全部新 steps。

## 3. Candidate 资源调度

- [x] 3.1 为验证运行定义可登记、可 fail-closed 的 execution profile/并发限制，并在 timing summary 中记录实际 profile 和 global/class/饱和型上限。
- [x] 3.2 为拆分后的重型 integration owners 和 runtime adapter parity 声明饱和型资源约束，保持依赖、step identity 和失败传播语义。
- [x] 3.3 在同一冻结 tree 上多轮对比“饱和型互斥”与“CI workspace-heavy 限制降低”策略，按整体 wall-clock、重项 duration、queue 和波动选择默认方案。
- [x] 3.4 补充 scheduler/planner/timing 单测和集成测试，覆盖本地/CI profile、未知 profile、非法上限和 summary 向后兼容。

## 4. Runtime Adapter Parity 去重

- [x] 4.1 从 runtime trait/implementation registry 生成全部 supported adapters 到 implementation family 的稳定覆盖矩阵，新 adapter 没有代表性 owner 时 fail closed。
- [x] 4.2 将全 adapter 的 descriptor、target、activation、inventory assurance 和 RuntimePlan 事实保留在低成本 contract，补齐品牌特有 path/checker/activation 断言。
- [x] 4.3 重构 parity 黑盒矩阵，按 implementation family 保留 install、render、check、幂等和适用的 orphan/uninstall/restore/cleanup 生命周期，移除共享实现的品牌级重复。
- [x] 4.4 共享 parity 的只读 source/descriptor 准备，保持每个 mutation 场景的 workspace、receipt 和 target namespace 隔离。

## 5. 文档与验收

- [x] 5.1 更新 release checklist、verification ownership 与开发入口文档，解释 Fast/Candidate 新边界、execution profile、定点重跑和非阻断预算语义。
- [x] 5.2 运行受影响验证，确认拆分后的每个重型 owner、scheduler/profile 和 runtime implementation family 矩阵可独立定位且全部通过。
- [x] 5.3 对最终冻结 tree 交替运行多轮默认与对照 Candidate，核对 required step/owner/关键场景不减少，并记录整体与重项中位数、波动和调度结论。
- [x] 5.4 运行一次最终完整 Candidate 验证，核对 timing summary 的候选身份、总耗时、预算、最慢阶段、失败/跳过项与 evidence lifecycle。
