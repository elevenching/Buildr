## Context

当前 `task-triage` 只输出处理路径、用户意图、语义影响和确认需求；各 `openspec-*` Skills 会在动作前说明 change id、路径和动作，但没有一个入口要求在采用 OpenSpec 时同时报告 change 的实时进度。结果是 Agent 已经进入 change-flow，用户却仍需主动追问 artifact 是否完成、下一步是什么或为什么暂停。

## Goals / Non-Goals

**Goals:**

- 在 `task-triage` 的输出契约中增加条件式 OpenSpec 状态摘要。
- 用 OpenSpec CLI 返回的事实表达状态，覆盖尚未创建、artifact 进度、task 进度、下一动作和阻塞原因。
- 让产品验证可以发现随包 Skill 丢失该约束。

**Non-Goals:**

- 不复制 OpenSpec 官方工作流教程。
- 不要求每条中间消息机械重复完整状态。
- 不改变 OpenSpec CLI、artifact schema 或 archive 行为。

## Decisions

1. **状态约束放入 `task-triage`，具体动作仍由 `openspec-*` Skills 执行。**
   `task-triage` 是决定是否采用 OpenSpec 的共同入口，适合保证用户可见性；具体如何 propose、apply、sync 或 archive 仍由官方衍生 Skills 负责。替代方案是逐个修改所有 OpenSpec Skills，但会重复相同约束并增加与上游同步的漂移。

2. **状态摘要使用条件式字段。**
   必填事实为 change id、resolved path（已解析时）、当前动作和当前状态；状态应按可用事实补充 artifact/task 进度、下一可执行动作或阻塞原因。change 尚未创建时明确写为“计划创建”，不伪造 CLI 状态。

3. **在首次采用、状态变化、暂停和完成时报告。**
   这覆盖用户需要判断任务位置的关键节点，同时避免在没有状态变化的每条消息中制造噪音。用户主动询问进度时也必须刷新并报告状态。

4. **验证检查语义锚点而非整段文本。**
   产品验证应确认 `task-triage` 同时包含 OpenSpec 条件、change 状态和进度/下一动作/阻塞信息，避免文案小改造成脆弱失败。

## Risks / Trade-offs

- [Risk] “当前状态”可能被 Agent 写成无法验证的自然语言 → 要求优先使用 `openspec status --json` 和 apply instructions 的事实字段。
- [Risk] 状态摘要过度重复导致回复冗长 → 只在首次采用、状态变化、暂停、完成或用户询问时强制刷新。
- [Risk] 只修改 `task-triage` 后，未触发该 Skill 的 OpenSpec 直接调用缺少状态摘要 → 现有 `openspec-*` Skills 已覆盖动作前 change 披露与阶段进度；本变更补齐任务分流入口，不替代这些 Skills。
