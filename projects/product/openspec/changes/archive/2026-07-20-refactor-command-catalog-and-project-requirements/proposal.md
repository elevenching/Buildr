## Why

当前 Commands 模型把 workspace 中的工具定义、Project 是否需要该工具以及当前机器是否满足要求聚合为同一层事实，导致无关 Project 的工具也可能进入统一诊断，且无法准确表达跨 Project 任务的版本兼容或冲突。Skills 已完成 source、context 与 destination 分离，Commands 也需要按自身语义拆分为 workspace catalog、Project requirements 和 machine environment 三层。

## What Changes

- 将 workspace `commands/**/manifest.yml` 定义为外部 CLI 的唯一受管 catalog，保存稳定工具身份、executable、version probe 和 install hint。
- 新增 Project command requirements 源资产，由 Project 引用 workspace Command ID，并声明 required/optional、版本约束和适用性，不复制工具定义。
- 让 `commands check`、doctor 和 Agent guidance 根据明确的 workspace/Project task context 解析有效 requirements；无 Project context 时不把所有 Project requirements 聚合成当前机器必须满足的全局要求。
- 定义同 Command ID 不同 executable/probe 的 catalog 冲突、兼容版本约束合并、跨 Project 不兼容约束和本机缺失/版本不满足的不同诊断类型。
- 保持 Buildr 不安装 binary、不保存登录态、token、cookie 或个人配置的既有边界。
- **BREAKING**：Commands readiness 不再等同于递归聚合全部 Project 的环境要求；调用方需要提供明确 Project context，或只检查 workspace catalog 自身声明的默认要求。

## Capabilities

### New Capabilities

- `project-command-requirements`: 定义 Project 对 workspace Command catalog 的引用、版本约束、跨 Project 合并与冲突诊断。

### Modified Capabilities

- `command-line-tool-assets`: 将 Command catalog definition、requirement resolution 和 machine observation 分层，并调整 check/CLI 行为。
- `project-registry`: 将 Project command requirements 纳入 Project baseline、有效性与 doctor readiness。
- `agent-readable-doctor`: 按明确 task context 输出 Command requirement、catalog 和本机环境的分层诊断。
- `human-agent-onboarding`: 创建 Project 时生成或说明 Commands requirement context，并引导 Agent 区分声明与本机安装。
- `buildr-package-assets`: 交付 Project requirements baseline，并覆盖 catalog、context、环境差异和跨 Project 冲突验证。
- `cli-product-surface`: 更新 Commands add/remove/check 的参数、帮助、JSON 和迁移提示。
- `managed-components`: 明确 Component 只能拥有 workspace Command catalog collection，不能拥有 Project requirement 或本机安装状态。

## Impact

- 影响 Commands manifest/schema、Project template、Project registry/doctor、Commands CLI、JSON contracts、Component ownership 和 package/runtime verification。
- 预计新增 `projects/<project>/commands.yml` 或由 design 最终确认的等价 Project requirement 文件，并需要安全迁移现有只含 workspace Commands 的工作区。
- 不接管 Homebrew、npm、Maven 等安装器，也不把凭证或本机私有配置写入 Buildr workspace。
- 与 Skill scope change 共享“source authority 与业务 context 分离”原则，但 Commands 没有 Agent runtime render destination。
