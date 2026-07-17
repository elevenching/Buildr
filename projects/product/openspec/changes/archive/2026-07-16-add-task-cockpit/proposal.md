## Why

Agent 在复杂、跨阶段或跨团队任务中主要通过对话汇报，用户难以持续看清任务目标、整体方案、历史阶段、当前进度、依赖和下一步。OpenSpec change、`tasks.md` 和代码验证分别保存局部事实，但 change 归档后无法继续承担整个任务的稳定可视化入口，因此需要由 Agent 单向维护、面向普通用户的长期任务驾驶舱。

## What Changes

- 新增 `task-cockpit` 内置 workspace Skill，引导 Agent 为复杂、长期、跨阶段或存在交叉依赖的任务创建和持续维护单文件 HTML 驾驶舱。
- 驾驶舱默认保存在拥有任务的 Project `openspec/knowledge/task-cockpits/` 下，文件名使用 `yyyy-MM-dd-<task-id>.html`，生命周期独立于单个 OpenSpec change。
- 驾驶舱由 Agent 单向维护，用户通过 Agent 对话提供目标、判断和确认；页面只读，不通过 checkbox 或其他控件直接修改任务事实。
- 驾驶舱以普通人能理解的首页为首要入口，再逐层展示推进、方案和技术细节；重要且易懂的信息优先、聚焦、简练，避免把 OpenSpec 或技术清单直接翻译成复杂页面。
- `task-triage` 增加是否创建或继续维护驾驶舱的判断，并将复杂任务路由到 `task-cockpit`。
- Agent 在驾驶舱首次创建、发生实质更新、用户询问进度、任务暂停或完成时，在回复中输出可点击位置和 workspace 相对路径。
- 扩展 Project `knowledge` 分层，允许 `task-cockpits/` 保存当前任务认知、已完成阶段、当前计划、依赖和验证证据，同时保持 specs、change、代码和验证结果各自的权威边界。
- 本变更不提供浏览器内直接控制 Agent、多人协作编辑、服务端实时同步或通用 Web UI。

## Capabilities

### New Capabilities

- `task-cockpit`: 定义任务驾驶舱的创建条件、稳定路径、日期前缀命名、单向维护、内容层次、跨 change 生命周期、更新节点和用户可见入口。

### Modified Capabilities

- `agent-task-workflows`: 让 `task-triage` 判断驾驶舱需要，并要求 Agent 在关键任务状态回复中提供驾驶舱入口。
- `buildr-development-openspec`: 在 Project knowledge 中区分当前实现事实与 `task-cockpits/` 任务认知，避免驾驶舱被误当作 specs 或 change 的替代品。

## Impact

- 新增随包 workspace Skill、HTML 模板和 Skill UI metadata。
- 修改 `task-triage` Skill、workspace Skills manifest、package builtin 清单和静态验证。
- 修改 Product Project 的 current-state knowledge、文档索引和相关产品说明。
- 新增 Product Project 的真实任务驾驶舱 `openspec/knowledge/task-cockpits/2026-07-16-add-task-cockpit.html` 作为本变更示例和验收对象。
- 不新增 CLI 命令，不修改 Agent runtime adapter，不引入外部前端依赖。
