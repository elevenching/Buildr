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
- **AND** Buildr MUST 通过安装回执区分上一版官方资产与用户修改

#### Scenario: 官方内置能力自动升级
- **WHEN** workspace live 内容精确匹配上次安装回执或 package 声明的已知旧版官方完整性
- **THEN** Buildr sync MUST 自动升级到当前 package 内容
- **AND** Buildr MUST NOT 要求用户确认是否同步 Buildr 自身更新

#### Scenario: 修改过的内置能力不被静默覆盖
- **WHEN** 某个内置能力的 live 内容不匹配上次安装回执、当前 package 或已知旧版官方完整性
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

#### Scenario: sync 自动处理官方 Builtin 升级
- **WHEN** sync 证明 optional Builtin 的 live 内容等于上次安装版本或已知旧版官方资产
- **THEN** sync MUST 自动升级并继续 render 与 doctor
- **AND** sync MUST NOT 将该差异作为用户决策点

#### Scenario: sync 遇到用户决策点时停止
- **WHEN** sync 遇到可证明的用户修改、manifest 对齐问题，或需要安装外部命令行工具
- **THEN** sync MUST 在执行破坏性或会修改本机环境的动作前停止
- **AND** sync MUST 提供清晰下一步，供 Agent 向用户确认
