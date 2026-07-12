## MODIFIED Requirements

### Requirement: doctor 提供 Agent-readable 诊断
Buildr MVP MUST 支持 `buildr doctor --json` 输出 Agent-readable 的结构化诊断结果。

#### Scenario: Agent 请求结构化诊断
- **WHEN** Agent 调用 `buildr doctor --json`
- **THEN** Buildr MUST 输出可被 Agent 稳定解析的 JSON 诊断结果

#### Scenario: 人类查看诊断
- **WHEN** 用户直接调用 `buildr doctor`
- **THEN** Buildr MAY 输出人类可读诊断文本

#### Scenario: Agent 默认事实入口
- **WHEN** Agent 需要判断 Buildr workspace、源资产或 Agent runtime 的当前状态
- **THEN** 面向 Agent 的引导 MUST 将 `buildr doctor --json` 作为默认结构化事实入口
- **AND** doctor 输出 MUST 提供足够的下一步上下文，帮助 Agent 判断应编辑源资产、运行 render，还是使用专项检查

#### Scenario: 专项检查作为后续诊断
- **WHEN** doctor 输出识别出 runtime adapter、render、命令清单或其他需要深入检查的专项问题
- **THEN** 面向 Agent 的引导 MAY 指向对应的专项检查命令
- **AND** 专项检查命令 MUST NOT 取代 `doctor --json` 在 Buildr Skill 或 bootstrap 引导中的默认入口地位

### Requirement: doctor 检查 Git 忽略和 runtime 状态
Buildr MVP MUST 诊断 workspace Git 忽略关系和 Agent runtime 投射状态。

#### Scenario: 嵌套 repo 未被忽略
- **WHEN** service repo 嵌套在 workspace 中但未被 workspace `.gitignore` 忽略
- **THEN** `doctor` MUST 报告该风险并建议更新忽略规则

#### Scenario: runtime bridge stale
- **WHEN** Agent runtime 桥接文件存在但已过期或不是 Buildr 管理产物
- **THEN** `doctor` MUST 报告 runtime 状态并建议重新 render 或迁移资产源

#### Scenario: runtime 状态用于默认引导
- **WHEN** Agent 需要判断规则、Skills 或产品内置 Skill 是否已经投射到当前 Agent runtime
- **THEN** `doctor --json` MUST 暴露适合面向 Agent 引导使用的 runtime 状态和修复建议
- **AND** 专项 runtime check MAY 在 doctor 报告问题后提供 adapter 细节
