## ADDED Requirements

### Requirement: Workspace 管理 Component 源资产
Buildr MUST 支持在 workspace 级维护 Component，并将 Component 作为一个或多个 Rules、Skills 和 Command collections 的统一生命周期单元。

#### Scenario: 初始化 Component registry
- **WHEN** Buildr 初始化新 workspace
- **THEN** Buildr MUST 创建 `components/manifest.yml`
- **AND** manifest MUST 声明 `schemaVersion: buildr.components/v1`

#### Scenario: Component 定义位置
- **WHEN** workspace 安装 Component `<id>`
- **THEN** Buildr MUST 将已安装定义保存在 `components/<source>/<id>/component.yml`
- **AND** 定义 MUST 声明 `schemaVersion: buildr.component/v1`、稳定 id、kind、version、来源、成员和成员 integrity

#### Scenario: 仅支持 workspace scope
- **WHEN** Agent 尝试在 Project 或 Service scope 安装 Component
- **THEN** Buildr MUST 拒绝该操作
- **AND** Buildr MUST 说明当前只支持 workspace Component

### Requirement: Component 支持单项或组合资产
Buildr MUST 允许 Component 拥有一个或多个成员，成员类型限于当前 workspace 已支持的 Rules、Skills 和 Command collections。

#### Scenario: 跨资产类型 Component
- **WHEN** Component 定义同时声明 Command collection 和 Skills
- **THEN** Buildr MUST 将这些成员作为一个安装、更新和卸载单元管理

#### Scenario: 单成员 Component
- **WHEN** 用户明确要求将单个 Rule、Skill 或 Command collection 作为 Component 管理
- **THEN** Buildr MUST 允许 Component 只包含该成员

#### Scenario: 不包含 Project Scaffold
- **WHEN** Buildr 安装、更新或卸载 workspace Component
- **THEN** Buildr MUST NOT 因 Component 生命周期创建、修改或删除任何 Project 下的目录或内容

### Requirement: Component manifest 表达用户期望状态
Buildr MUST 使用 `components/manifest.yml` 保存 Component 的 workspace 选择状态，并将已安装 `component.yml` 作为上次成功物化的版本回执。

#### Scenario: 已安装 Component entry
- **WHEN** Component 安装成功
- **THEN** registry entry MUST 记录 `id`、`source`、`path`、`enabled: true`、`required` 和 `state: installed`

#### Scenario: 显式卸载状态
- **WHEN** 用户卸载 optional Component
- **THEN** Buildr MUST 保留 registry entry
- **AND** entry MUST 记录 `enabled: false` 和 `state: uninstalled`
- **AND** entry MAY 保存卸载 reason

#### Scenario: Required Component 不可卸载
- **WHEN** Agent 尝试卸载 `required: true` 的 Component
- **THEN** Buildr MUST 拒绝操作且不修改任何源资产或 runtime

### Requirement: Component 源资产变更采用集合级预检
Buildr MUST 在安装、更新或卸载 Component 前预检全部成员，并在发现未确认冲突时保持该 Component 的源资产不变。

#### Scenario: 安装目标冲突
- **WHEN** Component 成员 id、manifest path 或源路径已由其他 Component 或用户资产占用
- **THEN** Buildr MUST 报告冲突
- **AND** Buildr MUST NOT 物化该 Component 的任何成员

#### Scenario: 卸载前发现用户修改
- **WHEN** Component 成员内容不再匹配已安装定义记录的 integrity
- **THEN** Buildr MUST 停止卸载
- **AND** Buildr MUST NOT 删除用户修改或其他 Component 成员

#### Scenario: 成员唯一所有权
- **WHEN** 两个已启用 Component 声明同一个 Rule、Skill 或 Command collection
- **THEN** Buildr MUST 将其报告为 ownership conflict
- **AND** Buildr MUST NOT 静默选择所有者

### Requirement: Component 更新使用三方比较
Buildr MUST 使用已安装 Component 定义、workspace 实际成员和当前交付定义区分安全升级与用户修改。

#### Scenario: 未修改旧版本安全升级
- **WHEN** workspace 实际成员匹配已安装 `component.yml` 的 integrity
- **AND** 当前 package 提供了新版本定义
- **THEN** Buildr MUST 能够安全更新成员
- **AND** Buildr MUST 在成员全部成功写入后最后更新 workspace `component.yml`

#### Scenario: 用户修改阻止升级
- **WHEN** workspace 实际成员同时不同于旧定义和新定义
- **THEN** Buildr MUST 将 Component 报告为 modified
- **AND** Buildr MUST NOT 静默覆盖成员或更新安装回执

#### Scenario: 安全新增和删除成员
- **WHEN** 新定义新增未冲突成员，或删除仍匹配旧 integrity 的成员
- **THEN** Buildr MUST 能够新增或删除对应成员
- **AND** 被删除成员已修改时 Buildr MUST 停止整个 Component 更新

### Requirement: Component CLI 完成源资产与 runtime 闭环
Buildr MUST 提供 Component list、check、install 和 uninstall 命令，并要求安装和卸载指定当前受支持的 Agent adapter。

#### Scenario: 查看 Component 状态
- **WHEN** Agent 运行 `buildr component list --target <dir> --json` 或 `buildr component check [<id>] --target <dir> --json`
- **THEN** Buildr MUST 输出 Component id、来源、版本、期望状态、实际状态、成员状态和可执行下一步

#### Scenario: 安装 Component
- **WHEN** Agent 运行 `buildr component install <id> --agent <agent> --target <dir>`
- **THEN** Buildr MUST 要求 target 是已初始化 workspace 且 Agent adapter 受支持
- **AND** Buildr MUST 预检并物化全部源资产成员
- **AND** Buildr MUST 使用指定 adapter reconcile Agent runtime
- **AND** Buildr MUST 运行最终 `doctor --agent <agent> --json`

#### Scenario: 卸载 Component
- **WHEN** Agent 运行 `buildr component uninstall <id> --agent <agent> --target <dir>`
- **THEN** Buildr MUST 在预检通过后删除其受管 Rule、Skill 和 Command collection 成员
- **AND** Buildr MUST 使用指定 adapter 清理对应 runtime 投射
- **AND** Buildr MUST 运行最终 `doctor --agent <agent> --json`

#### Scenario: Runtime reconcile 失败
- **WHEN** Component 源资产已经安全提交但 runtime reconcile 或最终 doctor 失败
- **THEN** Buildr MUST 返回失败状态
- **AND** Buildr MUST 将源资产保持为事实源并提供 runtime 修复动作
- **AND** Buildr MUST NOT 报告 Component 操作已经完整完成

### Requirement: Component 成员只能通过 Component 生命周期维护
Buildr MUST 阻止普通 Builtin、Rules、Skills 或 Commands 维护命令删除或替换已启用 Component 的成员。

#### Scenario: 单独删除 Component Skill
- **WHEN** Agent 对 Component-owned Skill 运行 `skills remove` 或 `builtin uninstall`
- **THEN** Buildr MUST 拒绝操作
- **AND** Buildr MUST 引导使用 `buildr component uninstall <id>`

#### Scenario: 单独修改 Component Command collection
- **WHEN** Agent 对 Component-owned Command collection 运行普通 `commands add`、`commands remove` 或替换操作
- **THEN** Buildr MUST 拒绝操作
- **AND** Buildr MUST 报告拥有该 collection 的 Component

#### Scenario: 用户自有资产不受限制
- **WHEN** Rule、Skill 或 Command collection 不属于已启用 Component
- **THEN** Buildr MUST 继续允许现有资产维护命令按各自契约工作

### Requirement: OpenSpec 作为首个随包 Component
Buildr MUST 随包提供 workspace 级 OpenSpec Component，统一管理 OpenSpec Command collection 和 workflow Skills。

#### Scenario: OpenSpec Component 成员
- **WHEN** Buildr 初始化或更新默认启用 OpenSpec 的 workspace
- **THEN** OpenSpec Component MUST 包含 `commands/buildr/openspec/manifest.yml`
- **AND** Component MUST 包含随包提供的全部 `openspec-*` workflow Skills
- **AND** Component 定义 MUST 记录 OpenSpec 上游版本、来源和成员 integrity

#### Scenario: OpenSpec CLI 仍是外部工具
- **WHEN** OpenSpec Component 安装或更新
- **THEN** Buildr MUST 只声明并检查 OpenSpec CLI
- **AND** Buildr MUST NOT 自动安装、升级或卸载本机 OpenSpec CLI

#### Scenario: OpenSpec Component 不拥有 Project 数据
- **WHEN** OpenSpec Component 安装、更新或卸载
- **THEN** Buildr MUST NOT 创建、修改或删除任何 Project 的 `openspec/` 内容

