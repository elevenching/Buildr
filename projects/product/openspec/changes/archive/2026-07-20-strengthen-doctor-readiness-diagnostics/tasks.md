## 1. 结果模型与 workspace identity

- [x] 1.1 统一 doctor 与 workspace operations 的 canonical identity 判定，并覆盖 valid、incomplete、absent 测试
- [x] 1.2 增加兼容的 health 与 diagnostic profile JSON 字段，并覆盖 actionable 与非 actionable finding 测试
- [x] 1.3 从 findings 生成有优先级且去重的 repair plan，并让 nextSteps 使用同一来源

## 2. 根因化诊断与展示

- [x] 2.1 对未登记 Project 停止 baseline 与 Service metadata 派生检查，并补充故障注入测试
- [x] 2.2 更新 doctor 文本报告，清楚展示 validity、readiness、action required 与 repair plan

## 3. 文档与验证

- [x] 3.1 更新 CLI reference、JSON contracts 与 doctor 诊断边界说明
- [x] 3.2 运行 OpenSpec contract guard、doctor 相关测试和 changed/candidate 验证并修复回归
