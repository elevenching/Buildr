## Why

当前 Local App 的 Project 与 Service 详情同时承载事实、关联资源目录和编辑表单，导致详情页缺少清晰的阅读重心。用户需要按常规控制台模型将查看与修改分开，并在项目详情中通过操作进入服务和变更目录。

## What Changes

- 将 Project 与 Service 详情页收敛为只读资源概览；Project 详情移除内嵌服务和变更列表。
- 新增 Project、Service 的独立编辑路由和页面；目录与详情页均提供明确的编辑操作。
- 强化侧边栏当前资源的视觉高亮，使目录、详情和编辑页都能清楚反映当前资源。
- 保持现有 API、metadata 白名单、revision CAS、Git observation 和 prompt-only 行为不变。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `local-workspace-application`: 调整资源详情、编辑操作与当前导航状态的用户可观察契约。

## Impact

- 影响 Local App Web 路由、Project/Service 页面模块、离线 CSS 与浏览器测试。
- 不改变 Domain、Application 或 HTTP API 语义。
