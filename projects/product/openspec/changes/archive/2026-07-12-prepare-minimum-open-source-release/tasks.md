## 1. OpenSpec 与公开事实

- [x] 1.1 完成 proposal、design、delta specs 和 tasks，并建立 contract baseline
- [x] 1.2 运行 proposal stage contract check 与 OpenSpec strict validation

## 2. Package identity 与公开 metadata

- [x] 2.1 将 npm package identity 更新为 `@buildr-ai/buildr` 并同步 lockfile
- [x] 2.2 补齐 repository、homepage、bugs、keywords 和 public publishConfig
- [x] 2.3 更新 package static validation、update identity 和 tarball assertions

## 3. 中文与英文 README

- [x] 3.1 完成中文根 README 的 canonical GitHub/npm 安装和公开入口
- [x] 3.2 新增完整英文 `README.en.md` 并建立双向语言导航
- [x] 3.3 更新 product README、CONTRIBUTING、SECURITY、License 和相关公开链接

## 4. 开源候选安全门禁

- [x] 4.1 实现 tracked candidate、敏感模式、内部来源、占位符和大文件扫描
- [x] 4.2 实现 npm tarball 禁止路径与公开 metadata inventory 检查
- [x] 4.3 增加允许/拒绝 fixtures，并接入完整产品验证与 CI

## 5. Release workflow 与开发约定

- [x] 5.1 实现 tag/version/dist-tag 解析与测试
- [x] 5.2 新增 `npm-production` Environment、OIDC-ready 的 release workflow
- [x] 5.3 在 Product Project 规则中要求最终验证报告耗时摘要
- [x] 5.4 更新 release checklist、known limitations、current-state knowledge 和发布说明

## 6. 专项验证与审阅

- [x] 6.1 运行 metadata、README parity、安全扫描、release 解析和 tarball 专项验证
- [x] 6.2 审阅公开文本、自然语言代码、workflow 权限、package inventory 和 Git diff
- [x] 6.3 检查 Rules、Skills、Components、Commands、项目结构和 runtime 入口影响并按需同步自举 workspace

## 7. 最终候选与收尾

- [x] 7.1 冻结候选并运行 package check、doctor、OpenSpec strict validation 和完整产品验证
- [x] 7.2 汇报完整验证总耗时、最慢阶段、失败阶段和 timing summary 路径
- [x] 7.3 运行 pre/post-sync contract guard，同步并归档 change
- [x] 7.4 提交、fetch/rebase（如需）、fast-forward-only 集成、推送内部 `dev` 并清理 task worktree
