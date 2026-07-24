## Why

开始页把一次性的 Project 选择当作当前工作范围，但选择后没有可靠的重新选择入口；同时它没有改变 Workspace 的真实资源关系，只会把用户锁在一个看似有意义的上下文中。现在应把开始页收敛为 Workspace 的事实概览，把具体工作范围留给启动 Agent 工作时临时确定。

## What Changes

- 移除开始页对“当前 Project 已选中”的依赖，不再将单个 Project 作为页面持续状态或默认工作范围。
- 开始页改为面向整个 Workspace 展示 Project 与 Service 的真实概览，并将项目管理作为可进入的独立入口。
- 保留“用 Agent 开始”操作，但在生成工作指令时显式选择任务相关 Project 和可选 Service；这次选择只服务于该指令，不会锁定开始页。
- **BREAKING**：开始页不再提供或接受用于锁定 Project 的 `project` 查询参数作为持久上下文。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 改变开始页的 Project 范围、摘要和 Agent 工作指令交互契约。

## Impact

- 本机应用的 Workspace getting-started projection、HTTP 读取接口与 Web 路由/渲染。
- 开始页、Agent 工作指令和浏览器集成测试。
- 不改变 Project、Service registry 的 canonical 数据模型或独立详情页。
