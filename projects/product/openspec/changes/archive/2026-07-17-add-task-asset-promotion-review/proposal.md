## Why

Buildr 已能管理和投射组织工作资产，但一次任务中新确认的长期工作边界和可复用流程仍主要停留在当前对话或个人经验中。只看最终结果又不足以判断任务为什么做得好或不好：真正有信息量的内容经常出现在用户纠正、计划变化、工具输出、失败重试、关键决策和验证结果等任务节点中。

现在引入任务资产沉淀审查，可以让 Agent 在任务结束时基于当前可观察的执行过程和最终证据，先复盘任务执行质量，再判断哪些发现值得晋升为组织资产，从而形成“任务完成—质量反思—资产积累”的闭环。

## What Changes

- 新增可卸载的内置 `task-asset-review` Skill，在用户明确要求复盘、总结可沉淀的 Skill/Rule，或 `task-finish` 的轻量资格判断命中时执行完整任务审查。
- 指导 Agent 使用当前 session 可访问的任务节点输出，包括用户目标与纠正、计划和状态变化、工具调用结果、失败与重试、关键选择、Git diff、验证结果和 subagent 报告；同时明确不读取或保存模型隐藏推理。
- 定义结构化反思方法：重建执行轮廓、识别高信息量转折点，评估目标一致性、路径、证据、边界、token/工具成本与复用机会，再执行证据、稳定性、复用价值、重复冲突和 scope 检查。
- 将审查输出拆为两层：任务执行质量复盘只用于反馈本次任务表现；只有通过质量门槛的发现才成为资产沉淀建议。
- 将 Rule 和 Skill 作为任务资产沉淀目标：Rule 承载长期边界和约束，Skill 承载可复用专业动作和工作流。OpenSpec 继续作为当前任务契约和审查证据，不作为该 Skill 的沉淀目标。
- 更新 `task-finish`，在资产审查门控前先检查用户已确认目标和决策、当前 change、实现与验证是否语义完整对齐，再通过 OpenSpec contract sidebar 验证已记录 proposal、delta、baseline 和 canonical specs 的一致性；任务未完成时停止既有收尾流程。
- 当前任务确认完成后，`task-finish` 再使用当前上下文执行不加载完整审查 Skill、不调用工具的轻量资格判断；只有出现工作边界纠正、假设被推翻、有效失败根因、无效重复、token 浪费、新长期约束或可复用流程等强信号时，才调用或复用完整任务审查。
- `task-finish` 的完整审查在最终验证证据稳定且 worktree 尚未清理时执行。没有重要发现时继续收尾；审查不可用或失败时报告降级但不因沉淀能力本身阻塞归档、提交、集成和清理。
- `task-finish` 只在最终收尾报告中返回执行质量摘要和沉淀建议，不中断收尾等待确认，也不把“收尾”解释为修改组织资产的授权。
- 对每个沉淀候选生成可独立引用的证据胶囊，至少包含任务/change、关键发现与证据摘要、目标资产与 scope，以及最终 commit、归档 change 或稳定文件路径等可用引用；后续写回不依赖原 worktree 或完整 session history。
- 用户确认沉淀建议后，Agent 再通过目标资产的现有生命周期执行写入和验证。
- 本变更不引入或规划 runtime Hook、daemon、watcher、事件总线或完整任务轨迹存储。
- 本变更不包含破坏性变更。

## Capabilities

### New Capabilities

- `task-asset-promotion`: 定义基于可观察任务节点与最终证据的执行质量反思、组织资产候选识别、质量判断、作用域和资产类型映射、用户确认及安全写回边界。

### Modified Capabilities

- `agent-task-workflows`: 增加任务资产审查作为内置场景化 Skill，并定义它与 `task-finish` 的非阻塞集成、失败降级和授权边界。
- `product-agent-skills`: 产品入口 Buildr Skill 在用户要求复盘、沉淀任务经验或发现明确可复用成果时，路由到任务资产审查 Skill。

## Impact

- 影响随包 workspace Skills、`package/manifest.yml`、`skills/manifest.yml` 和所有 supported runtime 的 Skill render 结果。
- 影响产品入口 Buildr Skill、`task-finish` Skill 的意图路由、收尾编排和完成报告。
- 需要补充 package/static validation、Skill 投射和行为契约测试，覆盖 `task-finish` 语义完成检查、contract sidebar 分层、轻量资格判断、显式完整复盘、节点证据审查、token 浪费识别、Rule/Skill 映射、证据胶囊、无节点降级、无候选静默继续、审查失败降级及用户确认边界。
- 可能更新产品说明、当前能力或已知限制，但不新增 CLI 命令、数据库、远程服务或 runtime adapter。
