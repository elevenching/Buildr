## 1. Roadmap 结构与资料归位

- [x] 1.1 创建 `docs/roadmap/README.md`，定义未来规划与当前事实、canonical specs、active change、可执行资产和 archive 的边界
- [x] 1.2 将 `agents/{be,fe,pm,qa}.md` 移入 `docs/roadmap/agent-roles/`，保留产品意图并统一改为尚未实现的设计候选表述
- [x] 1.3 将 `capabilities/prototype-development.md` 移入 `docs/roadmap/prototype-development.md`，修正状态声明和角色文档交叉引用

## 2. 产品叙述与发现入口

- [x] 2.1 更新产品 `README.md`、`docs/buildr-product.md` 和 `docs/document-index.md` 的 Roadmap 导航及事实边界
- [x] 2.2 扫描非历史当前内容中的旧路径、断链和把 Roadmap 误写为当前能力的表述，并确认 `package/manifest.yml` 发布边界未变化

## 3. 验证与候选冻结

- [x] 3.1 运行 Markdown/引用专项检查、`openspec validate move-future-only-assets-to-roadmap --strict` 和 `git diff --check`，修复发现的问题
- [x] 3.2 完成自然语言资产审阅并冻结候选，然后运行一次 `tools/verify-buildr-product` 产品级完整验证
