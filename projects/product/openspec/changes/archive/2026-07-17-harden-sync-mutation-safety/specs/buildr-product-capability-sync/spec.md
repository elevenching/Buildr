## MODIFIED Requirements

### Requirement: Buildr sync 是 Agent 升级主路径
Buildr MUST 提供 `sync <agent>` 命令，让 Agent 使用当前 CLI package 携带的 assets 同步 workspace 产品能力并准备支持的 Agent runtime；首次 `init --agent` MUST 复用同一 sync 管线，且所有可预判用户决策必须由零副作用的只读 preflight 汇总。

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
- **WHEN** sync 只读 preflight 遇到可证明的用户修改、optional Builtin 缺失、Component 冲突、manifest 对齐问题，或需要安装外部命令行工具
- **THEN** sync MUST 在创建 mutation lock、transaction、journal、backup 或执行任何 workspace 写入前停止
- **AND** sync MUST 一次性提供清晰的集合级下一步，供 Agent 向用户确认
- **AND** workspace 文件与 Git 状态 MUST 与执行前完全一致

#### Scenario: 用户完成 Builtin 决策后重新同步
- **WHEN** 用户根据 preflight 结果完成 optional Builtin restore 或 uninstall 决策并重新运行 sync
- **THEN** Buildr MUST 使用新的只读 plan 执行 source mutation、runtime render 和最终 doctor
- **AND** 最终 doctor 通过时 sync MUST 报告完成
