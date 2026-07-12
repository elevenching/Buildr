## ADDED Requirements

### Requirement: package baseline 支持命令行工具清单入口
Buildr package baseline MUST 支持默认 workspace 中的命令行工具清单入口。

#### Scenario: 初始化命令行工具清单入口
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 在 workspace 中创建命令行工具清单入口
- **AND** 该入口 MUST 能承载 `commands/manifest.yml` 或等价 manifest

#### Scenario: 默认命令行工具清单为空
- **WHEN** Buildr 当前没有随包提供默认外部命令行工具声明
- **THEN** `buildr init` MUST 初始化空的命令行工具清单
- **AND** 默认清单 MUST NOT 声明 Buildr 自身为工作区命令行工具资产

#### Scenario: package check 校验命令行工具清单入口
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 package manifest 声明的命令行工具清单入口可以被初始化到临时 workspace
- **AND** Buildr MUST 校验默认命令行工具 manifest 不包含私有路径、私有组织名或个人机器状态
