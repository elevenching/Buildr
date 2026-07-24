## Why

Buildr 已能管理工作空间、项目和服务，但项目中的 OpenSpec change 仍缺少统一的人类可读入口，用户无法快速判断正在做什么、任务进度和归档结果。现在需要把真实 change 事实接入本机管理系统，同时继续由 Agent 承担理解、推进和生命周期操作。

## What Changes

- 新增项目级 Change 只读索引，统一投影 active 与 archived change 的身份、状态、进度、更新时间和 artifact 摘要。
- 新增 Change 列表与详情 API，并对非法路径、缺失或不完整 artifact fail closed。
- 在本机应用资源导航中新增“变更（Change）”，提供表格、项目与状态过滤、详情视图和明确操作栏。
- Change 操作只生成可复制的 Agent prompt，用于创建、继续、审阅或处理 change；页面不直接创建、编辑、apply、sync 或 archive。
- 项目详情增加 Change 摘要和进入过滤后 Change 表格的稳定入口。
- 不包含破坏性变更。

## Capabilities

### New Capabilities
- `change-asset-indexing`: 定义 Project 下 active/archived OpenSpec change 的安全读取、状态归一化、详情与 Agent action prompt。

### Modified Capabilities
- `local-workspace-application`: 在本机管理系统中增加 Change 表格、过滤、详情和项目关联入口，并保持 prompt-only 写操作边界。

## Impact

- 影响 Buildr Service 的 Change application/read model、本地 HTTP API、本机 Web 路由、资源导航和项目详情。
- 增加 Change 领域相关单元、集成与 UI 契约测试，不引入数据库或新的外部依赖。
- Product Project 继续拥有 OpenSpec；Buildr Service 只读取并投影事实，不建立第二套 change 状态。
