# task-asset-promotion Specification

## Purpose

定义 Buildr 对任务执行质量审查、Rule/Skill 沉淀候选筛选、证据胶囊和确认后写回边界的产品契约。
## Requirements
### Requirement: Buildr 提供任务资产沉淀审查 Skill
Buildr MUST 提供 optional 内置 `task-asset-review` Skill，指导 Agent 在任务结果稳定后反思任务执行质量，并识别值得晋升为组织工作资产的内容。

#### Scenario: 用户明确要求复盘或沉淀任务成果
- **WHEN** 用户要求 Agent 复盘任务执行、总结可沉淀的 Skill 或 Rule、保留可复用工作方法或表达等价意图
- **THEN** Agent MUST 使用 `task-asset-review` Skill 执行任务审查
- **AND** 该 Skill MUST 先检查任务执行证据和是否存在合格候选，而不是假设每个任务都必须产生新资产

#### Scenario: Agent 已发现具体可复用候选
- **WHEN** 任务即将结束且 Agent 已拥有明确、可验证、可能长期复用的候选内容
- **THEN** Agent MAY 主动使用 `task-asset-review` Skill
- **AND** Agent MUST NOT 仅为形式完整而对每个简单任务机械触发面向用户的复盘

#### Scenario: Workspace 不需要该能力
- **WHEN** 用户卸载 optional `task-asset-review` builtin 并重新同步 runtime
- **THEN** Buildr MUST 删除该 Skill 的 workspace 源和 runtime 投射
- **AND** 其他任务工作流 MUST 继续保持既有行为

### Requirement: 沉淀审查使用可观察任务节点与最终证据
`task-asset-review` Skill MUST 使用当前 runtime 和 session 可访问的任务节点输出及最终状态证据，并 MUST NOT 要求隐藏推理或完整任务轨迹。

#### Scenario: Agent 收集任务过程节点
- **WHEN** Agent 执行任务资产审查
- **THEN** Agent MUST 按相关性检查用户目标与纠正、对外可见计划和状态、工具调用结果、失败与重试、关键决策及 subagent 报告
- **AND** Agent MUST 只选择会改变结论、暴露执行质量或产生复用价值的高信息量节点

#### Scenario: Agent 收集最终状态证据
- **WHEN** Agent 执行任务资产审查
- **THEN** Agent MUST 检查相关 OpenSpec artifacts、最终变更范围、Git diff、验证结果、遗留风险及其他权威事实
- **AND** Agent MUST 只读取判断质量和候选所需的相关内容，不进行无关全量审计

#### Scenario: 部分任务节点不可访问
- **WHEN** 当前 runtime 或 session 无法提供部分早期任务节点
- **THEN** Agent MUST 说明审查证据限制并使用仍可访问的 artifacts、diff、验证结果和用户决策完成降级审查
- **AND** 缺少完整节点 MUST NOT 被视为任务收尾失败

#### Scenario: 审查不读取或保存隐藏过程
- **WHEN** Agent 为任务审查准备证据
- **THEN** Agent MUST NOT 声称读取模型隐藏推理、chain-of-thought 或内部 deliberation
- **AND** Buildr MUST NOT 因该审查保存完整原始对话、完整工具日志或逐节点任务回放

### Requirement: Agent 使用结构化方法反思任务执行质量
Agent MUST 先重建任务执行轮廓并评估执行质量，再判断是否存在组织资产候选。

#### Scenario: Agent 重建执行轮廓
- **WHEN** Agent 已收集相关任务节点和最终证据
- **THEN** Agent MUST 概括主要阶段、关键转折、失败回退和最终验证
- **AND** Agent MUST NOT 逐条复述全部节点或用最终总结替代过程审查

#### Scenario: Agent 评估任务执行质量
- **WHEN** Agent 反思任务执行过程
- **THEN** Agent MUST 检查目标一致性、路径效率、证据充分性、scope 与授权边界、token/工具成本以及复用机会
- **AND** 每项重要质量判断 MUST 能关联到用户纠正、工具结果、文件事实、diff、测试或其他可观察证据

#### Scenario: Agent 审查无谓 token 和工具消耗
- **WHEN** 任务过程存在无关 Skill 或 Rule 加载、重复读取、重复工具调用、无效全量搜索、重复完整验证、过度 subagent 或未被使用的冗长输出
- **THEN** Agent MUST 将其纳入成本质量反馈并说明可避免方式
- **AND** 没有 runtime usage 数据时 Agent MUST 只做定性判断，不得伪造 token 数量

#### Scenario: 必要证据读取产生合理成本
- **WHEN** 某项读取、验证或重复检查由安全边界、候选 tree 变化、契约要求或用户明确要求驱动
- **THEN** Agent MUST 将其视为必要成本
- **AND** Agent MUST NOT 为减少 token 而削弱任务正确性和验证证据

#### Scenario: Agent 识别高信息量转折点
- **WHEN** 用户纠正对象边界、初始假设被证据推翻、步骤无效重复、失败后识别根因或验证发现契约偏差
- **THEN** Agent MUST 优先审查该节点对任务质量和后续工作的影响
- **AND** Agent MUST 判断缺少何种长期事实、约束或流程导致该问题发生

#### Scenario: 质量问题不具有长期复用价值
- **WHEN** 某项发现只是一次性失误、偶发环境状态或当前任务特有路径
- **THEN** Agent MAY 将其作为本次执行质量反馈
- **AND** Agent MUST NOT 因其是问题就自动创建沉淀候选

### Requirement: 沉淀候选必须通过质量和作用域检查
Agent MUST 在向用户提出沉淀建议前，检查候选内容的证据、稳定性、可操作性、复用价值、目标 scope 以及与现有权威资产和配套资源的关系，并 MUST 输出完整覆盖、部分覆盖、存在冲突或尚无资产的覆盖度结论。

#### Scenario: 候选满足沉淀条件
- **WHEN** 候选内容有明确证据、在任务结束后仍可能长期有效、能转化为可操作事实或做法、对后续工作有复用价值，并可确定 Organization、Project 或 Service scope
- **THEN** Agent MUST 继续检查目标资产及其正文、模板、脚本、manifest 或其他相关资源中是否已有覆盖或冲突
- **AND** 检查通过后 Agent MAY 将其作为新资产或更新既有资产的沉淀建议提交用户确认

#### Scenario: 现有资产只覆盖部分实践
- **WHEN** 现有 Skill 的 description 或正文提及候选意图，但配套模板、脚本、manifest、数据模型或实际产物未实现已验证实践
- **THEN** Agent MUST 将候选分类为“部分覆盖”并指出具体缺口和源文件
- **AND** Agent MUST NOT 因标题或描述相似而判定为完整覆盖

#### Scenario: 候选只是临时状态或未经验证的推断
- **WHEN** 候选内容只适用于当前机器或 session、属于偶发错误、一次性探索过程、未经确认的推断或缺少长期复用价值
- **THEN** Agent MUST 排除该候选
- **AND** Agent MUST NOT 将其写入组织长期资产

#### Scenario: 候选与权威事实冲突
- **WHEN** 候选内容与现有 OpenSpec、Rule、Project/Service `AGENTS.md`、Skill 正文或其配套资源冲突
- **THEN** Agent MUST 将覆盖度标记为“存在冲突”，说明冲突来源和可选处理方式
- **AND** Agent MUST NOT 自动选择其中一个事实或静默覆盖现有内容

#### Scenario: 尚无目标资产
- **WHEN** 没有现有 Rule、Skill 或相关资源覆盖候选实践
- **THEN** Agent MUST 将覆盖度标记为“尚无资产”并提出新资产候选
- **AND** Agent MUST 继续遵守用户确认和目标资产生命周期

### Requirement: 候选只映射到 Rule 或 Skill
Agent MUST 根据候选内容回答的问题区分长期约束和可复用做法，并 MUST NOT 使用任务资产审查重新判断或沉淀 OpenSpec。

#### Scenario: 沉淀长期约束
- **WHEN** 候选回答 Agent“必须遵守什么”，包括价值观、边界、约束或禁止事项
- **THEN** Agent MUST 将其路由到对应 scope 的 Rule 或 Project/Service `AGENTS.md`
- **AND** Agent MUST NOT 把场景化操作手册写入 Rule

#### Scenario: 沉淀可复用做法
- **WHEN** 候选回答 Agent“遇到同类任务时怎么做”，包括专业动作、判断流程、命令、检查和完成标准
- **THEN** Agent MUST 将其路由到对应 scope 的 Skill
- **AND** Skill description MUST 只承担意图路由，具体流程 MUST 写入 Skill body

#### Scenario: OpenSpec 仅作为任务证据
- **WHEN** Agent 执行任务资产审查并读取 proposal、design、delta specs、canonical specs 或归档 change
- **THEN** Agent MUST 只把这些内容作为任务目标、用户决策和验证结论的证据
- **AND** Agent MUST NOT 输出 Specs 沉淀候选或判断是否需要新的 OpenSpec change

#### Scenario: 发现其他资产或产品线索
- **WHEN** 审查过程发现范围外产品问题、Command、Component、普通 docs 或其他非 Rule/Skill 线索
- **THEN** Agent MAY 在最终报告中将其标记为普通 follow-up
- **AND** Agent MUST NOT 将该线索包装为 Rule 或 Skill 候选，后续处理 MUST 重新使用 `task-triage` 或对应资产生命周期

#### Scenario: 不创建新的任务记忆资产
- **WHEN** 候选不能准确映射到现有资产类型
- **THEN** Agent MUST 说明其不适合成为 Rule/Skill 候选，并 MAY 将其标记为普通 follow-up
- **AND** Agent MUST NOT 创建新的通用 Memory、Execution Trace 或 Task Summary 资产类型

### Requirement: 审查输出区分执行质量反馈和资产建议
Agent MUST 区分对本次任务执行质量的反馈与需要长期写入的组织资产建议。

#### Scenario: 显式任务复盘
- **WHEN** 用户明确要求复盘任务执行
- **THEN** Agent MUST 输出简短执行轮廓、主要质量发现及其证据
- **AND** 只有通过沉淀门槛的发现 MUST 进入独立资产建议部分

#### Scenario: Task Finish 条件审查
- **WHEN** `task-finish` 的轻量资格判断命中并调用 `task-asset-review`
- **THEN** Agent MUST 在存在重要质量发现或合格候选时将摘要纳入最终收尾报告
- **AND** 没有重要发现时 Agent MAY 静默继续，不得创建空洞复盘

### Requirement: 写入前必须取得用户确认
Agent MUST 在改变 Buildr 源资产前向用户提交具体沉淀建议，并取得与实际写入范围匹配的确认。

#### Scenario: Agent 提出沉淀建议
- **WHEN** 一个候选通过质量、scope 和冲突检查
- **THEN** Agent MUST 说明触发场景、已验证发现、证据、可复用动作或约束、目标资产类型、目标 scope、拟修改位置和验证方式
- **AND** Agent MUST 等待用户确认后再执行写入

#### Scenario: 用户只确认部分候选
- **WHEN** Agent 同时提出多个相互独立的候选且用户只确认其中一部分
- **THEN** Agent MUST 只写入已确认候选
- **AND** 未确认或被拒绝候选 MUST 保持不变

#### Scenario: 没有合格候选
- **WHEN** 沉淀审查没有发现满足质量门槛的候选
- **THEN** Agent MUST 正常结束任务
- **AND** Agent MAY 不产生额外用户提示，不得创建空洞资产或形式化总结

### Requirement: 收尾报告保留可独立引用的候选证据
`task-finish` 在清理 worktree 前发现沉淀候选时，MUST 生成自包含证据胶囊，使后续写回不依赖原 worktree 或完整 session history。

#### Scenario: Agent 生成候选证据胶囊
- **WHEN** 完整审查形成一个合格沉淀候选
- **THEN** Agent MUST 在最终收尾报告中记录任务或 change identity、关键发现与证据摘要、目标资产、scope、建议动作和证据限制
- **AND** Agent MUST 在可用时补充最终 commit、相关 diff、归档 change、已有任务驾驶舱或稳定文件路径引用

#### Scenario: Worktree 已在收尾后清理
- **WHEN** 用户在后续任务中确认沉淀建议且原 task worktree 已删除
- **THEN** Agent MUST 优先从目标分支 Git history、归档 OpenSpec change、稳定文件路径和证据胶囊重新核查事实
- **AND** 完整 session history MAY 作为辅助证据，但 MUST NOT 成为唯一必需来源

#### Scenario: 候选主要依赖临时 session 节点
- **WHEN** 候选的关键依据无法从 Git、OpenSpec、测试或稳定文件重建
- **THEN** Agent MUST 在证据胶囊中保留必要的自包含摘要并标记证据耐久性较弱
- **AND** Agent MUST NOT 声称 worktree 清理后仍能恢复全部原始过程

### Requirement: 确认后的写回使用现有生命周期
用户确认沉淀建议后，Agent MUST 使用目标资产现有的维护、授权和验证流程完成写回。

#### Scenario: Agent 写入已确认候选
- **WHEN** 用户确认一个沉淀建议且 Agent 能在当前权限和工具边界内安全完成
- **THEN** Agent MUST 通过对应 Rule/Skill 的 Buildr CLI 或可验证源文件编辑写入目标资产
- **AND** 状态变化后 Agent MUST 运行当前 Agent doctor 或目标资产要求的专项验证

#### Scenario: 写入需要额外业务决策或权限
- **WHEN** 写入过程遇到语义选择、冲突、不可逆动作、额外权限或外部依赖
- **THEN** Agent MUST 停止尚未授权的动作并说明阻塞
- **AND** Agent MUST 保留已确认候选及其证据，等待用户或外部条件决定

### Requirement: 当前任务审查不依赖 Hook 或轨迹存储
`task-asset-review` MUST 以当前可访问证据完成审查，并 MUST NOT 将 Hook 或完整轨迹采集作为当前能力或后续阶段。

#### Scenario: 普通任务审查
- **WHEN** Agent 或 `task-finish` 执行任务资产审查
- **THEN** 审查 MUST 使用当前 session 与 worktree 已可见的节点、artifacts、diff 和验证证据
- **AND** Buildr MUST NOT 要求安装 runtime Hook、daemon、watcher 或事件总线

#### Scenario: 产品说明审查范围
- **WHEN** 产品文档描述任务资产审查的证据来源和能力边界
- **THEN** 文档 MUST 明确可观察任务节点不等于模型隐藏推理或持久化完整轨迹
- **AND** 文档 MUST NOT 将 Hook 描述为本功能的规划阶段

### Requirement: 资产审查核对源资产与实际产物
`task-asset-review` MUST 以目标源资产为权威边界，并 MUST 在候选依赖配套资源或真实输出时按需核对 Skill 目录、manifest、runtime 投射和实际产物；runtime 投射 MUST 只作为同步证据，不得替代源资产事实。

#### Scenario: 候选涉及 Skill 的配套资源
- **WHEN** 候选实践依赖模板、脚本、示例、agents metadata 或 manifest
- **THEN** Agent MUST 检查候选目标 Skill 的相关源文件和目录
- **AND** 覆盖度结论 MUST 指明实际检查的源资产与缺口

#### Scenario: 实际产物比通用 Skill 更丰富
- **WHEN** 真实任务产物使用的数据模型或流程比现有通用 Skill 及其资源更完整
- **THEN** Agent MUST 对照实际产物与源资产判定完整覆盖或部分覆盖
- **AND** Agent MUST 只吸收有稳定证据和复用价值的差异

#### Scenario: runtime 与源资产不一致
- **WHEN** runtime 投射内容与目标源资产不一致
- **THEN** Agent MUST 将 runtime 仅作为待同步或投射异常的证据
- **AND** Agent MUST NOT 以 runtime 内容覆盖源资产结论
