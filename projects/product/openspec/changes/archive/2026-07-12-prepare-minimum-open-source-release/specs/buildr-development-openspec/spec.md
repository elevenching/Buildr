## ADDED Requirements

### Requirement: Buildr 产品验证完成报告必须呈现耗时
Buildr 产品任务在最终候选完整验证后 MUST 向维护者汇报 timing summary 的总耗时、最慢阶段、失败阶段（如有）和文件路径，并 MUST 将该约定限制在 Product Project 而非通用 Buildr workspace Skill。

#### Scenario: 最终候选验证成功
- **WHEN** Agent 完成 Buildr 产品最终候选验证
- **THEN** Agent MUST 汇报总耗时、最慢阶段及 timing summary 路径
- **AND** Agent MUST NOT 仅因耗时高于此前运行而报告验证失败

#### Scenario: 最终候选验证失败
- **WHEN** 产品完整验证在某阶段失败
- **THEN** Agent MUST 汇报失败阶段、已记录总耗时和 timing summary 路径
- **AND** Agent MUST 按产品验证恢复流程继续修复而非隐藏失败

### Requirement: Buildr 公开文档本地化必须保持单一范围
Buildr MUST 为根 README 提供中文主文档和英文翻译，但 MUST NOT 要求其他产品、开发、OpenSpec 或治理文档为了最小开源而复制双语版本。

#### Scenario: 维护公开文档
- **WHEN** 维护者更新最小开源文档
- **THEN** `README.md` 与 `README.en.md` MUST 保持产品入口语义对齐
- **AND** 其他文档 MUST 按当前 Project 管理语言维护
