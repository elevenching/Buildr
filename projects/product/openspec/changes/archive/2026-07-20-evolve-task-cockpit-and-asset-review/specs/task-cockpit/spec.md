## MODIFIED Requirements

### Requirement: Buildr 提供任务驾驶舱 Skill
Buildr MUST 提供 optional builtin `task-cockpit` Skill，引导 Agent 为复杂、长期、跨批次、跨 change、跨团队或存在交叉依赖的任务创建和持续维护任务驾驶舱（任务看板）；驾驶舱与任务看板 MUST 指向同一 artifact，简单、短时且无持续跟踪价值的任务 MUST NOT 被机械要求创建看板。

#### Scenario: 复杂任务创建任务看板
- **WHEN** 任务跨多个交付批次、change、服务或团队，存在外部依赖、需要多次用户判断，或预计跨会话持续推进
- **THEN** Agent MUST 使用 `task-cockpit` 创建或继续维护任务驾驶舱（任务看板）
- **AND** 看板 MUST 覆盖整个任务，而不是只展示当前 OpenSpec change

#### Scenario: 用户使用任一名称
- **WHEN** 用户要求任务驾驶舱、任务看板、整体进度、任务全景或长期跟踪
- **THEN** Agent MUST 将这些意图路由到同一 `task-cockpit` Skill 和同一稳定 artifact
- **AND** Agent MUST NOT 创建相互独立的驾驶舱与看板状态

#### Scenario: 简单任务不创建任务看板
- **WHEN** 任务能够在短时间内完成、没有有意义的批次或依赖，且用户没有明确要求可视化
- **THEN** Agent MUST 继续通过简洁对话汇报
- **AND** Agent MUST NOT 为形式完整而创建空洞看板

### Requirement: 驾驶舱使用稳定的 Project knowledge 路径
任务驾驶舱（任务看板）MUST 保存在拥有该任务的 Project `openspec/knowledge/task-cockpits/` 下，并 MUST 使用 `yyyy-MM-dd-<task-id>.html` 文件名；日期 MUST 取首次创建时的本地日期，后续更新 MUST 保持同一路径。

#### Scenario: 创建 Project 任务看板
- **WHEN** Agent 首次为 Project task id `fund-system-integration` 创建任务看板，且本地日期为 2026-07-16
- **THEN** 文件路径 MUST 以 `openspec/knowledge/task-cockpits/2026-07-16-fund-system-integration.html` 结尾
- **AND** 后续批次或 change 变化 MUST 更新该文件而不是按更新时间创建新文件

#### Scenario: 任务看板跨越多个 change
- **WHEN** 一个任务包含已归档 change、当前 active change、code-only 工作或未来批次
- **THEN** 任务看板 MUST 保持稳定路径并关联这些批次
- **AND** OpenSpec change archive MUST NOT 使任务看板入口消失或被移动

### Requirement: 驾驶舱聚焦重要且易懂的信息
任务驾驶舱（任务看板）MUST 先展示结论再展示原因，MUST 高亮当前批次、阻塞和待确认事项，并 MUST 避免复杂说明、无必要的大表格、原始命令流水和 Agent 思考过程；任务进度 MUST 基于可核实的批次或任务数量，不得使用 Agent 主观猜测的百分比。

#### Scenario: 展示任务进度
- **WHEN** Agent 能核实交付批次或 task checkbox 状态
- **THEN** 任务看板 MUST 优先显示类似“批次 2/4”或“任务 7/11”的可追溯进度
- **AND** Agent MUST NOT 凭直觉显示无法解释的完成百分比

#### Scenario: 存在阻塞或待确认事项
- **WHEN** 任务因外部依赖、失败或用户判断无法继续
- **THEN** 任务看板 MUST 在首页高亮阻塞事实、影响和下一项可执行动作
- **AND** 相关信息 MUST NOT 仅埋在技术表格或历史记录中

### Requirement: 驾驶舱模板自包含且可移植
Buildr MUST 随 `task-cockpit` Skill 的完整 runtime 目录提供不依赖外部 CDN 的单文件 HTML 模板，模板 MUST 支持首页、推进、方案和技术细节的渐进视图，并 MUST 能在常见桌面和窄屏浏览器中阅读。

#### Scenario: Skill 从自身资源创建看板
- **WHEN** Agent 使用 runtime 中的 `task-cockpit` Skill 创建任务看板
- **THEN** Agent MUST 从该 Skill 的 `assets/task-cockpit-template.html` 复制模板
- **AND** Agent MUST NOT 依赖 workspace 源目录或重新手写模板

#### Scenario: 离线打开任务看板
- **WHEN** 用户通过本地文件路径打开生成的任务看板
- **THEN** 页面 MUST 在没有网络请求的情况下展示核心内容和导航
- **AND** 页面 MUST NOT 因缺少第三方脚本、字体或样式服务而失效

## ADDED Requirements

### Requirement: 任务看板关联真实 OpenSpec change
每个任务驾驶舱（任务看板）MUST 至少关联一个已创建的 OpenSpec change，并 MUST 展示 change id、核实状态、稳定路径及其与交付批次的关系；未来设想或仅有名称的计划 MUST NOT 冒充真实 change。

#### Scenario: 创建任务看板时已有 active change
- **WHEN** Agent 为复杂任务创建任务看板且 active change 已存在
- **THEN** 看板 MUST 在 `changes` 中记录该 change 的真实 id、状态和路径
- **AND** 至少一个交付批次 MUST 通过 change id 关联该 change

#### Scenario: 创建任务看板时尚无 change
- **WHEN** 任务需要任务看板但尚无已创建的 OpenSpec change
- **THEN** Agent MUST 先通过 task-triage 的 change-flow 创建并核实 change
- **AND** Agent MUST NOT 创建没有真实 change 关联的任务看板

#### Scenario: change 归档后继续维护看板
- **WHEN** 已关联 change 从 active 移至 archive
- **THEN** Agent MUST 更新该 change 的状态和稳定归档路径
- **AND** 看板 MUST 保留其与历史交付批次的关联

### Requirement: 任务看板按交付批次和依赖池组织进度
任务看板 MUST 用可独立计划、实施和验收的 `batches` 表示可执行交付，并 MUST 用 `dependencyPool` 表示启动条件尚未满足的任务；批次 MAY 包含 code-only 或外部协作项，但 MUST 显式记录其关联 change ids。

#### Scenario: 形成可独立交付批次
- **WHEN** 一组任务能够独立计划、实施和验收
- **THEN** Agent MUST 将其组织为具有稳定 id、状态、交付结果和 `changeIds` 的批次
- **AND** 看板 MUST 基于批次和批次内任务计算可核实进度

#### Scenario: 部分工作仍被依赖阻塞
- **WHEN** 任务中的一部分尚未满足外部条件，但其他工作可以继续
- **THEN** Agent MUST 将未就绪工作保留在 `dependencyPool` 并记录启动条件
- **AND** Agent MUST 将已就绪工作组织为新的可执行批次或 change，而不是阻塞整个任务

### Requirement: 任务看板区分方案与已完成技术事实
任务看板 MUST 分别维护普通用户可理解的业务方案、可执行技术方案和已完成复杂任务的技术细节；未完成工作的预期实现 MUST NOT 被表述为已经落地的事实。

#### Scenario: 展示尚在实施的方案
- **WHEN** 某项工作已有确认方案但尚未完成
- **THEN** 看板 MUST 将其记录在业务方案或技术方案中
- **AND** 看板 MUST NOT 将预期文件、接口或验证写入已完成技术细节

#### Scenario: 记录已完成复杂任务
- **WHEN** 一项复杂任务已经实现并有验证证据
- **THEN** 看板 MAY 在 `technical.details` 中记录关键实现、文件和验证
- **AND** 该细节 MUST 能追溯到关联批次或 change
