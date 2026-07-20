## 1. Runtime 诊断实现

- [x] 1.1 删除 render 与 runtime checker 对 partial inventory 的无条件 warning，继续在 runtime scope 返回 `skillInventoryEvidence` 和 `opaqueSources`
- [x] 1.2 确认冲突 classification 只围绕 Buildr 管理候选与 receipts，保持真实可观测同名冲突零写入阻塞

## 2. 契约、文档与专项验证

- [x] 2.1 更新 doctor/runtime JSON contract tests，覆盖健康 partial inventory 为 0 warning、assurance metadata 保留且不可操作
- [x] 2.2 覆盖无关外部 Skill 被忽略、可观测同名冲突仍阻塞，并更新 adapter 与产品入口文档
- [x] 2.3 运行 runtime/doctor 受影响范围验证并修复发现的问题

## 3. 候选冻结与完整验证

- [x] 3.1 审阅最终 diff、OpenSpec delta 和自然语言资产，运行 strict、focused 检查与 `git diff --check`
- [x] 3.2 运行 Product Candidate 验证，记录候选 identity、完整 wall-clock、最慢阶段和 evidence 生命周期
