## MODIFIED Requirements

### Requirement: package source identity 不得成为公开资产 id
Buildr MUST 将 `package:<source-id>` 保留为 package manifest `skillSources` 与随包 Skill resolver 之间的内部 source reference，并 MUST NOT 将其作为用户创建的 Skill id、通用 source scheme 或 `skills add` 的公开参数格式推荐。

#### Scenario: Package baseline references bundled source
- **WHEN** Buildr package baseline 使用 `source: package:<source-id>` 引用已声明的 `skillSources`
- **THEN** Buildr MUST 按现有 package manifest 与 runtime 约束解析该引用
- **AND** `<source-id>` MUST 继续只标识随包 source，不改变 Skill 的用户可见 asset id

#### Scenario: Public Skill authoring guidance
- **WHEN** 用户查看 workspace Skill source、Project capability/applicability 或 user/workspace destination 的创建与安装说明
- **THEN** Buildr MUST 只推荐公开支持的 local path、remote source 或 resolved source 模型
- **AND** 说明 MUST NOT 引导用户手工构造 `package:<source-id>` 引用

### Requirement: Canonical 输出不得推荐 legacy 形式
Buildr MUST 只在兼容解析、迁移诊断或历史事实中接受和描述 legacy surface；主帮助、主题帮助、bootstrap canonical 示例、doctor repair command 和当前使用说明 MUST NOT 生成或推荐 legacy 参数、scope、Project Skill source 或数据布局。

#### Scenario: Legacy 输入仍被兼容
- **WHEN** 旧 workspace 或旧调用使用仍受支持的 legacy 参数、scope 或 Project Skill manifest
- **THEN** Buildr MUST 按对应 canonical spec 保留、迁移或兼容解析
- **AND** Buildr MUST 使用 `legacy Project Skill source` 等明确限定术语输出可操作的 warning、info 或迁移提示
- **AND** Buildr MUST NOT 静默把 legacy 形式重新定义为 canonical

#### Scenario: Unsupported layout is not compatibility surface
- **WHEN** 输入使用 canonical specs 已明确拒绝的 `organizations/<org>/` layout 或新的 Project Skill source scope
- **THEN** Buildr MUST 继续拒绝该输入
- **AND** 产品分类 MUST NOT 将它描述为受支持的 current source surface

#### Scenario: Canonical Skill 帮助使用新模型
- **WHEN** 用户查看 Skills add/remove/render、Project capability 或 runtime destination 帮助
- **THEN** 输出 MUST 将 workspace 说明为唯一 source authority
- **AND** MUST 将 Project 说明为 capability/applicability context
- **AND** MUST 将 user/workspace 说明为 runtime destinations
