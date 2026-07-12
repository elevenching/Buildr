## 1. CLI 自更新基础

- [x] 1.1 梳理 command registry、现有 update/sync composition 与 package executable 定位方式，建立不依赖 workspace 的 update application 边界
- [x] 1.2 实现 executable 产品根解析和 development-checkout、registry-package、unknown 来源识别及稳定 JSON schema
- [x] 1.3 实现 `buildr update check` 的 Git/npm 只读检查、文本输出、JSON 输出和阻塞 nextActions
- [x] 1.4 为来源识别与 check 增加直接单元测试，并运行该任务组受影响测试

## 2. CLI update 执行与 sync 收敛

- [x] 2.1 实现开发者模式 fetch、fast-forward、本地未发布提交安全 rebase 与 dirty/shared/conflict 停止边界
- [x] 2.2 实现发布模式同 package identity、registry 与 prefix 的 npm 更新，并覆盖无需更新和权限/网络阻塞
- [x] 2.3 将旧 update workspace reconciliation 收敛为 sync 内部步骤，移除 update 的 `--target` workspace 语义并更新 help/迁移提示
- [x] 2.4 更新 init、sync、builtin、doctor 和 package maintenance 内部调用，确保 sync 不调用 CLI update 且仍完成 workspace/runtime/doctor 闭环
- [x] 2.5 增加 Git fixture、npm prefix/registry fixture 和临时 workspace 集成测试，运行 CLI update/sync 受影响范围验证

## 3. Agent 编排与发布资产

- [x] 3.1 更新产品 Buildr Skill 的 description、执行循环和任务路由，区分完整更新、只更新 CLI 与同步 workspace
- [x] 3.2 更新 bootstrap guide、CLI reference、current-state knowledge 和 release checklist，删除旧 update workspace 语义
- [x] 3.3 同步 package targets 与 runtime 资产声明，扩展静态校验确保受管 Buildr Skill 使用新编排
- [x] 3.4 运行 Buildr Skill、package baseline 和 runtime adapter 受影响范围验证

## 4. README 与 Roadmap 重组

- [x] 4.1 将 Product README 的产品说明合并到 workspace 根 README，补充开发者模式和发布模式快速开始，并把自举 workspace 说明放到末尾
- [x] 4.2 删除重复的 Product README，修复仓内链接和文档索引，保持 `docs/buildr-product.md` 为详细产品事实入口
- [x] 4.3 新增 workspace assets 独立版本化 Roadmap，明确当前仍内置于 CLI package 且本 change 不实现独立发布
- [x] 4.4 运行 README 链接、文档边界和 package file list 受影响检查
- [x] 4.5 复审根 README 的产品文档边界，删除 Agent Skill、task worktree 和候选验证流程说明
- [x] 4.6 强化 README 的 Agent-first 产品定位和 Buildr Skill 主入口，收敛 update/sync 为简要概念说明

## 5. 候选验证与自举检查

- [x] 5.1 扩展 repository onboarding、npm package、update/sync 和两个 Agent runtime 的临时环境 E2E
- [x] 5.2 审计所有代码、docs、knowledge、specs 与测试中的旧 `buildr update --target` 和“update 同步 workspace”表述并完成迁移
- [x] 5.3 冻结最终候选后运行 `tools/verify-buildr-product`、`git diff --check` 和 OpenSpec 契约检查
- [x] 5.4 按自举原则检查 Rules、Skills、Components、Commands、项目结构和 Agent runtime 入口影响，记录合入后从保留 Product checkout 执行 workspace sync/doctor 的必要动作
