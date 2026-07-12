## ADDED Requirements

### Requirement: 命令行工具清单维护命令
Buildr MUST 提供命令行工具清单条目的 add/remove 维护命令，用于在已初始化 workspace 中维护 root 级 `commands/manifest.yml`。

#### Scenario: 添加命令行工具条目
- **WHEN** Agent 运行 `buildr commands add <id> --purpose <text> --target <dir>`
- **THEN** Buildr MUST 要求 `<dir>` 是已初始化 Buildr workspace
- **AND** Buildr MUST 在 `<dir>/commands/manifest.yml` 中新增对应 `id` 的条目
- **AND** 当未提供 executable 时 Buildr MUST 使用 `<id>` 作为 executable
- **AND** Buildr MUST 保留 manifest 中已有条目的顺序，并将新条目追加到末尾

#### Scenario: 替换命令行工具条目
- **WHEN** Agent 运行 `buildr commands add <id> ... --replace`
- **AND** `commands/manifest.yml` 中已存在同 `id` 条目
- **THEN** Buildr MUST 使用本次命令声明的完整条目替换旧条目
- **AND** Buildr MUST 保留旧条目在 manifest 中的位置
- **AND** Buildr MUST NOT 执行局部字段 update

#### Scenario: 重复添加命令行工具条目
- **WHEN** Agent 运行 `buildr commands add <id> ...`
- **AND** `commands/manifest.yml` 中已存在同 `id` 条目
- **AND** 命令未提供 `--replace`
- **THEN** Buildr MUST 报告错误

#### Scenario: 删除命令行工具条目
- **WHEN** Agent 运行 `buildr commands remove <id> --target <dir>`
- **THEN** Buildr MUST 从 `<dir>/commands/manifest.yml` 删除对应 `id` 的条目
- **AND** Buildr MUST NOT 删除任何命令行工具文档、binary、认证信息或本机配置
- **AND** 当删除后清单为空时 Buildr MUST 保留空的 `commands: []`

#### Scenario: 输出下一步行为
- **WHEN** Buildr 完成 `commands add` 或 `commands remove`
- **THEN** Buildr MUST 输出中文 Agent-readable 回执
- **AND** 回执 MUST 说明已更新的源资产
- **AND** 回执 MUST 引导 Agent 运行命令行工具清单检查或 doctor 查看状态
- **AND** 回执 MUST NOT 硬编码特定 Agent adapter 命令

## MODIFIED Requirements

### Requirement: Buildr 管理命令行工具清单
Buildr MUST 支持在 workspace 中维护命令行工具清单，用于表达团队期望使用的外部命令行工具。

#### Scenario: 维护命令行工具清单
- **WHEN** 用户或 Agent 需要将某个外部命令行工具作为需要沉淀或复用的团队工作资产维护
- **THEN** Buildr MUST 使用 `commands/manifest.yml` 记录该命令行工具清单
- **AND** 该清单 MUST 至少能表达工具 id、可执行命令、用途和可选版本约束
- **AND** 该清单 MAY 表达工具名称、补充描述和最小安装提示

#### Scenario: 命令行工具 manifest 字段
- **WHEN** Buildr 读取或写入 `commands/manifest.yml`
- **THEN** 命令行工具条目 MUST 使用 `id`、`executable`、`purpose`、可选 `name`、可选 `description`、可选 `version` 和可选 `installHint`
- **AND** Buildr MUST NOT 将 `install` 作为合法字段

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
- **THEN** Buildr MUST 在 JSON 结果中输出 manifest 声明的 `installHint`
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

#### Scenario: 维护命令不触发检查或安装
- **WHEN** Agent 运行 `buildr commands add` 或 `buildr commands remove`
- **THEN** Buildr MUST 只维护 `commands/manifest.yml`
- **AND** Buildr MUST NOT 自动运行 `commands check`
- **AND** Buildr MUST NOT 自动安装或升级命令行工具

## REMOVED Requirements

### Requirement: 命令行工具文档可选
**Reason**: 命令行工具资产模型收敛为单一 manifest 表达；补充背景使用 manifest item 的 `description` 字段，安装提示使用 `installHint` 字段。
**Migration**: 不再定义 `COMMAND.md`、`commands/<id>.md` 或 `commands/<id>/` 作为命令行工具资产结构；如已有背景说明，应迁移到 `commands/manifest.yml` 对应条目的 `description`。

