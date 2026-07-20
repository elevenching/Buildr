## Why

Buildr 已把“任务看板”加入现有 `task-cockpit` 的用户文案和数据模型，但产品主名称、Skill identity、Project knowledge 路径、模板、路由和验证仍以“任务驾驶舱”为准，形成长期双名称和升级歧义。现在需要将任务看板确立为唯一产品概念，并由 Agent 安全迁移 Buildr 管理的 Skill 与 runtime 身份，同时保持既有任务页面作为历史产物不变。

## What Changes

- 将“任务看板”确立为唯一面向用户的产品名称；新的 Skill、文档、页面和回复不再使用“任务驾驶舱（任务看板）”双名称。
- **BREAKING**：将 optional builtin Skill identity 从 `task-cockpit` 迁移为 `task-board`，并将新建看板的 canonical Project knowledge 路径和模板分别迁移为 `openspec/knowledge/task-boards/` 与 `assets/task-board-template.html`。
- 保留完整任务、真实 OpenSpec change、交付批次、依赖池、业务/技术方案、只读页面和 Agent 单向维护等现有产品边界；“任务看板”不因此变为可拖拽或直接回写状态的 Kanban。
- 让 Buildr package 声明 builtin replacement 关系；Agent 发起 workspace sync 时，由零副作用 preflight 识别旧 `task-cockpit` 的 installed、uninstalled、modified 或 missing 状态，并在安全时原子迁移到 `task-board`，遇到用户修改或身份冲突时停止并请求判断。
- 既有 `task-cockpits/*.html` 保持原文件、原路径和原内容，不批量转换、不改成跳转页；新任务才在 `task-boards/` 下创建任务看板。
- 用户只处理 Buildr-managed Skill identity 无法自动判定的冲突；用户不需要手工移动 Skill、runtime、目录、模板或历史 HTML。
- 保留已归档 OpenSpec 和历史交付记录中的原始术语，不把历史证据重写成当前产品事实。

## Capabilities

### New Capabilities

- `task-board`: 定义 canonical `task-board` Skill、任务看板信息模型、只读和事实来源边界，以及新任务看板的稳定 Project knowledge 路径。

### Modified Capabilities

- `task-cockpit`: 将原能力收敛为 legacy compatibility contract；禁止继续创建新的任务驾驶舱，同时保留旧名称意图识别和既有页面的历史证据边界。
- `agent-task-workflows`: 将 task triage、任务进展回复和旧名称意图统一路由到 `task-board`，并明确 Agent 而非用户承担迁移执行。
- `buildr-development-openspec`: 将新建任务知识的 canonical 子目录改为 `task-boards/`，同时定义既有 `task-cockpits/` 页面原地保留且不参与产品升级迁移。
- `buildr-product-capability-sync`: 支持 package 声明 builtin replacement，并在 sync preflight 中安全迁移 optional builtin identity、安装状态和 runtime 投射。
- `product-agent-skills`: 将产品入口对复杂任务可视化的 identity routing 改为 `task-board`，同时保留旧用户意图的无歧义发现。

## Impact

- Product package 与 bootstrap：builtin manifest、workspace baseline、安装回执、static validation 和 sync reconcile。
- Skills 与 runtime：`task-board`、`task-triage`、产品入口 Buildr Skill、Codex metadata、所有 adapter 的完整 Skill 目录投射和旧 runtime orphan 清理。
- Project knowledge：新 `task-boards/` 路径和页面模板；既有 `task-cockpits/` 页面不改写。
- OpenSpec 与文档：新增 canonical `task-board` spec，收敛 legacy `task-cockpit` spec，并更新 task workflow、Project knowledge、产品说明和 current-state knowledge。
- 验证：builtin replacement 的 installed/uninstalled/modified/missing 组合测试、历史页面零改写检查、Skill 路由歧义检查、模板静态审计、adapter parity 和最终 Product Candidate。
