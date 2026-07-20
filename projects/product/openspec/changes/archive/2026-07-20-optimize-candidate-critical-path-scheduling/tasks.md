## 1. Registry 与 scheduler 契约

- [x] 1.1 为 registry 增加 `schedulingCostMs` 合法性校验和粗粒度高成本 step 提示
- [x] 1.2 实现 cost-aware ready-step 稳定排序，保持容量、exclusive、dependency、blocked 和输出顺序语义
- [x] 1.3 增加 declaration A/B 模式的 fail-closed 解析，并在 timing summary 记录 `schedulingMode`

## 2. 回归覆盖

- [x] 2.1 补充 registry 非法成本、成本优先、相同成本稳定顺序和未 ready 不空置的 unit tests
- [x] 2.2 补充 Candidate 调度模式与 timing evidence 的 integration/contract tests
- [x] 2.3 运行 unit、timing、Changed verification 与 OpenSpec proposal/strict 门禁

## 3. 冻结树 A/B 验证

- [x] 3.1 在同一冻结 tree 分别运行至少三轮 declaration 与 cost Candidate
- [x] 3.2 汇总总耗时、关键 step 排队与执行耗时中位数，依据证据保留、调整或撤销成本提示
- [x] 3.3 在最终候选 tree 运行默认 cost Candidate 并核对完整 timing summary
