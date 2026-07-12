## MODIFIED Requirements

### Requirement: doctor 聚合命令行工具清单状态
Buildr doctor MUST 聚合全部 Commands collections 的检查结果，并以 Agent-readable JSON 输出当前本机环境与 workspace 声明的对齐状态。

#### Scenario: doctor 检查命令行工具集合
- **WHEN** Agent 运行 `buildr doctor --target <dir> --json`
- **THEN** doctor MUST 包含根 `commands/manifest.yml` 和安全递归发现的 `commands/**/manifest.yml` 检查结果
- **AND** 结果 MUST 标识每个 manifest 是否有效、每个声明的来源，以及 executable 是否可用

#### Scenario: doctor 输出警示和修复提示
- **WHEN** 某个命令行工具缺失、版本不满足或版本无法判断
- **THEN** doctor MUST 输出 warning 状态和可供 Agent 使用的差异说明
- **AND** 修复提示 MUST 来源于对应 Command collection 声明的最小安装提示或官方链接
- **AND** doctor MUST NOT 因本机命令行工具差异使工作区诊断整体失败

#### Scenario: doctor 报告清单或集合冲突错误
- **WHEN** 任一 Command collection manifest 不可解析、字段非法、版本约束格式非法，或相同 Command id 的有效声明冲突
- **THEN** doctor MUST 将该问题报告为 error
- **AND** doctor MUST 输出全部冲突来源 manifest

#### Scenario: doctor 不检查个人认证
- **WHEN** doctor 检查命令行工具集合状态
- **THEN** doctor MUST NOT 读取或报告 token、cookie、登录态或个人私有配置

## ADDED Requirements

### Requirement: Doctor 聚合 Component 状态
Buildr doctor MUST 诊断 workspace Component registry、已安装定义、成员完整性、ownership 和当前 Agent runtime 对齐状态。

#### Scenario: Component registry 缺失或非法
- **WHEN** 已初始化 workspace 缺少 `components/manifest.yml` 或 schema 非法
- **THEN** doctor MUST 报告 error 或可迁移 warning
- **AND** doctor MUST 提供 update 或修复 registry 的下一步

#### Scenario: Component 成员完整
- **WHEN** enabled Component 定义有效、全部成员匹配 integrity 且没有 ownership conflict
- **THEN** doctor MUST 将 Component 报告为 installed
- **AND** doctor JSON MUST 列出 Component version、source 和成员摘要

#### Scenario: Component 修改或缺失
- **WHEN** enabled Component 的成员内容不同于 installed definition 或成员缺失
- **THEN** doctor MUST 报告 modified 或 missing 状态
- **AND** doctor MUST 标识具体成员、预期 integrity、实际差异和安全下一步

#### Scenario: Component 已卸载
- **WHEN** Component registry entry 为 disabled 且 uninstalled
- **THEN** doctor 默认 MUST NOT 将其报告为 warning
- **AND** `--include-info` 时 doctor MUST 输出该显式状态和可用的 install 动作

#### Scenario: Component runtime 过期
- **WHEN** Component 源资产已更新或卸载但指定 Agent runtime 仍缺失、过期或残留成员投射
- **THEN** doctor MUST 报告 runtime warning
- **AND** doctor MUST 提供对应 adapter 的 reconcile 动作

