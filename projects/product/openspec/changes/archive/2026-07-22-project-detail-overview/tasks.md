## 1. 参数化路由

- [x] 1.1 扩展 HTTP App Shell fallback，只允许合法 `/projects/:projectCode` 详情路径并保持未知路径 404。
- [x] 1.2 扩展客户端 router 的参数化匹配与 route params 传递，保留 History API 行为。

## 2. 项目详情首批切片

- [x] 2.1 将 `/projects` 收敛为项目目录和 metadata 管理入口，并让项目条目进入 canonical 详情 URL。
- [x] 2.2 实现项目详情概览，组合真实 Project detail、Git observation 与 diagnostics。
- [x] 2.3 实现所属服务摘要、空状态、服务管理入口和预填项目的创建服务 Agent Action。
- [x] 2.4 增加明确标记“后续阶段”的 OpenSpec、规则、验证与命令入口，不展示虚构状态。
- [x] 2.5 将项目目录调整为带“详情”“服务”显式操作的 PC 表格，并读取真实服务数。
- [x] 2.6 将服务目录调整为带项目过滤和“详情”显式操作的 PC 表格，保留已有详情修改能力。
- [x] 2.7 保证项目与服务表格在窄屏可读可操作，不建设独立移动端流程。

## 3. 验证与评审

- [x] 3.1 增加参数化路由、未知项目、真实服务/空状态和静态资源交付的直接回归测试。
- [x] 3.2 运行 minimal 与 affected 验证，完成桌面和 390px 浏览器验收并启动 task worktree 预览。
- [x] 3.3 补充表格操作、项目过滤和服务详情触发的直接回归与浏览器验收，并重新运行 affected 验证。
- [x] 3.4 用户确认本阶段设计后冻结候选并运行 Product Candidate。
