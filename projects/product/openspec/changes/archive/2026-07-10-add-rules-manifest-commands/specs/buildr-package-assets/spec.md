## MODIFIED Requirements

### Requirement: package check 覆盖 manifest-backed 资产维护命令
Buildr package check MUST 验证 manifest-backed 资产维护命令不会破坏默认 workspace baseline、manifest 标准格式或 runtime 投射边界。

#### Scenario: 验证命令行工具 add/remove
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 验证 `commands add/remove` 可以在已初始化临时 workspace 中维护 `commands/manifest.yml`
- **AND** Buildr MUST 验证写回后的命令行工具条目使用 `installHint` 而不是 `install`
- **AND** Buildr MUST 验证 `commands add/remove` 不会自动安装命令行工具或写入 Agent runtime

#### Scenario: 验证 Skills add/remove
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 验证 `skills add/remove` 可以在已初始化临时 workspace 中维护 workspace 或 project scope 的 `skills/manifest.yml`
- **AND** Buildr MUST 验证 `skills add --source` 装载的是完整 Skill 源目录
- **AND** Buildr MUST 验证 `skills add/remove` 不会自动写入 Agent runtime

#### Scenario: 验证 Rules add/remove
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 验证 `rules add/remove` 可以在已初始化临时 workspace 中维护 root `rules/manifest.yml`
- **AND** Buildr MUST 验证 `rules add` 要求非空 description
- **AND** Buildr MUST 验证 `rules add` 未传 `--path` 时默认注册 `rules/<id>.md`
- **AND** Buildr MUST 验证 `rules add` 只能注册已存在的 root Rule 文件
- **AND** Buildr MUST 验证 `rules remove` 默认删除 Rule 源文件和 manifest entry
- **AND** Buildr MUST 验证 `rules remove --keep-file` 保留 Rule 源文件、只移除 manifest entry，并可由 doctor 报告为未登记文件
- **AND** Buildr MUST 验证 `rules add/remove` 不会自动写入 Agent runtime
- **AND** Buildr MUST 验证 required Buildr Rule 不能通过 `rules remove` 删除

### Requirement: 产品 MVP 验证覆盖 manifest-backed 资产维护
Buildr 产品 MVP 验证 MUST 覆盖命令行工具、Rules 和 Skills 源资产维护命令的主要用户路径。

#### Scenario: MVP 验证新增源资产
- **WHEN** Agent 运行产品 MVP 验证脚本
- **THEN** 验证脚本 MUST 覆盖 `commands add/remove`
- **AND** 验证脚本 MUST 覆盖 `rules add/remove`
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
