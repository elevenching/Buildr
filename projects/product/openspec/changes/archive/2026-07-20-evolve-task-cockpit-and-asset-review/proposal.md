## Why

集鲜 workspace 已经验证了以交付批次、依赖任务池和覆盖度结论维护复杂任务的方法，但 Buildr builtin 仍以线性阶段表达任务进度，且资产审查没有系统核对现有 Skill 的正文与配套资源。与此同时，“任务驾驶舱”和“任务看板”缺少统一定义，页面也不能可靠回答当前任务关联了哪些 OpenSpec change。

## What Changes

- 将任务驾驶舱明确为同一份只读“任务看板”，以完整任务为边界，通过交付批次和依赖任务池维护进度。
- 要求每个任务看板至少关联一个真实 OpenSpec change，并显式展示 change 状态、路径及其与批次的关系。
- 升级内置单文件模板，增加 change、批次、依赖池、业务方案、技术方案和已完成技术细节的数据模型与渲染。
- 强化任务资产审查：核对已有 Skill 正文及其模板、脚本、manifest 等资源，输出完整覆盖、部分覆盖、存在冲突或尚无资产的结论。
- 将 Skill 核心合法性与 runtime adapter UI 扩展分层：通用校验和 Codex 发布都不要求 `agents/openai.yaml`；Codex/OpenAI adapter 只在该文件存在时独立校验其 metadata。
- 所有 filesystem Skills adapter 继续投射完整目录；非 OpenAI adapter 保留但不消费 `agents/openai.yaml`，Skill 核心行为只依赖相对于当前 `SKILL.md` 的可移植资源路径。
- 保留 `buildr.task-asset-review/v1` provider contract、只读审查和确认后写回边界；本变更不为任务看板新增 capability contract。
- 本变更不包含破坏性 CLI 或数据迁移；已有任务驾驶舱在下次实质更新时迁移到新模型。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `task-cockpit`: 统一任务驾驶舱/任务看板语义，新增 change 关联、交付批次、依赖任务池和新版模板契约。
- `agent-task-workflows`: task-triage 在创建或维护任务看板时保证真实 OpenSpec change 关联，并以批次状态维持入口可发现性。
- `task-asset-promotion`: 资产审查新增现有资产资源核对与覆盖度分类，保持 provider 和授权边界。
- `managed-skill-assets`: 区分可移植 Skill 核心结构与 adapter-specific 可选扩展，并明确随附资源相对 `SKILL.md` 解析。
- `workspace-first-runtime-projection`: 由 adapter descriptor 声明可选 vendor metadata 扩展及其校验方式，同时保持所有 adapter 的完整目录投射一致性。

## Impact

- 更新 `package/targets/workspace/skills/buildr/task-cockpit/` 的 Skill、runtime metadata 和 HTML 模板。
- 更新 `package/targets/workspace/skills/buildr/task-asset-review/` 的 Skill 流程。
- 更新 builtin manifest 描述、契约测试和当前任务看板。
- 更新 runtime adapter contract、package extension validation、必要的 OpenAI metadata 和 adapter 文档。
- 不新增外部依赖，不改变 OpenSpec、Git 或 runtime 的事实源职责。
