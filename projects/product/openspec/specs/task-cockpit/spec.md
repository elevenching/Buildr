# 任务驾驶舱兼容边界

## Purpose
定义旧 `task-cockpit` identity、旧名称和历史页面在任务看板成为当前产品能力后的兼容边界。

## Requirements

### Requirement: 旧任务驾驶舱能力不再创建新产物
Buildr MUST 将 `task-cockpit` Skill identity 和“任务驾驶舱”名称视为 legacy compatibility inputs，MUST NOT 将其继续发布为与任务看板并行的当前产品能力；既有 `task-cockpits/` 页面 MUST 作为历史产物原地保留。

#### Scenario: 用户使用旧名称表达意图
- **WHEN** 用户在升级后要求创建或维护“任务驾驶舱”
- **THEN** Agent MUST 使用 `task-board` 处理该意图并以“任务看板”回复
- **AND** Agent MUST NOT 创建新的 `task-cockpit` Skill 或 `task-cockpits/` 状态页面

#### Scenario: 产品升级遇到既有旧页面
- **WHEN** workspace 已存在 `openspec/knowledge/task-cockpits/*.html`
- **THEN** Buildr update、sync 和 Agent MUST NOT 因本次产品改名移动、转换、覆盖或替换这些页面
- **AND** 新任务 MUST 使用 canonical `task-boards/` 路径

#### Scenario: 历史证据包含旧名称
- **WHEN** Agent读取 archived change、历史提交说明或旧交付记录
- **THEN** Agent MUST 保留历史原文
- **AND** 历史旧名称 MUST NOT 被解释为仍需发布第二个当前产品入口
