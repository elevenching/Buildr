## 1. 浏览器测试基础设施

- [x] 1.1 增加 `playwright-core` 开发依赖、Chrome 可执行文件发现和独立 `test:browser:smoke` 入口。
- [x] 1.2 建立临时 Workspace、Project、Service、Change fixture，确保随机端口、零外部系统和完整资源清理。

## 2. 三条管理主流程

- [x] 2.1 实现项目目录到项目详情的真实浏览器流程与稳定断言。
- [x] 2.2 实现按项目过滤的服务目录、服务详情与真实字段断言。
- [x] 2.3 实现 Change 生命周期过滤、详情 artifacts 和 Agent prompt 抽屉流程。
- [x] 2.4 收集 `pageerror`、`console.error` 与失败诊断，并运行 browser smoke affected 验证。

## 3. 测试声明与验收

- [x] 3.1 在 Product `verification.yml` 登记 `product.browser-smoke` 的 trial/advisory 能力、环境、副作用和覆盖范围。
- [x] 3.2 更新验证 registry ownership、相关契约测试和实现文档，确保新增测试文件可被 Changed planner 识别。
- [x] 3.3 运行声明校验、OpenSpec strict、doctor 与 affected 验证。
- [x] 3.4 冻结最终候选并运行 Product Candidate；成功后仅回写本任务状态。
