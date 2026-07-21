## 1. Agent 编排契约

- [x] 1.1 更新产品入口 Buildr Skill，加入 Git 管理 workspace 的安全更新前置步骤、阻塞边界和显式 sync 授权语义
- [x] 1.2 更新 bootstrap guide、CLI reference 与 runtime Skill 提示，保持复合用户意图和 CLI 单命令职责的边界一致

## 2. 防回退验证

- [x] 2.1 扩展 package 静态验证，覆盖 Git-first 顺序、失败停止、非 Git 直接 sync 和不隐式更新 CLI 的契约
- [x] 2.2 运行受影响范围验证并修复发现的问题

## 3. 最终候选验证

- [x] 3.1 审阅所有自然语言资产与生成提示的一致性，并运行 `git diff --check` 和 OpenSpec strict validation
- [x] 3.2 冻结最终候选并运行 `npm run test:candidate`，读取并汇报 timing summary
