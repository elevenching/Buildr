## 1. 对齐公开产品定位

- [x] 1.1 更新仓库根中文与英文 README，加入组织成员从一句自然语言指令开始的产品承诺，并保持双语语义一致
- [x] 1.2 更新 Product README 与 `docs/buildr-product.md`，统一工作事实、工作方法以及 Buildr、Agent、人的职责边界

## 2. 固化 Agent 入口与开发规则

- [x] 2.1 更新 Buildr Skill 和 Buildr Core 产品源，将工作资产解释收敛为工作事实与工作方法，并保留任务上下文责任边界
- [x] 2.2 更新 Product Project `AGENTS.md`，加入“不复制 Agent 通用能力”的新能力评审门槛

## 3. 验证最终候选

- [x] 3.1 校验 OpenSpec change、文案一致性、Markdown EOF 与 Git diff
- [x] 3.2 运行受影响范围验证并在最终候选冻结后执行产品完整候选验证
- [x] 3.3 执行 Buildr workspace transition doctor，确认当前 Agent workspace 可继续工作
