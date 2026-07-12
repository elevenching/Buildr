## ADDED Requirements

### Requirement: doctor 聚合命令行工具清单状态
Buildr doctor MUST 聚合命令行工具清单检查结果，并以 Agent-readable JSON 输出当前本机环境与 workspace 清单声明的对齐状态。

#### Scenario: doctor 检查命令行工具清单
- **WHEN** Agent 运行 `buildr doctor --target <dir> --json`
- **THEN** doctor MUST 包含命令行工具清单检查结果
- **AND** 结果 MUST 标识命令行工具 manifest 是否存在、是否有效，以及声明的 executable 是否可用

#### Scenario: doctor 输出警示和修复提示
- **WHEN** 某个命令行工具缺失、版本不满足或版本无法判断
- **THEN** doctor MUST 输出 warning 状态和可供 Agent 使用的差异说明
- **AND** 修复提示 MUST 来源于命令行工具 manifest 中声明的最小安装提示或官方链接
- **AND** doctor MUST NOT 因本机命令行工具差异使工作区诊断整体失败

#### Scenario: doctor 报告清单错误
- **WHEN** 命令行工具 manifest 不可解析、字段非法或版本约束格式非法
- **THEN** doctor MUST 将该问题报告为 error

#### Scenario: doctor 不检查个人认证
- **WHEN** doctor 检查命令行工具清单状态
- **THEN** doctor MUST NOT 读取或报告 token、cookie、登录态或个人私有配置
