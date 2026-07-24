## 1. Change 读取模型与契约

- [x] 1.1 建立 Change application/read model，安全索引 Project 的 active 与 archived change、artifact availability 和任务进度。
- [x] 1.2 实现 Change 详情读取与创建、继续、审阅 prompt builder，覆盖非法 reference、部分 artifacts 和历史归档边界。
- [x] 1.3 增加单元与集成测试，并运行 Change 核心 minimal/affected 验证。

## 2. HTTP API 与本机应用表格

- [x] 2.1 增加 Change collection、detail 和 prompt HTTP API，复用 loopback 与写请求安全边界。
- [x] 2.2 在资源导航增加变更（Change），实现表格、项目/生命周期过滤、明确操作栏和创建 Change 抽屉。
- [x] 2.3 增加独立 Change 详情路由，展示任务进度与 proposal、design、specs、tasks，并提供 Agent 行为。
- [x] 2.4 运行本机应用/API affected 验证，确认既有 Workspace、Project 和 Service 路由保持兼容。

## 3. 项目关联、文档与验收

- [x] 3.1 在项目详情增加所属 Change 数量、最近列表、空状态和带 Project filter 的管理入口。
- [x] 3.2 更新本机应用 current-state 与用户文档，明确 Change read-only 与 prompt-only 边界。
- [x] 3.3 运行 OpenSpec strict、doctor、桌面本机应用验收和 affected 验证。
- [x] 3.4 冻结最终候选并运行 Product Candidate；成功后仅回写本任务状态。
