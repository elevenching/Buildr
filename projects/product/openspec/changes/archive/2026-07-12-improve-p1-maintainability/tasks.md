## 1. OpenSpec 与行为基线

- [x] 1.1 建立 change proposal、design、capability delta 和 contract baseline
- [x] 1.2 运行 proposal stage contract check 与 OpenSpec strict validation

## 2. Runtime Skill renderer 模块化

- [x] 2.1 将参数与 Skills manifest 解析迁移到可独立测试模块
- [x] 2.2 将 Skill contribution、来源解析和 render plan 迁移到职责模块
- [x] 2.3 保留 `render-claude-code.mjs` 兼容 facade 并验证既有调用方

## 3. CLI application 热点拆分

- [x] 3.1 拆分 package maintenance 静态校验、smoke 和输出职责
- [x] 3.2 拆分 doctor scope、registry、runtime diagnostics 和 reporting 职责
- [x] 3.3 将 CLI platform namespace imports 收窄为显式 named imports 或窄 application ports

## 4. 验证器与架构门禁

- [x] 4.1 将 MVP verifier 拆分为公共 helper 与独立场景脚本
- [x] 4.2 增强 CLI 架构 verifier，检查 facade、显式依赖和 verifier 场景边界
- [x] 4.3 新增 `node:test` 细粒度测试并接入产品完整验证
- [x] 4.4 运行 renderer、CLI 架构、unit tests 和受影响 package/doctor 专项验证

## 5. 契约、文档与自举收敛

- [x] 5.1 更新 CLI 架构和验证文档，说明新模块边界与测试入口
- [x] 5.2 核对 capability 迁移无 Requirement 丢失并重新运行 proposal stage check
- [x] 5.3 检查 Rules、Skills、Components、Commands、项目结构和 runtime 入口影响，按需同步自举 workspace

## 6. 最终候选验证

- [x] 6.1 对最终候选运行 OpenSpec strict validation、package check 和 doctor
- [x] 6.2 对最终候选运行完整产品验证并记录可复用验证证据
- [x] 6.3 完成代码、自然语言资产、发布 inventory 和 Git diff 审阅
