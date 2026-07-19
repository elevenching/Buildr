## ADDED Requirements

### Requirement: Runtime plan 表达完整 Skill 文件 identity
Buildr runtime plan MUST 对完整 Skill 投射中的每个文件表达可验证的目标路径、内容编码、内容 identity 和必要权限，并 MUST 让 render、sync、runtime check、doctor 与 Component lifecycle 使用同一预期状态。

#### Scenario: 计划文本与二进制 Skill 文件
- **WHEN** Skill 源目录同时包含文本和二进制随附文件
- **THEN** runtime plan MUST 以确定性、可验证且可序列化的形式表达每个文件的原始字节
- **AND** reconcile MUST 按字节而不是 UTF-8 文本转换结果比较和写入这些文件

#### Scenario: 校验完整 Skill write item
- **WHEN** runtime plan 包含 Skill 文件的 encoding、内容或 mode 无效，或多个来源写入同一目标但 identity 不同
- **THEN** plan validation MUST 在写入前失败并报告具体目标
- **AND** runtime MUST NOT 产生部分 Skill 目录

#### Scenario: 所有 adapter 复用相同 Skill inventory
- **WHEN** 两个 supported adapters 使用 filesystem Skills primitive 渲染相同 Skill
- **THEN** 两个 adapter MUST 投射相同的 Skill 相对文件集合和内容 identity
- **AND** 每个 adapter MUST 继续使用自身声明的 runtime root、diagnostic identity 和 activation metadata

### Requirement: Runtime Skill 投射使用受管文件回执
Buildr MUST 为每个已投射的本地或 package runtime Skill 维护独立、可验证的受管文件回执，并 MUST 使用该回执区分 Buildr 投射文件与用户额外内容。

#### Scenario: 首次完整投射生成回执
- **WHEN** Buildr 成功投射一个本地或 package Skill
- **THEN** Buildr MUST 在对应 adapter 的 Buildr runtime metadata 区域写入该 Skill 的版本化投射回执
- **AND** 回执 MUST 记录 runtime path、source identity、受管相对文件、内容完整性和可执行状态

#### Scenario: 源 Skill 删除单个随附文件
- **WHEN** 上次回执登记了某个随附文件、当前源 Skill 已删除该文件且 runtime 文件仍匹配上次完整性
- **THEN** 下一次相同范围 render、sync 或 reconcile MUST 删除该 stale runtime 文件
- **AND** Buildr MUST 更新回执并保持其余 Skill 文件不变

#### Scenario: 用户修改受管随附文件
- **WHEN** runtime 随附文件不再匹配上次回执，且当前计划需要覆盖或删除它
- **THEN** Buildr MUST 在写入任何计划目标前报告 conflict
- **AND** Buildr MUST 保留用户修改内容和旧回执供后续处理

#### Scenario: Runtime Skill 包含未知额外文件
- **WHEN** runtime Skill 目录包含不在上次回执和当前 source inventory 中的文件
- **THEN** Buildr MUST 将该文件视为非 Buildr 管理内容并保留
- **AND** 当当前操作需要删除整个 Skill 时，Buildr MUST 报告需要用户处理而不是递归删除目录

#### Scenario: Skill 失去来源
- **WHEN** manifest 不再声明某个 runtime Skill，且其回执中的全部文件仍匹配、目录中也没有未知内容
- **THEN** 下一次 workspace 全量 render MUST 删除该 Skill 的受管文件、空目录和回执
- **AND** runtime check 与 doctor MUST 在 apply 前把相同状态报告为 orphan

#### Scenario: 回执缺失时保守降级
- **WHEN** runtime Skill 带有 Buildr-managed `SKILL.md` 但没有完整目录投射回执
- **THEN** Buildr MAY 继续兼容只含 `SKILL.md` 的旧运行时清理
- **AND** Buildr MUST NOT 删除无法证明由 Buildr 管理的其他文件

### Requirement: 完整 Skill 投射保持统一 preflight 与幂等性
Buildr MUST 在应用完整 Skill 目录计划前聚合所有文件冲突，并 MUST 在源资产、target、adapter 和 scope 不变时产生幂等结果。

#### Scenario: 任一随附目标发生冲突
- **WHEN** 完整 Skill 计划中的任一 `SKILL.md`、随附文件或回执目标存在不可安全覆盖的内容
- **THEN** Buildr MUST 在写入第一个计划文件前失败并列出全部已发现冲突
- **AND** 其他无冲突 Skill 也 MUST NOT 被部分更新

#### Scenario: 重复完整 Skill render
- **WHEN** 用户在源 Skill 目录、manifest、adapter、scope 和 runtime 目标均未变化时连续执行两次 render
- **THEN** 第二次执行 MUST 不新增、更新、chmod 或删除任何 Skill 文件或回执
- **AND** runtime check MUST 报告 Skill 文件集合与回执均为最新状态
