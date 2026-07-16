# 任务驾驶舱

## Purpose

定义 Buildr 如何为复杂任务提供由 Agent 单向维护、普通用户优先、路径稳定且不替代权威事实源的可视化任务驾驶舱。

## Requirements

### Requirement: Buildr 提供任务驾驶舱 Skill
Buildr MUST 提供 optional builtin `task-cockpit` Skill，引导 Agent 为复杂、长期、跨阶段、跨团队或存在交叉依赖的任务创建和持续维护任务驾驶舱；简单、短时且无持续跟踪价值的任务 MUST NOT 被机械要求创建驾驶舱。

#### Scenario: 复杂任务创建驾驶舱
- **WHEN** 任务跨多个阶段、change、服务或团队，存在外部依赖、需要多次用户判断，或预计跨会话持续推进
- **THEN** Agent MUST 使用 `task-cockpit` 创建或继续维护驾驶舱
- **AND** 驾驶舱 MUST 覆盖整个任务，而不是只展示当前 OpenSpec change

#### Scenario: 简单任务不创建驾驶舱
- **WHEN** 任务能够在短时间内完成、没有有意义的阶段或依赖，且用户没有明确要求可视化
- **THEN** Agent MUST 继续通过简洁对话汇报
- **AND** Agent MUST NOT 为形式完整而创建空洞驾驶舱

### Requirement: 驾驶舱使用稳定的 Project knowledge 路径
任务驾驶舱 MUST 保存在拥有该任务的 Project `openspec/knowledge/task-cockpits/` 下，并 MUST 使用 `yyyy-MM-dd-<task-id>.html` 文件名；日期 MUST 取首次创建时的本地日期，后续更新 MUST 保持同一路径。

#### Scenario: 创建 Project 任务驾驶舱
- **WHEN** Agent 首次为 Project task id `fund-system-integration` 创建驾驶舱，且本地日期为 2026-07-16
- **THEN** 文件路径 MUST 以 `openspec/knowledge/task-cockpits/2026-07-16-fund-system-integration.html` 结尾
- **AND** 后续阶段或 change 变化 MUST 更新该文件而不是按更新时间创建新文件

#### Scenario: 驾驶舱跨越多个 change
- **WHEN** 一个任务包含已归档 change、当前 active change、code-only 工作或未来阶段
- **THEN** 驾驶舱 MUST 保持稳定路径并关联这些阶段
- **AND** OpenSpec change archive MUST NOT 使驾驶舱入口消失或被移动

### Requirement: 驾驶舱由 Agent 单向维护
任务驾驶舱 MUST 由 Agent 根据已核实的任务事实单向维护，用户 MUST 通过 Agent 对话提供目标、判断和确认；HTML 中的 checkbox、状态、按钮或进度元素 MUST NOT 直接修改任务事实或回写 OpenSpec、代码和外部系统。

#### Scenario: 用户确认任务完成
- **WHEN** 用户通过对话说明某项工作已完成或要求调整状态
- **THEN** Agent MUST 核实相关证据并更新驾驶舱
- **AND** 用户 MUST NOT 需要在 HTML 中直接修改 checkbox

#### Scenario: 页面展示任务状态
- **WHEN** 驾驶舱显示任务 checkbox、状态 chip 或进度条
- **THEN** 这些元素 MUST 是只读展示
- **AND** 页面 MUST NOT 提供未经 Agent 核实的状态写回通道

### Requirement: 驾驶舱优先服务普通用户理解
任务驾驶舱 MUST 将与技术无关、普通用户能理解且对掌控任务最重要的信息放在首页或最前层，并 MUST 将 API、数据结构、代码、文件和技术证据放在后续视图或折叠区域。

#### Scenario: 用户打开驾驶舱首页
- **WHEN** 用户首次打开驾驶舱
- **THEN** 首页 MUST 简练回答任务目标、当前阶段、当前焦点、已完成、下一步、阻塞和需要用户关注的事项
- **AND** 首页 MUST NOT 以 API 表格、类名、数据库字段或大段代码作为主要内容

#### Scenario: 用户查看技术细节
- **WHEN** 用户进入技术细节视图
- **THEN** 页面 MAY 展示 API、状态映射、数据结构、关键文件、简略代码和验证结果
- **AND** 技术细节 MUST 与前层的任务目标和方案保持可追溯关系

### Requirement: 驾驶舱聚焦重要且易懂的信息
任务驾驶舱 MUST 先展示结论再展示原因，MUST 高亮当前工作、阻塞和待确认事项，并 MUST 避免复杂说明、无必要的大表格、原始命令流水和 Agent 思考过程；任务进度 MUST 基于可核实的阶段或任务数量，不得使用 Agent 主观猜测的百分比。

#### Scenario: 展示任务进度
- **WHEN** Agent 能核实任务阶段或 task checkbox 状态
- **THEN** 驾驶舱 MUST 优先显示类似“阶段 2/4”或“任务 7/11”的可追溯进度
- **AND** Agent MUST NOT 凭直觉显示无法解释的完成百分比

#### Scenario: 存在阻塞或待确认事项
- **WHEN** 任务因外部依赖、失败或用户判断无法继续
- **THEN** 驾驶舱 MUST 在首页高亮阻塞事实、影响和下一项可执行动作
- **AND** 相关信息 MUST NOT 仅埋在技术表格或历史记录中

### Requirement: 驾驶舱保持事实来源边界
任务驾驶舱 MUST 汇总 OpenSpec、代码、验证、外部依赖和已确认对话中的任务认知，但 MUST NOT 替代 canonical specs、active change、代码实现或验证证据；改变业务契约的决策 MUST 先维护对应权威资产，再由驾驶舱摘要表达。

#### Scenario: 驾驶舱发现业务契约变化
- **WHEN** Agent 在维护驾驶舱时确认某项决策改变业务 requirement、状态流、API、权限或数据语义
- **THEN** Agent MUST 按 task triage 维护对应 OpenSpec change 或 canonical spec
- **AND** 驾驶舱 MUST 只摘要该决策并链接权威来源

#### Scenario: 驾驶舱记录普通任务进度
- **WHEN** 信息只是当前焦点、外部等待、阶段关系或已核实验证结果
- **THEN** Agent MAY 直接更新驾驶舱
- **AND** Agent MUST NOT 为每条任务状态在 OpenSpec 中制造重复事实

### Requirement: Agent 在关键回复中提供驾驶舱入口
Agent MUST 在驾驶舱首次创建、发生实质更新、用户询问进度、任务暂停或完成时，在回复中提供任务名称、可点击绝对路径、workspace 相对路径、当前状态和更新时间；未成功更新时 MUST 明确说明未更新及原因。

#### Scenario: 驾驶舱成功更新
- **WHEN** Agent 完成一次实质驾驶舱更新
- **THEN** 回复 MUST 提供指向该 HTML 的可点击入口和 workspace 相对路径
- **AND** 回复 MUST 简要说明当前状态与更新时间

#### Scenario: 驾驶舱未更新
- **WHEN** Agent 因事实未确认、文件写入失败或其他阻塞未完成更新
- **THEN** 回复 MUST NOT 声称驾驶舱已更新
- **AND** 回复 MUST 说明未更新原因和下一步

### Requirement: 驾驶舱模板自包含且可移植
Buildr MUST 随 `task-cockpit` Skill 提供不依赖外部 CDN 的单文件 HTML 模板，模板 MUST 支持首页、推进、方案和技术细节的渐进视图，并 MUST 能在常见桌面和窄屏浏览器中阅读。

#### Scenario: 离线打开驾驶舱
- **WHEN** 用户通过本地文件路径打开生成的驾驶舱
- **THEN** 页面 MUST 在没有网络请求的情况下展示核心内容和导航
- **AND** 页面 MUST NOT 因缺少第三方脚本、字体或样式服务而失效
