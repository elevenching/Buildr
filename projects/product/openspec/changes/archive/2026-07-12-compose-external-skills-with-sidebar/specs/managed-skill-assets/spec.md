## ADDED Requirements

### Requirement: 已解析外部 Skill 保持上游源资产身份
Buildr MUST 将随包或 workspace Component 使用的已解析外部 Skill 物化为可验证的上游源资产，并将任何 Buildr 增强限制在 Agent runtime 派生阶段。

#### Scenario: 物化已解析外部 Skill
- **WHEN** enabled Component 声明一个具有 source、resolved source、version 和 integrity 的外部 Skill
- **THEN** Buildr MUST 将其物化到非 `skills/buildr/` 的来源命名空间
- **AND** 物化内容 MUST 匹配 resolved source 的版本和 integrity
- **AND** Buildr MUST NOT 将包含 sidebar 修改的副本登记为该外部 Skill 的源资产

#### Scenario: 渲染外部 Skill 派生版本
- **WHEN** 外部 Skill 与 enabled sidebar contribution 一起参与 Agent runtime render
- **THEN** runtime Skill MUST 由已验证上游内容和已验证 contributions 确定性组合
- **AND** runtime receipt/check MUST 追踪上游来源与每个 contribution provenance
- **AND** workspace 外部 Skill 的源内容 MUST 保持不变

#### Scenario: 外部 Skill 上游更新
- **WHEN** resolved source、version 或 integrity 更新
- **THEN** Buildr MUST 先验证新的上游内容和 sidebar 兼容性
- **AND** 验证通过后 MUST 以新上游内容重新生成 runtime 派生版本
- **AND** Buildr sidebar 内容 MUST 从独立的 Buildr-owned members 继续组合，不得人工合并回外部源正文
