## 1. 收拢 Agent runtime smoke

- [x] 1.1 从 adapter descriptor 和 contract tests 移除 smoke verification level、status、WorkBuddy 快照及 TRAE Work smoke prerequisite
- [x] 1.2 删除 Agent runtime smoke workspace generator、专项测试和 Candidate registry step，保留其他 smoke owner
- [x] 1.3 更新 runtime adapter 权威文档和验证职责说明，不再声明品牌 smoke 特例

## 2. 修正 doctor runtime 选择

- [x] 2.1 实现基于 Buildr managed marker/receipt 的 present runtime discovery，避免按共享目录或应用安装猜测
- [x] 2.2 默认 doctor 只检查 detected runtimes，并输出 detected/checked evidence；显式 `--agent` 语义保持不变
- [x] 2.3 让未选中 inventory runtime findings 保持可观察但不进入 readiness、repair plan 或 nextSteps

## 3. 回归与候选验证

- [x] 3.1 补充 default/selected doctor、unsupported absent adapter、managed runtime discovery 和 actionability 回归测试
- [x] 3.2 运行 runtime contract/parity、doctor JSON、Changed verification 与 OpenSpec proposal/strict 门禁
- [x] 3.3 在最终候选 tree 运行完整 Candidate 并核对 timing summary
