## MODIFIED Requirements

### Requirement: doctor 检查 Git 忽略和 runtime 状态
Buildr MVP MUST 诊断 workspace Git 忽略关系和 Agent runtime 投射状态。

#### Scenario: 嵌套 repo 未被忽略
- **WHEN** service repo 嵌套在 workspace 中但未被 workspace `.gitignore` 忽略
- **THEN** `doctor` MUST 报告该风险并建议更新忽略规则

#### Scenario: runtime bridge stale
- **WHEN** Agent runtime 桥接文件存在但已过期或不是 Buildr 管理产物
- **THEN** `doctor` MUST 报告 runtime 状态并建议重新 render 或迁移资产源

#### Scenario: reference bridge metadata stale
- **WHEN** Agent runtime reference bridge 可正常读取规则但只有 hash 元数据过期
- **THEN** `doctor` 默认输出 MUST NOT 将该状态报告为 warning 或 next step
- **AND** `doctor --verbose` MAY 在文本输出中展示该 info
- **AND** `doctor --json --include-info` MUST 在 JSON 中输出该 info
- **AND** 该 info MUST 标记 `userActionRequired` 为 false
