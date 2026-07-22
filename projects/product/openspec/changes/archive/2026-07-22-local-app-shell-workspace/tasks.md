## 1. 路由与模块交付边界

- [x] 1.1 扩展本机 HTTP interface，为已声明页面路由提供 App Shell fallback，并安全交付 ES module 与 feature 静态资源。
- [x] 1.2 增加页面路由、未知路径、API 404 和静态资源安全回归测试。

## 2. App Shell 与共享前端能力

- [x] 2.1 将现有页面重构为包含顶部 Workspace context、响应式主导航、view root 和 Agent Action host 的 App Shell。
- [x] 2.2 实现原生 History API router、共享 API client、加载/错误状态和桌面/窄屏导航样式。

## 3. Workspace 首批迁移

- [x] 3.1 实现 Workspace 概览，展示真实 Workspace、Project/Service 汇总、迁移提示和管理入口。
- [x] 3.2 实现 Workspace 设置，保留 metadata 白名单、迁移只读、revision CAS 和技术事实展示。
- [x] 3.3 将新 Workspace prompt 移入统一“交给 Agent”抽屉，并保留复制不等于创建的反馈。

## 4. Project 与 Service 兼容迁移

- [x] 4.1 将现有 Project、Service 列表、详情、修改、诊断和 prompt-only 创建迁入前端 feature。
- [x] 4.2 验证现有 Project/Service API 和安全行为无回退。

## 5. 首版验证

- [x] 5.1 运行最小反馈与 affected 验证，完成桌面和 390px 浏览器验收，并向用户提供本阶段预览。

## 6. 用户评审修订

- [x] 6.1 将“资源”改为可展开/折叠的导航分组，并提供项目、服务子入口。
- [x] 6.2 将项目、服务创建改为按钮触发的统一 Agent Action 抽屉，移除页面内平铺表单。
- [x] 6.3 统一界面领域名词为中文主称“工作空间、项目、服务”。
- [x] 6.4 重新运行 affected，并验收桌面、390px、资源折叠、抽屉创建和中文术语。

## 7. 最终候选

- [x] 7.1 根据用户评审将项目与服务拆为 `/projects`、`/services` 独立视图，并让服务页明确所属项目与空状态。
- [x] 7.2 重新运行 affected，验收独立路由、服务空状态、创建抽屉和窄屏布局。
- [x] 7.3 用户确认本阶段设计后冻结候选并运行一次 Product Candidate 验证。
