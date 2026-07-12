## MODIFIED Requirements

### Requirement: 产品 MVP 验证覆盖 manifest-backed 资产维护
Buildr 产品 MVP 验证 MUST 覆盖命令行工具和 Skills 源资产维护命令的主要用户路径。

#### Scenario: MVP 验证新增源资产
- **WHEN** Agent 运行产品 MVP 验证脚本
- **THEN** 验证脚本 MUST 覆盖 `commands add/remove`
- **AND** 验证脚本 MUST 覆盖 `skills add/remove`
- **AND** 验证脚本 MUST 覆盖 add/remove 后通过 check、doctor 或 render/check 继续确认状态的路径

#### Scenario: MVP 验证边界
- **WHEN** Agent 运行产品 MVP 验证脚本
- **THEN** 验证脚本 MUST 覆盖 add/remove 要求 target 已初始化
- **AND** 验证脚本 MUST 覆盖 add/remove 不提供 `--json`
- **AND** 验证脚本 MUST 覆盖 add/remove 不硬编码特定 Agent adapter 的下一步命令

#### Scenario: 临时 workspace 端到端验收
- **WHEN** Agent 运行产品 MVP 验证脚本
- **THEN** 验证脚本 MUST 从空临时目录初始化真实 Buildr workspace
- **AND** 验证脚本 MUST 按 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产覆盖主要 Agent 操作路径
- **AND** 验证脚本 MUST 在每类资产关键状态变更后使用 `doctor --json` 或对应专项检查确认状态

## ADDED Requirements

### Requirement: 产品级总验证入口
Buildr MUST 提供一个产品级总验证入口，用于统一执行产品包检查、临时 workspace 端到端验收和 OpenSpec strict 校验。

#### Scenario: 运行产品级总验证
- **WHEN** Agent 在产品仓执行产品级总验证入口
- **THEN** 验证 MUST 运行 `./buildr package check`
- **AND** 验证 MUST 运行临时 workspace 端到端验收
- **AND** 验证 MUST 运行 `openspec validate --all --strict`
- **AND** 任一底层检查失败时总验证 MUST 失败

#### Scenario: 产品仓规则引用统一入口
- **WHEN** 产品仓上下文规则说明验证方式
- **THEN** 规则 MUST 优先指向产品级总验证入口
- **AND** 规则 MAY 保留底层分解命令，便于 Agent 定位失败阶段
