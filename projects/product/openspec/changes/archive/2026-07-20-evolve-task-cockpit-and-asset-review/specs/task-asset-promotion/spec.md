## MODIFIED Requirements

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

## ADDED Requirements

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
