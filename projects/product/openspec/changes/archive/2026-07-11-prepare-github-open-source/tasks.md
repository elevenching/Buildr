## 1. 安装与公开 package 基线

- [x] 1.1 修改开发 checkout installer，在运行依赖缺失时使用 lockfile 准备 production dependencies，并更新首次 Agent onboarding 文档；完成后运行 installer 专项 smoke test
- [x] 1.2 将 npm package 调整为非占位公开 metadata，加入产品 License，并校验 `npm pack --dry-run --json` 的 identity、License 和文件边界
- [x] 1.3 新增不含 `node_modules`/runtime 的 repository onboarding verifier，覆盖 CLI 安装、init、`sync codex` 和 doctor；将其接入产品完整验证
- [x] 1.4 扩展 npm 安装 E2E，使已安装 tarball通过 `sync codex` 和最终 doctor，而不依赖 development checkout

## 2. Service branch 契约修复

- [x] 2.1 为 `service create` 增加 `--branch` 参数和 `repo.branch` 封闭 schema/canonical YAML 支持；运行语法检查
- [x] 2.2 实现指定分支 clone、既有 repo identity 校验和 doctor branch drift 诊断；运行 Service 专项 fixture
- [x] 2.3 扩展临时 workspace E2E，覆盖默认 HEAD、指定分支、metadata 和错误路径

## 3. 远端 Skill 有界读取

- [x] 3.1 抽取通用远端文本读取模块，加入受校验的 inactivity/总 timeout 和上下文错误；运行模块专项测试
- [x] 3.2 将 runtime Skill resolver 切换到有界读取，并验证超时不会写入部分 runtime 产物

## 4. 产品公开材料与交付收敛

- [x] 4.1 补充产品 CLI reference、公开试用示例和已知限制，更新 README、current state、Roadmap 与 release checklist 的陈旧事实
- [x] 4.2 从 npm `files` 和维护契约中移除确认不被主 CLI 使用的 standalone adapter/checker入口，保留运行时所需模块并通过 npm 安装 E2E
- [x] 4.3 更新 package/build/bootstrap 自检，使新增 License、文档、installer 和 smoke verifier 的发布边界明确且不暴露私有路径
- [x] 4.4 泛化 canonical 示例和防泄漏规则，并机械脱敏 archive 中的真实用户名、绝对路径与内部域名；运行全仓去私有化扫描

## 5. 候选验证

- [x] 5.1 运行受影响的 Node 语法、repository onboarding、Service、remote timeout、npm pack 和 strict OpenSpec 检查，修复发现的问题
- [x] 5.2 冻结最终候选后运行一次 `tools/verify-buildr-product`、`git diff --check` 和当前 Agent doctor，确认没有 required error
