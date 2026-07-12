## ADDED Requirements

### Requirement: Workspace Git 忽略 mutation 临时状态
Buildr MUST 确保 workspace source mutation 的锁、journal、staging 和 backup 不进入用户 workspace 的 Git 变更视图，同时保留持久 workspace metadata 的版本管理能力。

#### Scenario: 初始化 workspace
- **WHEN** Buildr 初始化 Git 管理的 workspace
- **THEN** root `.gitignore` MUST 包含 `/.buildr/mutations/`
- **AND** Buildr MUST NOT 因此忽略整个 `/.buildr/` 或 `/.buildr/workspace.yml`

#### Scenario: 更新旧 workspace
- **WHEN** `update` 或 `sync` 处理缺少 mutation ignore 条目的旧 workspace
- **THEN** Buildr MUST 通过受管 source transaction 幂等补齐 `/.buildr/mutations/`
- **AND** 重复执行 MUST NOT 产生重复条目或无关 `.gitignore` 改写

#### Scenario: Mutation 异常残留
- **WHEN** source mutation 异常退出并保留 lock、journal、staging 或 backup
- **THEN** doctor MUST 继续报告 transaction finding 并阻止后续 mutation
- **AND** Git MUST 将 `.buildr/mutations/` 下的残留视为 ignored，而不是待提交 workspace 资产
