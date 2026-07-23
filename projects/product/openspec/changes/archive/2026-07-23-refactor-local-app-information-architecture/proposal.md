## Why

Buildr Local App 已具备真实 Workspace、Project、Service 和 Change read model，但页面仍混合了目录、详情和编辑流程，视觉层级也偏向宽松的产品展示。随着多个工作空间与资源管理成为日常入口，需要把它收敛为可链接、可返回、高信息密度的本地工作控制台。

## What Changes

- 统一全局工作空间目录与单一工作空间上下文的导航、面包屑和资源页面模型。
- 将 Project、Service、Change 收敛为“列表页 → 独立详情页”；新增稳定的 Service 详情路由，移除服务列表页内的详情与编辑流程。
- 重做工作空间卡片目录、资源工具栏、详情页结构、技术信息层级和移动端布局，使主操作明确为“交给 Agent”而非页面直接创建。
- 保持现有 Domain、HTTP API、metadata 白名单、revision CAS、Git observation 与 prompt-only Agent Action 语义不变。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `local-workspace-application`: 补充统一资源目录/详情路由、Service 独立详情及控制台级响应式与信息层级要求。

## Impact

- 影响 `services/buildr/src/interfaces/local-app/web/` 的路由、页面模块和离线 CSS，以及 HTTP shell 路由白名单。
- 不新增、删除或改变 HTTP API 字段、Domain 状态、Agent prompt 生成语义或写入权限。
- 更新浏览器集成测试，覆盖 Service 详情深链、列表跳转、metadata 保存和 390px 无横向溢出。
