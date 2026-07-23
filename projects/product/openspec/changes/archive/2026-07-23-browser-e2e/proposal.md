## Why

Buildr 本机应用的项目、服务和变更主流程目前只有应用层/API 自动化测试、静态页面契约与一次性浏览器验收，无法在代码变化后重复证明真实浏览器中的路由、过滤、详情和 Agent 抽屉仍可工作。现在需要补一层快速、隔离、可诊断的浏览器冒烟验证，并把它纳入 Project 测试能力声明。

## What Changes

- 新增轻量浏览器 E2E runner：创建临时 Buildr workspace，启动随机 loopback 应用端口，驱动本机 Chrome 验证项目、服务、变更三条主流程。
- 浏览器验证只读取或操作临时 fixture，不使用开发者真实 workspace，不下载或打包浏览器，不访问外部系统。
- 为缺少可用 Chrome、启动失败、断言失败和浏览器控制台错误提供明确诊断与清理。
- 增加独立 npm 入口，并在 Product `verification.yml` 中登记 `product.browser-smoke`，首版按 `trial`、`advisory` 能力运行和积累稳定性证据。
- 不包含破坏性变更。

## Capabilities

### New Capabilities

- `local-app-browser-verification`: 定义 Buildr 本机应用关键管理流程的真实浏览器冒烟验证、隔离环境、失败诊断与测试声明边界。

### Modified Capabilities

无。

## Impact

- 影响 Buildr Service 的测试工具、fixture、npm scripts、依赖锁文件与验证 registry ownership。
- 更新 Product Project 的 `verification.yml`，新增浏览器测试能力声明。
- 新增 `playwright-core` 开发依赖，只使用已安装浏览器，不下载浏览器二进制，也不进入发布包运行依赖。
