## MODIFIED Requirements

### Requirement: Buildr 内置能力层
Buildr MUST 在每个 Buildr workspace 中支持由产品管理的 Rules、Skills 和 Commands 内置能力层。

#### Scenario: 内置能力目录
- **WHEN** Buildr 初始化或同步 workspace
- **THEN** Buildr MUST 能够在 `rules/buildr/` 和 `skills/buildr/` 下物化产品管理的内置 Rule 和 Skill
- **AND** Buildr MUST 将内置 Commands 声明写入 `commands/manifest.yml`
- **AND** 用户管理的 Rules、Skills 和 Commands MUST 与内置能力共用对应 manifest

#### Scenario: 内置能力分 required 和 optional
- **WHEN** Buildr 提供内置 Rules、Skills 或 Commands
- **THEN** Buildr MUST 支持 `required: true` 和 `required: false`
- **AND** `rules/buildr/core.md` MUST 是 required Rule 且不可卸载
- **AND** optional 内置能力 MUST 支持显式卸载

#### Scenario: 内置能力状态跟踪
- **WHEN** Buildr 跟踪内置能力状态
- **THEN** Buildr MUST 区分 `installed`、`modified`、`uninstalled` 和 `missing`
- **AND** Buildr MUST 在对应 manifest 中持久化显式卸载状态，确保 sync 和 doctor 不把它误判为意外损坏

#### Scenario: 修改过的内置能力不被静默覆盖
- **WHEN** 某个内置能力在本地被修改
- **THEN** Buildr sync MUST NOT 在没有用户明确决策时覆盖 optional 内置能力
- **AND** doctor MUST 报告该修改状态，并提供足够上下文让用户选择还原或保留

#### Scenario: 已卸载的内置能力默认不还原
- **WHEN** 某个内置能力被标记为 `uninstalled`
- **THEN** Buildr sync MUST NOT 默认还原它
- **AND** doctor SHOULD 将其作为 info 而不是 warning 报告

### Requirement: Buildr sync 是 Agent 升级主路径
Buildr MUST 提供 `sync <agent>` 命令，让 Agent 使用当前 CLI package 携带的 assets 同步 workspace 产品能力并准备支持的 Agent runtime；首次 `init --agent` MUST 复用同一 sync 管线。

#### Scenario: 同步 Codex
- **WHEN** Agent 运行 `buildr sync codex --target <dir>`
- **THEN** Buildr MUST 同步 workspace 产品能力、安装或修复产品入口 Buildr Skill、渲染 Codex runtime，并报告最终 Codex doctor 状态
- **AND** Buildr MUST NOT 检查或更新 CLI 自身

#### Scenario: 同步 Claude Code
- **WHEN** Agent 运行 `buildr sync claude-code --target <dir>`
- **THEN** Buildr MUST 同步 workspace 产品能力、安装或修复产品入口 Buildr Skill、渲染 Claude Code runtime，并报告最终 Claude Code doctor 状态
- **AND** Buildr MUST NOT 检查或更新 CLI 自身

#### Scenario: 高层初始化复用 sync
- **WHEN** Agent 运行 `buildr init --agent <agent> --target <dir>`
- **THEN** Buildr MUST 先完成 workspace 源资产初始化，再通过与 `buildr sync <agent>` 相同的管线执行产品能力同步、Component reconcile、runtime 投射和 doctor
- **AND** Buildr MUST NOT 为初始化维护第二套 workspace reconcile、render 或 doctor 实现

#### Scenario: sync 遇到用户决策点时停止
- **WHEN** sync 遇到修改过的 optional 内置能力、manifest 对齐问题，或需要安装外部命令行工具
- **THEN** sync MUST 在执行破坏性或会修改本机环境的动作前停止
- **AND** sync MUST 提供清晰下一步，供 Agent 向用户确认

### Requirement: 已有 workspace 升级兼容
Buildr MUST 通过 sync 支持已有 Buildr workspace 升级到内置能力和 adapter render 模型，同时不静默覆盖用户编写的规则正文。

#### Scenario: 修复根 AGENTS required block
- **WHEN** 已有 workspace 的根 `AGENTS.md` 缺少或破坏 Buildr required block
- **THEN** Buildr sync MUST 恢复 required block，使其引用 `rules/buildr/core.md`
- **AND** Buildr MUST NOT 覆盖 `AGENTS.md` 的用户正文

#### Scenario: 迁入产品 baseline 规则
- **WHEN** 已有 workspace 使用旧版 package baseline rules
- **THEN** Buildr sync MUST 能将产品发布的规则迁入 `rules/buildr/` 和 `rules/manifest.yml`
- **AND** `runtime.md` 的语义 MUST 内化进 `rules/buildr/core.md`

#### Scenario: MVP 不提供 migrate 命令
- **WHEN** Buildr 处于本变更的 MVP 实施阶段
- **THEN** Buildr MUST NOT 要求实现 `buildr migrate agents`
- **AND** Buildr MUST 通过 doctor 兼容提示保护已有 workspace

### Requirement: Buildr 产品交付必须单向物化
Buildr MUST 将当前产品 package target 视为产品交付源，并将用户 workspace 和 Agent runtime 中的对应文件视为安装结果。

#### Scenario: Workspace target 单向物化
- **WHEN** Agent 使用当前 Buildr 产品执行 init 或 sync
- **THEN** Buildr MUST 从 `package/targets/workspace/` 向目标 workspace 物化 manifest 声明的资产
- **AND** Buildr MUST NOT 从目标 workspace 反向更新 Product Project 的 package 源

#### Scenario: Runtime target 单向物化
- **WHEN** Agent 执行 `buildr skill install <agent>`、`buildr sync <agent>` 或 `buildr init --agent <agent>`
- **THEN** Buildr MUST 从 `package/targets/runtime/` 安装 manifest 声明的产品入口 Agent Skill
- **AND** 安装后的 runtime 文件 MUST NOT 成为产品 Skill 的源资产

#### Scenario: 未合并候选产品使用隔离目标验证
- **WHEN** Buildr 维护者使用未合并的 task worktree Product checkout 验证候选产品
- **THEN** init/sync MUST 使用该 checkout 随附的 package target
- **AND** CLI update 测试 MUST 使用隔离 Git checkout 或 npm prefix
- **AND** 验证目标 MUST 是临时 workspace 或 task worktree自身，而不是主开发工作区的自举 workspace

#### Scenario: 相同候选 tree 集成后不重复物化验证
- **WHEN** 已完成隔离验证的候选 Git tree 未经内容改变集成到主开发分支
- **THEN** Buildr 开发流程 MUST NOT 要求仅为重复产品验证而从主开发分支 checkout 再次 sync 主自举 workspace
- **AND** 实际 workspace 后续需要消费新版产品资产时 MAY 独立执行 sync

#### Scenario: 保留 workspace 自有内容
- **WHEN** init/sync 向 workspace 物化产品管理资产
- **THEN** Buildr MUST 继续保留用户或自举 workspace 自有的 `AGENTS.md` 正文和未由 package manifest 管理的资产
- **AND** Buildr MUST 只修复 required block 和 manifest 声明的产品管理资产

### Requirement: Sync 聚合 Component 与 runtime 状态
Buildr sync MUST 在 workspace 产品能力同步阶段处理 Components，并在没有待决冲突时将其有效 Rules 和 Skills 投射到指定 Agent runtime。

#### Scenario: 同步启用 Component
- **WHEN** Agent 运行 `buildr sync <agent> --target <dir>`
- **THEN** Buildr MUST 先完成 Component reconcile/check
- **AND** Buildr MUST 将启用 Component 的有效 Skills 和 Rules 纳入指定 adapter 的 runtime reconcile
- **AND** Buildr MUST 在最终 doctor 中聚合 Component 和 Commands collections 状态

#### Scenario: Component 冲突阻止 render
- **WHEN** sync 发现 Component modified、missing、ownership conflict 或 manifest invalid
- **THEN** sync MUST 在 runtime render 前停止
- **AND** sync MUST 提供需要用户处理的 Component 和成员上下文

### Requirement: 已有 OpenSpec Builtins 迁移为 Component
Buildr sync MUST 安全识别旧 workspace 中独立管理或由 Buildr fork 管理的 OpenSpec workflow Skills，并迁移为外部上游 Skill 与 Buildr sidebar 分离的 Component。

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

## ADDED Requirements

### Requirement: Buildr sync 同步随包 Components
Buildr sync MUST 将当前 package 声明的 workspace Components 按 registry 期望状态和三方比较结果同步到已有 workspace。

#### Scenario: 更新已启用 Component
- **WHEN** Agent 运行 `buildr sync <agent> --target <dir>`
- **AND** Buildr-managed Component 为 enabled 且实际成员未被用户修改
- **THEN** Buildr MUST 按当前 package 定义更新 Component 和全部成员源资产，再继续 runtime render

#### Scenario: 不恢复已卸载 Component
- **WHEN** Component registry 将 optional Buildr-managed Component 标记为 uninstalled
- **THEN** Buildr sync MUST 保留该状态
- **AND** Buildr MUST NOT 因 package 新增或更新成员而重新安装它

#### Scenario: Component 修改阻塞 sync
- **WHEN** 已启用 Component 的实际成员不同于已安装 definition
- **THEN** Buildr sync MUST 停止该 Component 更新和后续 runtime render
- **AND** Buildr MUST 输出成员差异和用户可选择的恢复或迁移动作

## REMOVED Requirements

### Requirement: Buildr update 同步 workspace 产品能力
**Reason**: `buildr update` 改为只更新 CLI 自身；workspace 产品能力同步统一由 `buildr sync <agent>` 承担。

**Migration**: 将 `buildr update --target <dir>` 替换为 `buildr sync <agent> --target <dir>`；内置能力状态细查使用 `buildr builtin list --target <dir> --json` 和 doctor。

### Requirement: Buildr update 同步随包 Components
**Reason**: CLI update 不读取 workspace；随包 Component reconcile 已成为 sync 的组成部分。

**Migration**: 使用 `buildr sync <agent> --target <dir>` 更新启用的 Buildr-managed Components 并完成 runtime 与 doctor 闭环。
