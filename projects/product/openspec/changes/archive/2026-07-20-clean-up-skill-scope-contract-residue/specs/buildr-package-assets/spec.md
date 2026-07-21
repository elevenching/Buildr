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
- **THEN** Buildr MUST 验证 `skills add/remove` 只维护已初始化临时 workspace 根的 `skills/manifest.yml`
- **AND** Buildr MUST 验证 Project source scope 被拒绝并返回 legacy migration guidance
- **AND** Buildr MUST 验证 `skills add --source` 装载的是完整 Skill 源目录
- **AND** Buildr MUST 验证 `skills add/remove` 不会自动写入 user 或 workspace runtime destination

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
