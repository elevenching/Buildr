## ADDED Requirements

### Requirement: Buildr 必须持久化独立 Builtin 安装回执
Buildr MUST 为不属于 Component 的内置 Rule、Skill 和 Command 持久化可验证的安装回执，并将回执视为 Buildr 管理的 workspace source metadata。

#### Scenario: 安装或还原 Builtin
- **WHEN** Buildr 安装、升级或显式还原独立 Builtin
- **THEN** Buildr MUST 记录类型、id、目标、精确 inventory 和 SHA-256 完整性
- **AND** 回执 MUST 稳定排序且不能包含 workspace 外路径

#### Scenario: 显式卸载 optional Builtin
- **WHEN** Agent 显式卸载 optional Builtin
- **THEN** Buildr MUST 保留 manifest 中的 `uninstalled` 状态
- **AND** Buildr MUST 删除该 Builtin 的安装回执

### Requirement: Builtin 状态必须使用 Old Live New 三方比较
Buildr MUST 使用安装回执 Old、workspace 实际状态 Live 和当前 package 状态 New 判断独立 Builtin 是否可自动收敛。

#### Scenario: 官方旧版本未被修改
- **WHEN** Live 精确匹配 Old 且 New 不同于 Old
- **THEN** sync MUST 自动将 Builtin 升级到 New
- **AND** sync MUST 更新安装回执而不要求用户确认

#### Scenario: Live 已经等于当前 package
- **WHEN** Live 精确匹配 New
- **THEN** Buildr MUST 将状态判为 `installed`
- **AND** sync MUST 幂等采用或修复当前回执

#### Scenario: 用户修改 Builtin
- **WHEN** Live 不匹配 Old，且也不匹配 New
- **THEN** optional Builtin MUST 被判为 `modified` 或 `missing`
- **AND** sync MUST NOT 静默覆盖 Live

#### Scenario: Skill 目录包含额外文件
- **WHEN** Skill live 目录比 Old inventory 多出任意文件
- **THEN** Buildr MUST 将其视为用户修改
- **AND** sync MUST NOT 在没有显式 restore 时删除该文件

### Requirement: 无回执 workspace 必须保守迁移
Buildr MUST 只在 package 能证明 Live 是当前或已知旧版官方资产时，为无安装回执的 workspace 自动采用回执。

#### Scenario: Live 匹配当前 package
- **WHEN** workspace 没有该 Builtin 回执且 Live 精确匹配 New
- **THEN** sync MUST 只采用 New 回执并保持资产内容不变

#### Scenario: Live 匹配已知 legacy integrity
- **WHEN** workspace 没有该 Builtin 回执且 Live 匹配 package 声明的该 Builtin legacy integrity
- **THEN** sync MUST 自动升级到 New 并写入当前回执

#### Scenario: Live 来源无法证明
- **WHEN** workspace 没有有效回执且 Live 既不匹配 New 也不匹配已知 legacy integrity
- **THEN** Buildr MUST fail closed
- **AND** optional Builtin MUST 保持 live 内容不变并报告用户决策点

### Requirement: Builtin 回执必须可诊断
Buildr doctor 和 `builtin list --json` MUST 使用同一回执校验逻辑报告独立 Builtin 状态。

#### Scenario: 回执损坏或身份冲突
- **WHEN** 回执 schema 无效、路径越界、条目重复或类型与 package 身份冲突
- **THEN** doctor MUST 报告可定位的 finding
- **AND** 后续 source mutation MUST fail closed
