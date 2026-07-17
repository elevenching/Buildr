## MODIFIED Requirements

### Requirement: Buildr update 只更新 CLI 自身
`buildr update` MUST 只更新当前 Buildr CLI 来源，不得同步或诊断任何 workspace；development-checkout 的只读检查 MUST 区分 Git source 同步状态与已发布 package version 状态。

#### Scenario: update 成功后退出
- **WHEN** Agent 运行 `buildr update` 且当前来源可安全更新
- **THEN** Buildr MUST 完成当前 CLI 来源更新并退出
- **AND** Buildr MUST NOT 同步 workspace assets、安装 Buildr Skill、render Agent runtime 或运行 workspace doctor

#### Scenario: update 不接收 workspace target
- **WHEN** Agent 为 `buildr update` 传入 workspace `--target`
- **THEN** Buildr MUST 拒绝该参数并说明 workspace 同步应使用 `buildr sync <agent> --target <dir>`

#### Scenario: 检查 CLI 更新
- **WHEN** Agent 运行 `buildr update check --json`
- **THEN** Buildr MUST 只读检查当前来源、可用更新和安全阻塞状态
- **AND** JSON MUST 包含 mode、current、available、status、blockingReasons 和 nextActions
- **AND** development-checkout 结果 MUST 分别包含 sourceStatus 与 versionStatus

#### Scenario: 开发 checkout 版本落后于已发布版本
- **WHEN** 当前 branch 与 upstream 一致，但 checkout package version 低于 npm 对应发布渠道的可用版本
- **THEN** update check MUST 报告 sourceStatus 为 `up-to-date` 且 versionStatus 为 `stale`
- **AND** 顶层 status MUST NOT 报告 `up-to-date`
- **AND** Buildr MUST NOT 因版本漂移自动安装 registry package、修改 checkout 或同步 workspace

#### Scenario: 无法查询发布版本
- **WHEN** development-checkout 的 registry version 查询不可用
- **THEN** update check MUST 保留 Git source 检查结果并将 versionStatus 报告为 `unknown`
- **AND** Buildr MUST NOT 把 registry 查询失败解释为修改 Git checkout 的授权
