## ADDED Requirements

### Requirement: Commands CLI 显式表达 task context
Buildr CLI MUST 让 Commands catalog 维护与 Project requirement/machine check context 在帮助、参数和 JSON 中可区分。

#### Scenario: Commands help
- **WHEN** 用户查看根帮助或 Commands 主题帮助
- **THEN** CLI MUST 将 `commands add/remove` 描述为 workspace catalog 维护
- **AND** MUST 将 Project requirement 维护描述为引用管理
- **AND** MUST 将 `commands check --project <id>` 描述为 context-aware machine check

#### Scenario: Commands check JSON
- **WHEN** Agent 请求 Commands JSON 输出
- **THEN** JSON MUST 分离 `catalog`、`requirements`、`effectiveConstraints`、`observations` 和 `findings`
- **AND** 每项 MUST 提供稳定 ID、provenance 和 reason code

#### Scenario: 无效 Project context
- **WHEN** 用户提供未登记、重复或不安全的 Project id
- **THEN** CLI MUST 在执行 version probe 前失败
- **AND** MUST 输出可操作诊断且不得修改任何 source 或 machine state

#### Scenario: Legacy version constraint guidance
- **WHEN** CLI 读取把 requirement version constraint 保存在旧 catalog definition 的兼容输入
- **THEN** canonical 输出 MUST 说明其 workspace default requirement 语义或迁移路径
- **AND** MUST NOT 将其静默复制到每个 Project
