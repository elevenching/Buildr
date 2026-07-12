## ADDED Requirements

### Requirement: Buildr update 同步随包 Components
Buildr update MUST 将当前 package 声明的 workspace Components 按 registry 期望状态和三方比较结果同步到已有 workspace。

#### Scenario: 更新已启用 Component
- **WHEN** Agent 运行 `buildr update --target <dir>`
- **AND** Buildr-managed Component 为 enabled 且实际成员未被用户修改
- **THEN** Buildr MUST 按当前 package 定义更新 Component 和全部成员源资产
- **AND** update MUST NOT 直接渲染 Agent runtime

#### Scenario: 不恢复已卸载 Component
- **WHEN** Component registry 将 optional Buildr-managed Component 标记为 uninstalled
- **THEN** Buildr update MUST 保留该状态
- **AND** Buildr MUST NOT 因 package 新增或更新成员而重新安装它

#### Scenario: Component 修改阻塞 update
- **WHEN** 已启用 Component 的实际成员不同于已安装 definition
- **THEN** Buildr update MUST 停止该 Component 的更新
- **AND** Buildr MUST 输出成员差异和用户可选择的恢复或迁移动作

### Requirement: Sync 聚合 Component 与 runtime 状态
Buildr sync MUST 在产品能力更新阶段处理 workspace Components，并在没有待决冲突时将其有效 Rules 和 Skills 投射到指定 Agent runtime。

#### Scenario: 同步启用 Component
- **WHEN** Agent 运行 `buildr sync <agent> --target <dir>`
- **THEN** Buildr MUST 先完成 Component update/check
- **AND** Buildr MUST 将启用 Component 的有效 Skills 和 Rules 纳入指定 adapter 的 runtime reconcile
- **AND** Buildr MUST 在最终 doctor 中聚合 Component 和 Commands collections 状态

#### Scenario: Component 冲突阻止 render
- **WHEN** sync 发现 Component modified、missing、ownership conflict 或 manifest invalid
- **THEN** sync MUST 在 runtime render 前停止
- **AND** sync MUST 提供需要用户处理的 Component 和成员上下文

### Requirement: Component-owned Builtins 不允许单项生命周期操作
Buildr MUST 区分独立 Builtin 与 Component-owned 产品成员，并阻止单项 Builtin 操作破坏 Component 完整性。

#### Scenario: 列出 Component-owned Builtin
- **WHEN** Agent 运行 `buildr builtin list --target <dir> --json`
- **THEN** Buildr MUST 标识属于 Component 的产品成员及其 Component id
- **AND** Buildr MUST 将 Component 命令作为其生命周期入口

#### Scenario: 单项卸载或恢复 Component 成员
- **WHEN** Agent 对 Component-owned Builtin 运行 `builtin uninstall` 或 `builtin restore`
- **THEN** Buildr MUST 拒绝操作且不修改源资产或 runtime
- **AND** Buildr MUST 引导 Agent 使用对应 Component install/uninstall

### Requirement: 已有 OpenSpec Builtins 迁移为 Component
Buildr update MUST 安全识别并迁移旧 workspace 中独立管理的 OpenSpec workflow Skills。

#### Scenario: 原位采用一致 OpenSpec Skills
- **WHEN** 旧 workspace 中全部预期 OpenSpec Skills 已安装且内容匹配当前 package
- **THEN** Buildr MUST 创建 OpenSpec Component registry entry 和 installed definition
- **AND** Buildr MUST 创建 OpenSpec Command collection
- **AND** Buildr MUST 保留现有 Skills 和 runtime 投射内容

#### Scenario: 旧 OpenSpec Skills 状态不一致
- **WHEN** 任一预期 OpenSpec Skill 为 modified、missing、uninstalled 或存在来源冲突
- **THEN** Buildr MUST 停止 OpenSpec Component 迁移
- **AND** Buildr MUST 保留全部旧状态
- **AND** Buildr MUST 输出集合级用户决策信息

