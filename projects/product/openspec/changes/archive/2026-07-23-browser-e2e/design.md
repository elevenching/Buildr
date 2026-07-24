## Context

Buildr 本机应用已经有 Application、HTTP 和静态页面契约测试，但这些测试不会运行浏览器的模块加载、路由、DOM 事件、表单控件和控制台。当前浏览器验收依赖开发期间的一次性人工自动化，不能成为后续改动可重复使用的 Project 验证能力。

测试必须保持本机优先和低副作用：不读取开发者真实 workspace、不依赖固定端口、不访问远端服务，也不把浏览器二进制打进 npm package。Product Candidate 当前在 Linux CI 的 Node 20/22 上运行，因此首版浏览器能力不能在环境尚未稳定前直接成为 Candidate required gate。

## Goals / Non-Goals

**Goals:**

- 使用真实 Chrome 验证项目、服务、变更三条关键管理路径。
- 每次执行创建独立临时 workspace 和 fixture，并在成功或失败后关闭浏览器、服务器与临时目录。
- 提供独立、快速的 npm 命令和明确失败诊断。
- 将能力声明为 `trial`、`advisory`，记录浏览器环境要求和本地临时副作用。

**Non-Goals:**

- 不做像素级视觉回归、移动端矩阵、跨浏览器矩阵或性能基准。
- 不覆盖所有 metadata 写入、异常响应和安全契约；这些继续由现有单元/集成测试承担。
- 不下载 Playwright 浏览器，不修改开发者真实 workspace，不访问外部系统。
- 首版不加入 Product Candidate required gates。

## Decisions

### 1. 使用 `playwright-core` 驱动已有 Chrome

测试依赖 `playwright-core`，优先读取 `BUILDR_BROWSER_EXECUTABLE`，否则按 macOS、Linux 和 Windows 的常见 Chrome/Chromium 路径发现可执行文件。相比完整 `playwright` 包，这避免隐式下载浏览器和额外缓存；相比自建 Chrome DevTools Protocol 客户端，Playwright 提供稳定的定位、等待和清理语义。

找不到浏览器时测试明确失败并给出环境要求。Project 声明通过 `environment.requires: [node, npm, chrome]` 让验证编排可以在执行前识别阻塞，而不是把缺少浏览器误报成产品回归。

### 2. 每次执行自建临时 workspace 与随机端口

测试通过真实 CLI 初始化临时 workspace、登记一个项目和一个服务，并只在该项目中写入最小 OpenSpec fixture。随后调用本机应用 server 的公开 composition 边界监听随机 loopback 端口。

这能覆盖真实 manifest、Application、HTTP、Web 与浏览器链路，同时避免固定 `58000` 端口冲突和开发 workspace 污染。测试结束时无论成功失败都关闭 browser/server，并删除拥有的临时目录。

### 3. 三条流程只验证稳定用户契约

- 项目：表格加载、明确“详情”操作、稳定项目详情路由与真实项目上下文。
- 服务：项目过滤、服务表格、“详情”操作和真实服务详情。
- 变更：进行中列表、生命周期过滤、独立详情路由、标准 artifact 和 Agent prompt 抽屉。

断言使用稳定 URL、元素 ID、角色和可见文案，不依赖布局坐标或完整页面快照。每条流程同时收集 `pageerror` 与 `console.error`，任何未预期浏览器错误都使测试失败。

### 4. 独立能力先以 trial/advisory 接入

新增 `npm run test:browser:smoke`，不自动塞入 `npm test` 或 Candidate registry。`verification.yml` 将其声明为 affected 阶段的 `trial`、`advisory` 能力，授权为 implicit，副作用限定为本地临时文件和 loopback 进程。

连续在开发机和 CI 验证 Chrome 可用性、耗时与稳定性后，再由团队决定是否提升为 `stable`、`required`。成熟度升级不在本 change 中预设。

## Risks / Trade-offs

- [Risk] 不同系统的 Chrome 路径不一致 → 支持显式环境变量和常见路径探测，失败信息列出解决边界。
- [Risk] 浏览器启动增加验证耗时和波动 → 复用单个 browser/context，三条流程在一个测试执行中完成，避免下载与多浏览器矩阵。
- [Risk] DOM 文案调整造成脆弱失败 → 优先使用稳定 ID、URL 和明确操作角色，只对核心中文领域词做必要断言。
- [Trade-off] 首版 advisory 不阻断 Candidate → 先获得真实环境证据，避免把未成熟环境依赖变成全项目门禁。

## Migration Plan

1. 增加依赖、browser smoke runner 与 npm 入口。
2. 在本机 Chrome 上运行并修正三条流程。
3. 更新 `verification.yml` 为 trial/advisory，并运行声明校验、affected 和 Candidate。
4. 后续独立评审成熟度；回滚时删除独立测试入口、依赖和声明，不影响生产应用。

## Open Questions

无。跨浏览器、移动端和 required gate 升级留待积累稳定性证据后决定。
