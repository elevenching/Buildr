## 1. OpenSpec 与契约基线

- [x] 1.1 完成 proposal、design、delta specs 和 tasks，并建立 contract baseline
- [x] 1.2 运行 proposal stage contract check 与 OpenSpec strict validation

## 2. 公开 JSON 契约

- [x] 2.1 建立公开 JSON schema registry 和顶层 schemaVersion helper
- [x] 2.2 为全部受支持 `--json` command family 增加稳定 schema identity
- [x] 2.3 新增 JSON surface coverage、兼容性和 checkout/npm parity 测试

## 3. Release smoke 与验证耗时

- [x] 3.1 实现跨平台 Node release smoke，覆盖 pack/install/init/sync/doctor/uninstall/doctor
- [x] 3.2 为产品完整验证记录阶段和整体耗时并生成 JSON summary
- [x] 3.3 更新 CI：Linux Node 20/22 完整验证，Linux/macOS/Windows Node 22 release smoke

## 4. tools 目录整理

- [x] 4.1 将 runtime、renderer 和 shared helper 下沉到职责目录并更新 imports
- [x] 4.2 将专项 verifier 下沉到 verification 子目录，保留稳定 facade
- [x] 4.3 更新 package inventory、mutation whitelist、架构门禁和文档路径

## 5. 文档、自举与专项验证

- [x] 5.1 更新 JSON 兼容策略、平台支持、release smoke、timing 和 tools 架构文档
- [x] 5.2 运行 JSON、release smoke、timing、架构、package parity 和 CI 配置专项验证
- [x] 5.3 检查 Rules、Skills、Components、Commands、项目结构和 runtime 入口影响，按需同步自举 workspace

## 6. 最终候选与收尾

- [x] 6.1 冻结候选并运行 package check、doctor、OpenSpec strict validation 和完整产品验证
- [x] 6.2 完成代码、自然语言、tarball inventory、Windows/macOS 可移植性和 Git diff 审阅
- [x] 6.3 运行 pre/post-sync contract guard，同步并归档 change
- [x] 6.4 提交、fetch/rebase（如需）、fast-forward-only 集成、推送并清理 task worktree
