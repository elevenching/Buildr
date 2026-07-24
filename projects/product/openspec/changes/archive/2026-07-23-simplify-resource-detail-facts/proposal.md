## Why

当前详情页同时使用概览条、说明区、技术折叠区和关联资源卡片，阅读方式不统一。用户需要将详情收敛为连续、统一的标签和值，并把跨资源跳转回收到资源列表的操作列，明确“列表负责导航、详情负责阅读”的分工。

## What Changes

- 将 Project 与 Service 详情改为统一的只读标签和值列表，技术事实仍在折叠区但采用同一事实行样式。
- 移除详情页的关联资源导航；Project 与 Service 详情只在页头保留进入独立编辑页的操作。
- 在项目和服务目录的操作列补齐关联资源导航，使详情、编辑和跨资源查看使用一致的列表操作形式。
- 保持现有 API、metadata 白名单、revision CAS、Git observation 和 prompt-only Agent 行为不变。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 调整资源详情的事实呈现层级，以及关联资源导航所在的页面模型。

## Impact

- 影响本机应用的 Project、Service 详情模块、目录表格操作和浏览器回归测试。
- 不影响后端 API、存储、Agent prompt 或外部依赖。
