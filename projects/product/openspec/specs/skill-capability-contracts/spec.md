# skill-capability-contracts Specification

## Purpose
定义 Buildr Skill capability contract、provider/consumer 声明、scope binding、依赖 readiness、runtime 投射和 Agent 工作能力适配的产品契约。

## Requirements
### Requirement: Agent 根据工作意图执行工作能力适配
Buildr MUST 将用户工作意图作为 Agent 工作能力适配的入口，并 MUST NOT 要求普通用户识别或手动维护 capability contract、provider、consumer 或 binding。

#### Scenario: 用户表达工作方式变化
- **WHEN** 用户要求采用内部流程、调整默认工作方式、修改 Skill 行为或替换某项专业动作
- **THEN** Agent MUST 先判断该意图是否触达或产生跨 Skill 稳定依赖边界
- **AND** Agent MUST 检查相关 Skill 的 `provides`、`requires`、当前 binding、routing evidence 和受影响 consumers
- **AND** Agent MUST NOT 把底层 manifest 或 binding 操作作为默认结果要求用户完成

#### Scenario: 变化只属于单个 Skill 内部
- **WHEN** 目标行为不被其他 Skill 组合、不需要替换实现、consumer 不依赖其稳定保证或结果证据，且修改或卸载无需跨 Skill 影响诊断
- **THEN** Agent MUST 将其作为普通 Skill 维护
- **AND** Agent MUST NOT 为形式完整创建空洞 capability contract

#### Scenario: 变化触达已有 contract
- **WHEN** 用户意图修改已有 provider 且目标行为仍处于 contract `Allowed Variations` 内
- **THEN** Agent MUST 在保持 contract identity 和 guarantees 的前提下修改候选 provider
- **AND** Agent MUST 验证所有受影响 consumers 后再激活
- **AND** Agent MUST NOT 要求用户了解这些 consumers

#### Scenario: 变化产生新的跨 Skill 边界
- **WHEN** 另一 Skill 需要调用或编排该行为、需要替换实现、依赖稳定保证或结果证据，或生命周期需要影响诊断
- **THEN** Agent MUST 评估并创建最小 capability contract、provider 和 consumer declarations
- **AND** contract MUST 只包含 consumer 无法安全继续时真正依赖的行为

#### Scenario: 候选适配失败
- **WHEN** 候选 provider 不满足 contract、组合验证失败或激活计划会产生未接受的 blocked consumers
- **THEN** Agent MUST 保留当前有效实现和 binding
- **AND** Agent MUST 报告失败证据、受影响能力和需要用户决定的语义差异

### Requirement: Skill capability contract 使用独立身份和版本
Buildr MUST 将可组合 Skill 的能力契约与 Skill 资产身份分离，并 MUST 使用稳定 capability id 和正整数 major version 表达兼容边界。

#### Scenario: 声明 capability contract
- **WHEN** workspace 或 Project Skills manifest 声明一个 capability contract
- **THEN** manifest entry MUST 包含 namespaced capability id、version、description 和受管 contract 文档路径
- **AND** contract Markdown MUST 使用 `buildr.capability-contract/v1` frontmatter 自描述相同的 id 和 version
- **AND** contract 文档 MUST 定义 `Purpose`、`Consumer Obligations`、`Minimum Guarantees`、`Effects and Authorization`、`Result Evidence`、`Decision Points` 和 `Allowed Variations`
- **AND** contract MAY 包含非规范性的 `Examples`

#### Scenario: Contract frontmatter 与 manifest 不一致
- **WHEN** contract frontmatter 的 id 或 version 与 manifest 注册断言不同
- **THEN** package check、doctor 和 render MUST 报告 contract identity integrity error
- **AND** Buildr MUST NOT 选择其中一份 identity 继续解析 provider

#### Scenario: 同一 scope 链重定义 contract identity
- **WHEN** workspace、Project 或 package 在同一可见 scope 链为相同 capability id/version 提供多个 contract definitions
- **THEN** Buildr MUST 报告 contract identity conflict
- **AND** 更具体 scope MUST NOT 静默覆盖既有 contract 语义
- **AND** 内部 provider 实现 Buildr contract 时 MUST 引用既有 identity，而不是复制同名 contract

#### Scenario: Contract 发生不兼容变化
- **WHEN** capability contract 新增或修改 normative clause，使原本合规 provider 变为不合规，或改变前置条件、允许副作用、授权、结果或失败语义
- **THEN** 维护者 MUST 增加 capability major version
- **AND** Buildr MUST NOT 把旧 version provider 视为新 version consumer 的兼容实现

#### Scenario: Contract 只做兼容澄清
- **WHEN** 维护者只修改文字澄清、非规范性 examples 或不收紧 `Minimum Guarantees` 的说明
- **THEN** contract MAY 保持原 major version
- **AND** 变更 MUST NOT 把 provider-specific command、algorithm 或 policy 提升为 normative requirement

#### Scenario: 普通独立 Skill 不参与 composition
- **WHEN** Skill 不被其他 Skill 组合且不需要成为可替换 provider
- **THEN** Buildr MUST 允许该 Skill 不声明 `provides` 或 `requires`
- **AND** capability framework MUST NOT 强迫所有 Skill 创建空洞 contract

### Requirement: Skill 声明 provides 和 requires
Buildr Skills manifest MUST 支持 Skill entry 声明其提供和依赖的 capability contract，并 MUST 将依赖 mode 与 builtin required lifecycle 分开表达。

#### Scenario: Skill 提供多个 capabilities
- **WHEN** 一个 Skill 实现多个稳定 capability contracts
- **THEN** Skill entry MUST 能够通过 `provides` 分别声明每个 capability id 和 version
- **AND** Buildr MUST 保持 Skill id 作为资产身份，不用 capability id 替代 Skill id

#### Scenario: Consumer 声明 required dependency
- **WHEN** consumer 缺少某项能力就不能正确完成自身用户意图
- **THEN** consumer MUST 通过 `requires` 声明该 capability id、version 和 `mode: required`

#### Scenario: Consumer 声明 optional dependency
- **WHEN** consumer 在某项能力缺失时仍能按已声明方式安全降级
- **THEN** consumer MUST 通过 `requires` 声明该 capability id、version 和 `mode: optional`
- **AND** consumer contract 或 Skill 正文 MUST 说明该 dependency 缺失时的降级行为

#### Scenario: Required lifecycle 与 dependency mode 不混用
- **WHEN** Buildr 读取 Skill entry 的 `required` 和 `requires[].mode`
- **THEN** `required` MUST 只控制 builtin 资产是否可卸载
- **AND** `requires[].mode` MUST 只控制 consumer 在 provider 缺失时是否可用或降级

### Requirement: Provider 通过 scope binding 确定性解析
Buildr MUST 基于当前 workspace/Project scope、显式 binding、provider 唯一性、version 和 runtime 可用性确定 consumer 的 provider，并 MUST NOT 依赖安装顺序或描述文本猜测。

#### Scenario: 最近 scope 存在显式 binding
- **WHEN** consumer 的当前 scope 或祖先 scope 为 required capability 声明 binding
- **THEN** Buildr MUST 使用从当前 scope 向 workspace root 找到的最近 binding
- **AND** 被绑定 Skill MUST 在该 scope 可见、已启用、未卸载、version 兼容且适用于当前 runtime

#### Scenario: 没有 binding 且 scope 链只有一个 provider
- **WHEN** 当前 scope 链没有显式 binding
- **AND** 全部可见 scope 中恰好只有一个兼容且可用的 provider
- **THEN** Buildr MUST 自动选择该唯一 provider
- **AND** 该选择 MUST NOT 依赖 provider 的安装顺序

#### Scenario: Scope 链存在多个未绑定 providers
- **WHEN** 当前 scope 链存在多个兼容且可用的 providers
- **AND** 没有显式 binding
- **THEN** consumer readiness MUST 为 `blocked` 且 reason MUST 为 `ambiguous_provider`
- **AND** Buildr MUST 列出候选 providers 并要求显式 binding，不得选择更具体 scope、builtin、首个条目或最后安装项

#### Scenario: Project 安装 provider 但没有改 binding
- **WHEN** workspace 已有显式 provider binding
- **AND** Project 新增了兼容 provider 但没有声明更具体 binding
- **THEN** workspace binding MUST 继续生效
- **AND** provider installation MUST NOT 静默改变 Project 的专业流程

#### Scenario: Provider 版本不兼容
- **WHEN** 可见 provider 只声明了与 consumer 所需 version 不同的 contract version
- **THEN** consumer readiness MUST 为 `blocked` 且 reason MUST 为 `version_mismatch`
- **AND** diagnostics MUST 同时报告 required version 和候选 provider versions

#### Scenario: 用户卸载默认 builtin
- **WHEN** 默认 builtin provider 的 manifest state 为 `uninstalled` 或 enabled 为 false
- **THEN** Buildr MUST 将其排除在 provider resolution 之外
- **AND** Buildr MUST NOT 因 consumer 仍依赖该 capability 而静默恢复或使用该 builtin

#### Scenario: 用户 provider 使用自己的 Skill id
- **WHEN** workspace 或 Project Skill 以不同于 builtin 的 id 声明兼容 capability
- **THEN** Buildr MUST 允许该 Skill 被 binding 选为 provider
- **AND** 用户 MUST NOT 通过冒用 builtin id 或覆盖 builtin receipt 才能替换默认实现

#### Scenario: Selected provider 自身缺少 required dependency
- **WHEN** selected provider 的任一 required dependency readiness 为 `blocked`
- **THEN** provider MUST NOT 被上层 consumer 视为 ready
- **AND** 上层 consumer readiness MUST 为 `blocked` 且 reason MUST 为 `provider_not_ready`
- **AND** diagnostics MUST 保留 selected provider 与下游 root cause chain

#### Scenario: Capability dependency graph 存在环
- **WHEN** providers/consumers 的 required dependency graph 形成 cycle
- **THEN** cycle 中的 consumers MUST 为 `blocked` 且 reason MUST 为 `dependency_cycle`
- **AND** doctor MUST 报告完整 cycle path 和 breaking nextActions
- **AND** resolver MUST NOT 任意忽略一条 dependency edge

### Requirement: Required 和 optional dependency 产生不同运行状态
Buildr MUST 对 installed consumer 的 required 和 optional dependencies 应用不同的可用性、render 和 doctor 语义。

#### Scenario: Required provider 已解析
- **WHEN** consumer 的全部 required capabilities 都解析到兼容且 runtime 可用的 providers
- **THEN** consumer readiness MUST 为 `ready`
- **AND** runtime projection MUST 包含 consumer、所选 providers 和确定性 binding evidence

#### Scenario: Required provider 缺失或不可解析
- **WHEN** installed consumer 的 required dependency 缺少 provider、存在歧义、version 不兼容、binding 无效或 provider 无法投射到 runtime
- **THEN** consumer readiness MUST 为 `blocked` 并记录对应 reason
- **AND** Buildr MUST 继续投射 consumer 的诊断与安全停止指引，但受管 binding block MUST 禁止 Agent 执行 provider-dependent action
- **AND** doctor MUST 报告 error、reason、consumer、capability、候选 providers 和可执行 nextActions

#### Scenario: Optional provider 缺失
- **WHEN** consumer 的 optional dependency 没有解析到可用 provider
- **THEN** consumer readiness MUST 为 `degraded` 并继续按其声明的降级行为参与 runtime projection
- **AND** runtime binding evidence MUST 标明该 optional capability 未绑定
- **AND** doctor MUST NOT 把该缺失升级为阻塞 workspace 完成的 error

#### Scenario: Consumer 聚合 dependency readiness
- **WHEN** Buildr 汇总一个 consumer 的全部 dependencies
- **THEN** 任一 required dependency blocked 时 consumer MUST 为 `blocked`
- **AND** required dependencies 全部 ready 且至少一个 optional dependency 未 ready 时 consumer MUST 为 `degraded`
- **AND** 其余 consumer MUST 为 `ready`

#### Scenario: Consumer 本身已卸载
- **WHEN** consumer state 为 `uninstalled` 或 enabled 为 false
- **THEN** Buildr MUST NOT 因该 consumer 的 requires 声明报告 dependency error
- **AND** provider lifecycle MUST 保持独立

### Requirement: Runtime 投射包含 capability binding evidence
Buildr MUST 将解析后的 capability binding 作为受管 runtime 派生内容提供给 Agent，并 MUST 保持 workspace、Project 和外部 Skill 源正文不变。

#### Scenario: 投射已绑定 consumer
- **WHEN** Buildr 为 consumer 生成 runtime Skill
- **THEN** runtime Skill MUST 包含受管 capability binding block
- **AND** block MUST 记录 capability id、version、contract source path/digest、dependency mode、selected provider id、provider runtime path、provider scope、readiness 和 reason
- **AND** block MUST 要求 Agent 在执行 provider-dependent action 前读取已解析 contract 和 selected provider

#### Scenario: Provider 源保持不变
- **WHEN** Buildr 组合 capability binding block、Skill Contribution 或其他 runtime 派生内容
- **THEN** Buildr MUST NOT 把 binding 写回 consumer 或 provider 的源 `SKILL.md`
- **AND** runtime receipt/check MUST 能够说明 binding provenance

#### Scenario: Required consumer 从 ready 变为 blocked
- **WHEN** provider 卸载、binding 失效或 runtime compatibility 变化使 required consumer 不再 capability-ready
- **THEN** render MUST 更新可证明由 Buildr 管理的 consumer runtime 副本并注入 blocked evidence
- **AND** consumer MUST 继续提供安全停止、问题解释和修复路径
- **AND** Buildr MUST 继续投射不依赖该 capability 的其他 Skills

### Requirement: Skill 生命周期展示 capability 影响范围
Buildr MUST 在 mutation 会移除、禁用或改绑当前 selected provider 时于写入前计算 capability 影响，并 MUST 在 render、sync 和 doctor 中提供最终 readiness 与修复路径。

#### Scenario: 卸载 required dependency 的唯一 provider
- **WHEN** Agent 准备卸载某 capability 的唯一 compatible provider
- **THEN** Buildr MUST 在写入前列出将变为 blocked 的 installed consumers
- **AND** Buildr MUST NOT 自动卸载 consumers、恢复 builtin 或创建替代 binding

#### Scenario: 卸载 optional provider
- **WHEN** Agent 准备卸载 optional dependency 的唯一 provider
- **THEN** Buildr MUST 列出受影响 consumers 和各自声明的降级结果
- **AND** provider 卸载 MUST NOT 因 optional consumers 存在而被描述为失败

#### Scenario: Provider 变化后仍有唯一兼容实现
- **WHEN** provider removal 后不存在显式 binding 且同一 capability 在有效 scope 中只剩唯一 compatible provider
- **THEN** Buildr MUST 报告新的确定性 binding
- **AND** Buildr MUST 使用最终 doctor 验证 runtime projection 与 binding 一致

#### Scenario: Mutation 不影响 selected provider
- **WHEN** Agent add、restore、render 或 sync provider assets 且不会移除、禁用或改绑任何当前 selected provider
- **THEN** Buildr MUST NOT 机械要求完整 dependency impact preview
- **AND** 完成后 doctor MUST 仍验证最终 capability graph

#### Scenario: Doctor 输出 dependency graph findings
- **WHEN** Buildr doctor 检查 Skills 和 Agent runtime
- **THEN** findings MUST 使用 `ready`、`blocked` 和 `degraded` 表达 consumer readiness
- **AND** blocked/degraded finding MUST 使用 `missing_provider`、`ambiguous_provider`、`version_mismatch`、`runtime_unavailable`、`invalid_binding`、`provider_not_ready` 或 `dependency_cycle` 表达原因
- **AND** 每个非 ready finding MUST 包含 consumer、capability、scope、候选 providers 和 `nextActions`

### Requirement: Capability conformance 不伪装为行为证明
Buildr MUST 将用户 provider 的 `provides` 视为组织声明的 contract conformance，并 MUST NOT 仅凭名称、description 或正文相似性自动推断或证明兼容。

#### Scenario: 用户声明 provider conformance
- **WHEN** 用户 Skill manifest 显式声明提供某 capability version
- **THEN** Buildr MUST 校验声明结构、contract identity、scope 和 runtime availability
- **AND** Buildr MAY 使用组织提供的 tests、examples 或审查证据，但 MUST NOT 声称结构校验已经证明全部行为正确

#### Scenario: Ready 不代表行为或执行成功
- **WHEN** doctor 或 runtime projection 将 consumer 标记为 `ready`
- **THEN** Buildr MUST 只把它描述为结构上可路由
- **AND** Buildr MUST NOT 把 `ready` 描述为 provider behavior verified 或本次 execution succeeded
- **AND** 本次执行成功 MUST 由 contract 要求的计划/授权披露和 result evidence 判断

#### Scenario: Contract 只保留 consumer 必需保证
- **WHEN** contract 作者准备增加一个 normative requirement
- **THEN** 该 requirement MUST 对应 consumer 无法安全继续的具体依赖或失败模式
- **AND** provider command、algorithm、组织 policy、非必要 sequencing 和说明性案例 MUST 留在 provider、orchestrator 或非规范性 `Examples`

#### Scenario: Skill 只在 description 中声称相似能力
- **WHEN** Skill description 或正文提到与某 capability 相似的流程但 manifest 没有 `provides` 声明
- **THEN** Buildr MUST NOT 将该 Skill 当作 compatible provider
- **AND** Agent MUST NOT 依靠语义猜测绕过 required dependency diagnostics
