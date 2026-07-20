## ADDED Requirements

### Requirement: Package baseline 交付 Project Command requirements context
Buildr package MUST 为新 Project 交付空的 Command requirements baseline，并 MUST 保持 workspace catalog 与 Project references 分离。

#### Scenario: 初始化 Project template
- **WHEN** package Project template 被用于创建 Project
- **THEN** template MUST 创建 `commands.yml` with `buildr.project-commands/v1`
- **AND** requirements MUST 默认为空
- **AND** MUST NOT 复制 workspace Command definitions

#### Scenario: Package 验证 Commands 三层模型
- **WHEN** Agent 执行 package verification
- **THEN** verifier MUST 覆盖 catalog definition、Project requirement resolution 和 machine observation
- **AND** MUST 覆盖单 Project、跨 Project compatible、跨 Project conflict 和无 Project context
- **AND** MUST 证明 Buildr 不安装 binary 或保存凭证

#### Scenario: 旧 Project baseline 兼容
- **WHEN** package verifier 打开没有 `commands.yml` 的旧 Project fixture
- **THEN** Buildr MUST 将 requirements 解析为空集并给出可修复状态
- **AND** sync 或 migration MUST 能安全补齐空 baseline
