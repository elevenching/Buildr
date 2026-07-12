## ADDED Requirements

### Requirement: Buildr 管理命令行工具清单
Buildr MUST 支持在 workspace 中维护命令行工具清单，用于表达团队期望使用的外部命令行工具。

#### Scenario: 维护命令行工具清单
- **WHEN** 用户或 Agent 需要将某个外部命令行工具作为需要沉淀或复用的团队工作资产维护
- **THEN** Buildr MUST 使用 `commands/manifest.yml` 或等价 manifest 记录该命令行工具清单
- **AND** 该清单 MUST 至少能表达工具 id、可执行命令、用途和可选版本约束
- **AND** 该清单 MAY 表达最小安装提示或官方链接

#### Scenario: Buildr 不保存命令行工具主体
- **WHEN** Buildr 维护命令行工具清单
- **THEN** Buildr MUST NOT 将外部分发的命令行工具 binary、登录态、token、cookie 或个人私有配置保存为 workspace 资产

### Requirement: 命令行工具清单检查
Buildr MUST 提供命令行工具清单检查能力，用于判断当前本机环境是否满足 workspace 清单声明。

#### Scenario: 检查命令行工具存在性
- **WHEN** Agent 运行 `buildr commands check --target <dir> --json` 或等价检查入口
- **THEN** Buildr MUST 读取 `<dir>` 对应 workspace 的根级命令行工具清单
- **AND** Buildr MUST 报告每个声明的 executable 是否能在当前机器找到

#### Scenario: 检查命令行工具版本
- **WHEN** manifest 声明了版本约束
- **THEN** manifest MUST 同时声明结构化版本检查参数
- **AND** Buildr MUST 使用声明的 executable 和参数检查当前版本是否满足约束
- **AND** Buildr MUST NOT 执行 manifest 中的任意 shell 字符串

#### Scenario: 版本无法判断
- **WHEN** Buildr 无法从版本检查输出中解析版本
- **THEN** Buildr MUST 将该工具状态报告为 warning
- **AND** Buildr MUST NOT 将版本无法判断视为 manifest 源资产错误

#### Scenario: 输出安装提示
- **WHEN** 声明的命令行工具缺失或版本不满足约束
- **THEN** Buildr MUST 在 JSON 结果中输出 manifest 声明的最小安装提示或官方链接
- **AND** Buildr MUST NOT 自动安装该命令行工具

#### Scenario: 区分清单错误和本机差异
- **WHEN** 命令行工具清单不可解析、字段非法或版本约束格式非法
- **THEN** Buildr MUST 将该问题报告为 error
- **WHEN** 命令不存在、版本不满足或版本无法判断
- **THEN** Buildr MUST 将该问题报告为 warning

### Requirement: 命令行工具不执行 render 或 install
Buildr MUST NOT 为命令行工具清单提供 `commands render` 或 `commands install` 语义。

#### Scenario: Agent 维护命令行工具清单
- **WHEN** Agent 需要让当前机器满足命令行工具清单声明
- **THEN** Agent MUST 使用命令行工具清单检查结果向用户说明差异
- **AND** Agent MAY 在用户授权下协作安装或升级命令行工具
- **AND** Agent MUST NOT 期待 Buildr 将命令行工具 render 到 Agent runtime 或自动安装到本机

### Requirement: 命令行工具文档可选
Buildr MUST NOT 要求每个命令行工具清单项都拥有独立 `COMMAND.md`。

#### Scenario: 只维护 manifest
- **WHEN** workspace 只通过 manifest 声明命令行工具
- **THEN** Buildr MUST 将该声明视为有效资产源

#### Scenario: 团队需要补充说明
- **WHEN** manifest 引用了额外文档
- **THEN** Buildr MAY 检查该文档是否存在
- **AND** Buildr MUST NOT 将额外文档作为命令行工具清单项的必填项
