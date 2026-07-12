## MODIFIED Requirements

### Requirement: 已有 OpenSpec Builtins 迁移为 Component
Buildr update MUST 安全识别旧 workspace 中独立管理或由 Buildr fork 管理的 OpenSpec workflow Skills，并迁移为外部上游 Skill 与 Buildr sidebar 分离的 Component。

#### Scenario: 原位采用一致的外部 OpenSpec Skills
- **WHEN** 旧 workspace 中全部预期 OpenSpec Skills 已以外部来源安装，且内容匹配当前 resolved package source
- **THEN** Buildr MUST 创建或更新 OpenSpec Component registry entry 和 installed definition
- **AND** Buildr MUST 创建 OpenSpec Command collection 和 Buildr sidebar members
- **AND** Buildr MUST 保留外部 Skill 源内容，并在 runtime reconcile 时组合 sidebar

#### Scenario: 迁移一致的 Buildr OpenSpec fork
- **WHEN** 旧 workspace 的 `skills/buildr/openspec-*` 内容完整匹配已知旧 package receipt，且目标外部 Skill 路径无冲突
- **THEN** Buildr MUST 在一个 source transaction 中删除旧 fork、物化外部上游 Skills、更新 manifests 和 Component definition
- **AND** runtime reconcile MUST 从新的外部源和 sidebar contributions 生成等价或更新后的派生 Skills
- **AND** 成功后 workspace MUST 不再包含 `skills/buildr/openspec-*` workflow fork

#### Scenario: 旧 OpenSpec Skills 状态不一致
- **WHEN** 任一旧 fork 或外部 Skill 为 modified、missing、uninstalled，或存在来源、路径、version、integrity 冲突
- **THEN** Buildr MUST 停止 OpenSpec Component 迁移
- **AND** Buildr MUST 保留全部旧状态
- **AND** Buildr MUST 输出集合级用户决策信息
