## REMOVED Requirements

### Requirement: Buildr 提供任务驾驶舱 Skill
**Reason**: 当前产品入口改为 `task-board`，不再发布并行的 `task-cockpit` Skill。
**Migration**: Buildr sync 根据 package replacement 迁移 builtin identity；旧用户措辞由 `task-board` description 继续识别。

### Requirement: 驾驶舱使用稳定的 Project knowledge 路径
**Reason**: 新任务知识的 canonical 路径迁移为 `openspec/knowledge/task-boards/`。
**Migration**: 新任务使用 `openspec/knowledge/task-boards/`；既有旧页面保持原路径和原内容。

### Requirement: 驾驶舱由 Agent 单向维护
**Reason**: 该行为由新的 `task-board` capability 继续承担。
**Migration**: 使用 `task-board` 的同名任务看板契约。

### Requirement: 驾驶舱优先服务普通用户理解
**Reason**: 该行为由新的 `task-board` capability 继续承担。
**Migration**: 使用 `task-board` 的普通用户优先契约。

### Requirement: 驾驶舱聚焦重要且易懂的信息
**Reason**: 该行为由新的 `task-board` capability 继续承担。
**Migration**: 使用 `task-board` 的信息聚焦契约。

### Requirement: 驾驶舱保持事实来源边界
**Reason**: 该行为由新的 `task-board` capability 继续承担。
**Migration**: 使用 `task-board` 的事实来源边界契约。

### Requirement: Agent 在关键回复中提供驾驶舱入口
**Reason**: 当前回复统一提供任务看板入口。
**Migration**: 使用 `task-board` 的关键回复入口契约。

### Requirement: 驾驶舱模板自包含且可移植
**Reason**: canonical 模板改为 `task-board/assets/task-board-template.html`。
**Migration**: 新任务使用 `task-board` 的新模板；既有旧页面保持不变。

### Requirement: 任务看板关联真实 OpenSpec change
**Reason**: 该任务看板行为迁移到 canonical `task-board` capability。
**Migration**: 使用 `task-board` 中相同 Requirement。

### Requirement: 任务看板按交付批次和依赖池组织进度
**Reason**: 该任务看板行为迁移到 canonical `task-board` capability。
**Migration**: 使用 `task-board` 中相同 Requirement。

### Requirement: 任务看板区分方案与已完成技术事实
**Reason**: 该任务看板行为迁移到 canonical `task-board` capability。
**Migration**: 使用 `task-board` 中相同 Requirement。

## ADDED Requirements

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
