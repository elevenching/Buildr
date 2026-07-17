## 1. 任务审查 Skill 与反思方法

- [x] 1.1 使用 Buildr Skill 规范创建 `task-asset-review` Skill，写明显式复盘、明确总结 Skill/Rule 意图、主动候选和 `task-finish` 条件调用的触发边界。
- [x] 1.2 在 Skill 中定义可观察节点证据：用户纠正、计划与状态、工具输出、失败重试、关键决策、subagent 报告、diff 和验证结果；禁止隐藏推理和完整轨迹采集表述。
- [x] 1.3 实现结构化反思流程：重建执行轮廓、选择高信息量转折点、检查目标一致性、路径效率、证据质量、scope/授权边界、token/工具成本和复用机会。
- [x] 1.4 将输出分为执行质量反馈和资产沉淀建议；只有满足证据、长期有效性、可操作性、复用价值、scope 和冲突门槛的发现才进入候选。
- [x] 1.5 明确资产映射边界：长期约束进入 Rule，可复用做法进入 Skill；OpenSpec 只作为任务契约和证据，不由本 Skill 判断或沉淀。
- [x] 1.6 定义候选确认和证据胶囊格式，包含触发场景、已验证发现、证据、可复用动作或约束、目标资产、scope、位置、稳定 Git/OpenSpec 引用、证据限制和验证方式。
- [x] 1.7 运行新 Skill 内容、格式和直接行为 fixture 的最小反馈检查。

## 2. Task Finish 与产品入口集成

- [x] 2.1 更新 `task-finish`，先对照用户已确认决策、当前 change、实现和验证检查任务语义完整性，再复用 OpenSpec contract sidebar 验证已记录契约。
- [x] 2.2 在任务完成检查通过后执行不调用工具、不重新读取文件、不加载完整审查 Skill 的轻量资格判断，仅在强信号命中后调用 `task-asset-review`。
- [x] 2.3 定义强信号和跳过条件，覆盖工作边界纠正、假设推翻、有效失败根因、无效重复、token 浪费、新长期约束、可复用流程、明确 Rule/Skill 候选及无信号静默继续。
- [x] 2.4 在最终候选和验证证据可确认、OpenSpec 归档和 worktree 清理之前执行条件审查，并复用当前 tree 已有的有效审查结果。
- [x] 2.5 保持条件审查只读和非阻塞：无候选静默继续；Skill 卸载、不可发现、证据不足或执行失败时报告降级但不因沉淀能力本身阻塞收尾。
- [x] 2.6 在最终收尾报告中只展示重要执行质量发现、Rule/Skill 候选及可独立引用的证据胶囊，不中断收尾等待确认，也不自动写入组织资产。
- [x] 2.7 更新产品入口 Buildr Skill 的 description 和正文，使“复盘、总结技能或规则、把工作方法留给后续 Agent”等意图路由到 `task-asset-review`，但不复制完整流程。
- [x] 2.8 将 `task-asset-review` 注册为 optional builtin，补齐 package manifest、workspace Skills manifest、workspace file mapping 和全部 supported runtime 的投射计划。
- [x] 2.9 补充静态 package 契约，检查新 Skill 的文件完整性、manifest identity、optional 生命周期、禁止 Specs 沉淀、Hook、隐藏推理和完整轨迹表述，以及 Buildr Skill、`task-finish` 路由一致性。
- [x] 2.10 运行与 builtin、Buildr Skill、`task-finish` 和 package manifest 直接相关的最小反馈测试。

## 3. 行为验证与产品说明

- [x] 3.1 增加任务节点行为 fixture，覆盖用户纠正、假设被推翻、失败重试、无效重复、验证偏差、subagent 报告、无谓 token/工具消耗、必要验证成本和只有最终证据可用的降级场景。
- [x] 3.2 增加审查输出 fixture，覆盖只有执行质量反馈、形成 Rule 候选、形成 Skill 候选、OpenSpec 仅作证据、其他资产 follow-up、没有合格候选和权威事实冲突。
- [x] 3.3 增加 `task-finish` 行为契约，覆盖资格判断未命中、命中后调用、结果复用、无候选静默、Skill 卸载、审查失败降级、证据胶囊及“收尾”不授权写入。
- [x] 3.4 增加收尾后复用 fixture，确认删除 worktree 后可通过最终 commit/diff、归档 change、稳定路径和证据胶囊继续核查候选，并明确 session-only 证据限制。
- [x] 3.5 增加 runtime render 和 doctor 验证，确认全部 supported adapters 能安装、同步、发现和卸载 `task-asset-review`，且卸载不影响其他任务 Skills 或 `task-finish` 正常收尾。
- [x] 3.6 更新产品说明、当前能力或已知限制，明确轻量门控、可观察节点、token 成本审查、证据胶囊、不读取隐藏推理、不保存完整轨迹和无 Hook 边界。
- [x] 3.7 审查 task-finish / contract sidebar / task-asset-review 分层和 Rule/Skill 写回边界，确认新流程没有重复判断当前 change、把任务经验写入 Specs、把操作手册写入 Rule 或把一次性问题写成长效资产。
- [x] 3.8 运行 `npm run test:affected -- package openspec` 完成本任务组的受影响范围验证。

## 4. 候选冻结与完整验证

- [x] 4.1 对照 proposal、design 和 delta specs 审查最终实现，确认独立审查 Skill、`task-finish` 轻量门控与非阻塞条件调用、过程节点证据、资产映射和无 Hook 边界一致。
- [x] 4.2 运行 `openspec validate --all --strict`、`git diff --check` 和相关静态检查，修复自然语言资产、spec 或 package 一致性问题。
- [x] 4.3 冻结最终候选 tree，运行 `npm run test:candidate`，读取 timing summary 并记录总耗时、最慢阶段、失败阶段和 summary 路径。
- [x] 4.4 根据最终验证和 review 结果更新任务驾驶舱，确保当前状态、完成任务、风险和后续阶段与权威事实一致。
