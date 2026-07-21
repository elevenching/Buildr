## Context

Buildr 当前已经具备 OpenSpec、Rules、Skills、Commands、Components、Project/Service registry 和 runtime 投射能力，也通过 `task-triage`、`task-worktree`、`git-ops`、`task-finish` 等内置 Skills 管理任务生命周期。OpenSpec contract sidebar 已负责已记录 change 与 canonical specs 的契约一致性，`task-finish` 负责完整收尾。缺口不在 Specs 再审查，而在任务结束时缺少对执行过程、长期工作边界和可复用流程的统一反思。

当前 Agent 通常已经能访问本 session 中可观察的任务节点，例如 commentary、计划状态、工具调用与输出、错误和重试、diff、测试、用户纠正以及 subagent 报告。这些节点比最终总结更接近任务实际执行质量，但不等于模型隐藏推理，也不需要额外 Hook 或全过程采集。

因此本变更增加一个可移植的 `task-asset-review` Skill 作为审查引擎，并让 `task-finish` 在当前任务上下文和 worktree 消失前先执行轻量资格判断，命中后才非阻塞调用完整审查。审查先反馈任务执行质量，再把真正可复用的发现映射到既有组织资产。

## Goals / Non-Goals

**Goals:**

- 提供一个可卸载的内置 `task-asset-review` Skill，适用于 supported Agent runtimes。
- 使用当前可访问的任务节点输出和最终证据，而不是只看 Agent 最终总结。
- 建立明确、可重复的反思方法，识别任务路径中的关键转折、有效做法、返工、证据缺口和缺失工作资产。
- 把“任务质量反馈”和“长期资产候选”分开，避免每个问题都被写入组织资产。
- 识别应沉淀为 Rule 或 Skill 的内容，并保持与 OpenSpec 任务契约及其他资产生命周期的职责边界。
- 由 `task-finish` 在进入资产审查门控前确认用户决策、当前 change、实现和验证语义完整对齐，并复用 contract sidebar 验证已记录契约。
- 在 `task-finish` 中自动执行轻量资格判断，只在强信号命中后执行完整审查，不改变现有归档、验证、Git 集成和清理的成功条件。
- 识别无意义的 token、工具调用和验证消耗，同时避免为了节省 token 而削弱必要证据。
- 让收尾后的沉淀建议可以通过自包含证据摘要、Git history 和归档 OpenSpec 继续核查，不依赖已删除 worktree。
- 没有合格候选时允许不打扰用户，避免每个任务都产生空洞资产。
- 候选写入前取得用户确认，并复用目标资产现有生命周期。

**Non-Goals:**

- 不读取、展示或保存模型隐藏推理、chain-of-thought 或内部 deliberation。
- 不持久化完整原始对话、完整工具日志或逐节点任务回放。
- 不增加 runtime Hook、daemon、watcher、事件总线或新的 Agent adapter trait，也不在本 change 中规划此类后续阶段。
- 不新增 Memory、Task State、Execution Trace 或“任务总结”资产类型。
- 不让 `task-finish` 因资产审查无候选、不可用或失败而停止正常收尾。
- 不使用 `task-asset-review` 重新判断当前 change 是否完整、是否需要 OpenSpec change，或把 Specs 当作任务经验沉淀目标。
- 不把“收尾”授权扩大为自动修改 Rule、Skill 或其他组织资产。
- 不自动决定最终写入内容。

## Decisions

### 1. Task Finish 先证明任务完成，再执行资产审查门控

`task-finish` 在任何资产审查之前先承担当前任务的语义完成检查：

- 对照用户已经确认的目标、纠正和决策；
- 对照 active change 的 proposal、design、delta specs 和 tasks；
- 对照最终实现、Git diff、测试和验证结果；
- 确认任务范围内的语义已经进入 change、实现和验证；
- 运行 OpenSpec contract sidebar，检查已记录 proposal、delta、baseline、canonical specs、active conflict 和同步结果。

语义缺失、实现偏差或 contract check 失败时，`task-finish` 按既有正确性门禁停止并回到修正流程。contract sidebar 能证明已记录契约的一致性，但不能发现完全未写入 artifacts 的用户决定，因此语义完成检查仍由 `task-finish` 负责。

任务确认完成后，`task-finish` 才进入资产审查门控。新增的 `task-asset-review` workspace Skill 通过现有 builtin、sync 和 runtime render 生命周期交付，封装证据选择、执行质量反思、Rule/Skill 候选提炼和确认格式。

用户明确要求“复盘一下”“总结一下能否沉淀成技能或规则”或等价意图时，直接使用完整 Skill。`task-finish` 不默认加载完整 Skill，而是先根据当前上下文执行短小的资格判断，不调用工具、不重新读取文件：

- 用户纠正过 Agent 工作边界、资产职责、scope 或授权范围；
- 初始假设被代码、命令、测试或用户反馈推翻；
- 出现具有明确根因和复用价值的失败、重试或回退；
- 同一搜索、工具、修复或验证出现无效重复或明显 token 浪费；
- 形成新的长期工作边界、约束或可复用流程；
- Agent 已明确发现具体沉淀候选。

没有这些信号时，`task-finish` 直接继续，不加载 `task-asset-review`、不扫描任务节点、不输出形式化复盘。命中任一强信号时，才在 OpenSpec 归档和 worktree 清理之前调用完整 Skill。若当前候选 tree 已有同一轮有效审查结果，则复用结果。

这种分层让显式复盘保持完整，同时把普通收尾的增量成本限制在短小资格判断。

### 2. 使用可观察节点，不依赖完整轨迹

Skill 按可用性检查两类证据。

第一类是任务过程节点：

- 用户原始目标、后续纠正和明确决策；
- Agent 对外可见的计划、状态更新、假设和阶段结论；
- 文件搜索、代码阅读、命令、工具调用及其输出；
- 失败、重试、回退、阻塞和根因定位；
- subagent 的任务划分、证据和最终报告。

第二类是最终状态证据：

- proposal、design、delta specs、tasks 和 canonical facts；
- 最终 Git diff、提交范围和 tree 状态；
- 测试、构建、静态检查和验收结果；
- 已排除方案、遗留风险及外部依赖结论。

Skill 只使用当前 runtime 和 session 已经可访问的证据，不要求为未来审查额外采集或持久化完整轨迹。某些节点不可访问时，Agent 明确证据限制，并使用剩余最终证据完成降级审查。

### 3. 以高信息量转折点为中心进行反思

Agent 不逐条复述所有节点，而是先重建简短执行轮廓，再选择会改变任务结论或暴露执行质量的高信息量节点：

- 用户纠正了对象边界、产品语义或授权范围；
- 初始假设被代码、文档、命令结果或测试推翻；
- 同一搜索、命令或修复被无效重复；
- 出现失败、回退或绕路，并最终识别出根因；
- 验证发现实现与契约、预期或最终总结不一致；
- 某项知识缺失导致 Agent 临时摸索，而后续同类任务大概率再次遇到；
- 某个有效步骤显著降低风险、缩短定位或避免错误。

反思围绕六个问题进行：

1. 目标一致性：最终处理是否持续对齐用户真实目标，何处发生过偏移？
2. 路径质量：哪些步骤有效，哪些步骤属于可避免的绕路、重复或过度检查？
3. 证据质量：关键结论是否由代码、spec、命令、测试或用户确认支撑？
4. 边界质量：是否正确处理 scope、权限、资产职责和任务生命周期？
5. 成本质量：是否发生无关 Skill/Rule 加载、重复读文件、重复工具调用、无效全量搜索、重复完整验证、过度 subagent 或未被使用的冗长输出？
6. 复用机会：缺少什么长期事实、约束或流程，导致本次需要重新发现？

有 runtime token usage 时可以将其作为辅助证据；没有精确 usage 时只依据可观察的重复与无效动作做定性判断，不伪造 token 数量。必要的安全检查、验证和证据读取不能仅因消耗 token 被判为浪费。

审查输出简短的执行轮廓、主要质量发现和证据，不输出完整原始日志，也不伪装成模型内部思考解释。

### 4. 质量问题不等于沉淀候选

执行质量复盘可以指出一次性失误、偶发环境问题或当前任务特有绕路，但这些内容默认只进入本次反馈。只有能提炼为稳定、可操作、可复用知识的发现，才继续成为沉淀候选。

候选采用以下结构：

- 触发场景：后续在什么情况下需要这项知识；
- 已验证发现：本次确认了什么事实、边界或有效做法；
- 证据：哪些用户决策、文件、命令结果、diff 或验证支撑它；
- 可复用动作或约束：后续 Agent 应遵守什么或如何执行；
- scope 与目标资产：应在哪个 Organization、Project 或 Service 生效。

候选仍必须通过长期有效性、重复价值、可操作性、重复/冲突和 scope 检查。只描述“这次发生了什么”的流水账不能晋升为组织资产。

### 5. 任务资产审查只沉淀 Rule 和 Skill

两类目标分别回答不同问题：

- Rule：Agent“必须遵守什么”，包括价值观、长期边界、约束和禁止事项；Rule 不承载场景化操作手册。
- Skill：Agent“遇到同类任务时怎么做”，包括可复用专业动作、判断流程、命令、检查和完成标准。

OpenSpec 是当前任务契约和证据来源，不是该 Skill 的沉淀输出；Project/Service `AGENTS.md` 只作为对应 scope Rule 的载体。若过程暴露了范围外的产品问题、外部 CLI、Component、普通 docs 或其他资产线索，Agent 可以在最终报告中标记为普通 follow-up，但不得由 `task-asset-review` 判断 OpenSpec 路径或把它们包装为 Rule/Skill 候选。后续用户决定处理时，再交给 `task-triage` 或对应 Buildr 资产生命周期。

### 6. 输出分为执行质量反馈和沉淀建议

显式调用 `task-asset-review` 时，Agent 可以输出：

1. 执行轮廓：本次任务经历的主要阶段和关键转折；
2. 质量发现：有效做法、可避免问题、证据缺口及其依据；
3. 沉淀建议：通过质量门槛的候选内容、目标资产、scope、位置和验证方式。

`task-finish` 资格判断未命中时静默继续；命中并执行完整审查后，没有质量问题和沉淀候选时同样静默。存在重要质量发现或候选时，将简短结果放入最终收尾报告。该报告不是组织源资产，用户后续确认某个建议时再启动相应维护流程。

### 7. Task Finish 集成保持非阻塞和无写入

`task-finish` 在资格判断命中后，于以下边界内调用完整审查：

- 当前任务/change、候选 tree 和最终验证证据已经可确认；
- OpenSpec artifacts、diff、测试证据和当前 session 节点仍可访问；
- 归档、提交、集成和 worktree 清理尚未使证据入口消失。

审查无候选时继续收尾；Skill 不可发现、执行失败或证据不足时记录降级原因并继续。审查不得等待用户确认、修改组织资产、改变候选 tree 或使既有验证失效。

当前任务的 OpenSpec、实现与验证完整性已经在资产门控前由 `task-finish` 和 contract sidebar 处理，`task-asset-review` 不重复该判断。用户在最终报告后确认 Rule 或 Skill 建议时，Agent 重新通过目标资产生命周期判断所需维护范围和授权。

### 8. 收尾前形成可独立引用的证据胶囊

worktree 清理后，代码和文档事实应从目标分支 Git history、最终 commit/diff、归档 OpenSpec change 和稳定文件路径继续核查。完整 session history 可能被压缩、不可跨 runtime 访问或无法长期保证，因此只能作为辅助证据。

当完整审查形成沉淀候选时，Agent 在最终收尾报告中为每个候选生成证据胶囊：

- 任务或 change identity；
- 关键用户纠正、执行转折和已验证发现的自包含摘要；
- 支撑结论的文件、命令结果、测试或其他证据类型；
- 最终 commit、相关 diff、归档 change、已有任务驾驶舱或稳定文件路径等可用引用；
- 目标资产、scope、建议动作和证据限制。

证据胶囊不保存完整日志或对话，但必须让后续 Agent 在 worktree 已删除时仍能理解候选和重新定位大部分事实。若候选主要依赖无法从 Git/OpenSpec 重建的临时 session 节点，Agent 必须在胶囊中保留必要摘要并明确其证据耐久性较弱，不能声称以后一定可以恢复全部过程。

## Risks / Trade-offs

- [当前 runtime 无法访问部分早期节点] → 以当前 session 可见证据为上限，明确限制并降级到 artifacts、diff 和验证结果；不为完整性引入轨迹存储。
- [节点太多导致复盘变成长日志] → 只选择改变结论、暴露问题或具有复用价值的高信息量转折点。
- [把一次性错误沉淀为长期规则] → 先区分本次质量反馈和资产候选，再执行稳定性、复用性和证据门槛。
- [Task Finish 报告变得嘈杂] → 无重要发现时静默；有候选时只报告摘要和下一步确认入口。
- [自动审查浪费 token] → `task-finish` 只执行无工具轻量资格判断，命中强信号后才加载完整 Skill；完整审查不重新全量扫描、不重复验证、不启动 subagent。
- [审查故障影响正常交付] → 明确为非阻塞降级步骤，不改变现有收尾成功条件。
- [worktree 清理后丢失参考证据] → 最终报告生成自包含证据胶囊并引用 Git history、归档 OpenSpec 和稳定路径；session history 只作辅助。
- [低质量内容污染长期资产] → 强制证据、长期有效性、可操作性、scope 和冲突检查，并要求用户确认。
- [Rule 与 Skill 写入边界不同] → 审查只提出候选，实际写入继续复用对应资产的既有流程和授权边界。
- [新增 builtin 扩大 package 维护面] → 复用现有 optional Skill manifest、render、doctor 和卸载机制，并补充静态契约和跨 adapter 投射测试。

## Migration Plan

1. 将 `task-asset-review` 作为 optional builtin 随后续产品版本发布。
2. 同步更新 `task-finish`，先完成任务语义对齐和 OpenSpec contract checks，再执行轻量资格判断，命中后才非阻塞调用该 Skill；Skill 已显式卸载时尊重用户选择并跳过。
3. 现有 workspace 在执行 `buildr sync <agent>` 后获得新 Skill 和更新后的收尾编排；用户可以通过 builtin 生命周期卸载审查 Skill。
4. 不修改现有 workspace 资产语义，不要求迁移历史任务或回放旧 session。
5. 回滚时移除 optional builtin、Buildr Skill 路由和 `task-finish` 调用，不影响其他资产和任务工作流。

## Open Questions

- 不同 runtime 对当前 session 任务节点的可访问程度可能不同；实现时需要用行为 fixture 验证最小共同证据集，并将不可访问节点作为显式降级而不是失败。
- 最终收尾报告中执行质量摘要的详细程度需要通过真实任务验证，默认只保留会影响后续工作或形成沉淀候选的内容。
