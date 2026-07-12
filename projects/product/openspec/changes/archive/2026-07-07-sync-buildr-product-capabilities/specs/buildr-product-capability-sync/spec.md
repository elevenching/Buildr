## ADDED Requirements

### Requirement: Buildr 内置能力层
Buildr MUST 在每个 Buildr workspace 中支持由产品管理的 Rules、Skills 和 Commands 内置能力层。

#### Scenario: 内置能力目录
- **WHEN** Buildr 初始化或更新 workspace
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
- **AND** Buildr MUST 在对应 manifest 中持久化显式卸载状态，确保 update 和 doctor 不把它误判为意外损坏

#### Scenario: 修改过的内置能力不被静默覆盖
- **WHEN** 某个内置能力在本地被修改
- **THEN** Buildr update MUST NOT 在没有用户明确决策时覆盖 optional 内置能力
- **AND** doctor MUST 报告该修改状态，并提供足够上下文让用户选择还原或保留

#### Scenario: 已卸载的内置能力默认不还原
- **WHEN** 某个内置能力被标记为 `uninstalled`
- **THEN** Buildr update MUST NOT 默认还原它
- **AND** doctor SHOULD 将其作为 info 而不是 warning 报告

### Requirement: Buildr update 同步产品入口和内置能力
Buildr MUST 提供 update 路径，将当前 Buildr 产品同步到已有 workspace，同时不接管用户资产。

#### Scenario: 更新产品入口
- **WHEN** Agent 运行 `buildr update --target <dir>`
- **THEN** Buildr MUST 按当前安装渠道支持的方式检查或更新 Buildr CLI 入口
- **AND** Buildr MUST 为支持的 Agent runtime 安装或更新产品内置 Buildr Skill

#### Scenario: 更新内置能力
- **WHEN** Agent 运行 `buildr update --target <dir>`
- **THEN** Buildr MUST 按内置能力状态同步 package 声明的内置 Rules、Skills 和 Commands
- **AND** Buildr MUST 恢复 required 能力和根 `AGENTS.md` required block
- **AND** Buildr MUST NOT 覆盖用户管理 Rules、Skills、Commands 或 `AGENTS.md` 正文

#### Scenario: 更新检查
- **WHEN** Agent 运行 `buildr update check --target <dir> --json`
- **THEN** Buildr MUST 输出 Agent-readable 状态，覆盖 CLI、产品内置 Skill、内置能力、manifest 对齐、兼容状态和支持的 Agent runtime 投射

### Requirement: Buildr 内置能力管理命令
Buildr MUST 提供显式命令，供用户和 Agent 查看、卸载和还原内置能力。

#### Scenario: 查看内置能力
- **WHEN** Agent 运行 `buildr builtin list --target <dir> --json`
- **THEN** Buildr MUST 列出内置能力 id、类型、状态，以及可用的修复或还原动作
- **AND** 当内置能力声明了 version 或 hash 时，Buildr MUST 一并输出对应元数据

#### Scenario: 卸载内置能力
- **WHEN** Agent 运行 `buildr builtin uninstall <id> --target <dir>`
- **THEN** Buildr MUST 拒绝卸载 required 内置能力
- **AND** Buildr MUST 将 optional 内置能力标记为 `uninstalled`
- **AND** Buildr MUST 删除 optional 内置 Rule/Skill 源文件和 runtime 投射；Command 只更新 `commands/manifest.yml`

#### Scenario: 还原内置能力
- **WHEN** Agent 运行 `buildr builtin restore <id> --target <dir>`
- **THEN** Buildr MUST 从当前 Buildr 产品包还原该内置能力
- **AND** Buildr MUST 将其标记为 `installed`

### Requirement: Buildr sync 是 Agent 升级主路径
Buildr MUST 提供 sync 命令，让 Agent 能把最新 Buildr 产品交付到支持的 Agent runtime。

#### Scenario: 同步 Codex
- **WHEN** Agent 运行 `buildr sync codex --target <dir>`
- **THEN** Buildr MUST 检查产品更新状态、诊断 workspace 状态、处理必要兼容提示、渲染 Codex runtime，并报告最终 doctor 状态

#### Scenario: 同步 Claude Code
- **WHEN** Agent 运行 `buildr sync claude-code --target <dir>`
- **THEN** Buildr MUST 检查产品更新状态、诊断 workspace 状态、处理必要兼容提示、渲染 Claude Code runtime，并报告最终 doctor 状态

#### Scenario: sync 遇到用户决策点时停止
- **WHEN** sync 遇到修改过的 optional 内置能力、manifest 对齐问题，或需要安装外部命令行工具
- **THEN** sync MUST 在执行破坏性或会修改本机环境的动作前停止
- **AND** sync MUST 提供清晰下一步，供 Agent 向用户确认

### Requirement: 已有 workspace 升级兼容
Buildr MUST 支持已有 Buildr workspace 升级到内置能力和 adapter render 模型，同时不静默覆盖用户编写的规则正文。

#### Scenario: 修复根 AGENTS required block
- **WHEN** 已有 workspace 的根 `AGENTS.md` 缺少或破坏 Buildr required block
- **THEN** Buildr update MUST 恢复 required block，使其引用 `rules/buildr/core.md`
- **AND** Buildr MUST NOT 覆盖 `AGENTS.md` 的用户正文

#### Scenario: 迁入产品 baseline 规则
- **WHEN** 已有 workspace 使用旧版 package baseline rules
- **THEN** Buildr update MUST 能将产品发布的规则迁入 `rules/buildr/` 和 `rules/manifest.yml`
- **AND** `runtime.md` 的语义 MUST 内化进 `rules/buildr/core.md`

#### Scenario: MVP 不提供 migrate 命令
- **WHEN** Buildr 处于本变更的 MVP 实施阶段
- **THEN** Buildr MUST NOT 要求实现 `buildr migrate agents`
- **AND** Buildr MUST 通过 doctor 兼容提示保护已有 workspace
