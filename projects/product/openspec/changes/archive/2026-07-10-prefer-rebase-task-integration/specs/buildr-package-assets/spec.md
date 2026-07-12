## ADDED Requirements

### Requirement: 产品验证覆盖 Git Ops 集成契约
Buildr product verification MUST 防止随包 Git Ops Skill 回退到未定义或默认 merge 的任务集成策略。

#### Scenario: 校验线性集成语义
- **WHEN** Buildr 验证随包 Git Ops Skill
- **THEN** 验证 MUST 确认 Skill 声明本地未推送任务分支默认 rebase
- **AND** 验证 MUST 确认目标分支默认 fast-forward-only 集成
- **AND** 验证 MUST 确认没有用户明确要求时不得创建 merge commit

#### Scenario: 校验共享分支保护
- **WHEN** Buildr 验证随包 Git Ops Skill
- **THEN** 验证 MUST 确认已推送或共享任务分支不得自动 rebase 或 force push
- **AND** 验证 MUST 确认需要语义决策的 rebase 冲突必须停止并等待用户确认
