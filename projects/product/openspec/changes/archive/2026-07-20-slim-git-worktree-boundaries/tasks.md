## 1. 收紧 provider 职责

- [x] 1.1 澄清 `buildr.git-task-integration/v1` 与 `git-ops`：只返回 Git 策略、refs 影响、候选内容对比和 transition evidence，不执行或决定 Candidate 验证
- [x] 1.2 精简 `task-worktree`：只返回 canonical checkout、lifecycle 状态与 identity 输入，删除重复段落和跨层验证判断
- [x] 1.3 更新 capability 协作文档，保持现有 contract version、provider、binding 和 replacement 语义不变

## 2. 防回退验证

- [x] 2.1 调整 package 静态 verifier，从旧验证文案逐字依赖改为 Git/worktree/verification 职责边界断言
- [x] 2.2 扩展专项 contract tests，覆盖无重复段落、无跨层验证决策及 capability/binding 拓扑不变
- [x] 2.3 运行任务组受影响范围验证并修复发现的问题
- [x] 2.4 补齐前序 change 遗留的 `task-verification` canonical spec Purpose，占位文本不得阻塞候选验证

## 3. 候选冻结与完整验证

- [x] 3.1 审阅最终 diff、OpenSpec delta 和自然语言资产，运行 strict/diff 检查并冻结候选
- [x] 3.2 运行 Product Candidate 验证，记录候选 identity、完整 wall-clock、最慢阶段和 evidence 生命周期
