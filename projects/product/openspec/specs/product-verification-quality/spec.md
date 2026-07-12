# Buildr 产品验证质量

## Purpose

定义 Buildr 候选版本的 Node/操作系统验证范围、正式 tarball 生命周期 smoke，以及可观察但不阻塞的验证耗时记录。

## Requirements

### Requirement: CI 必须覆盖最低 Node、当前 Node 和目标桌面平台
Buildr CI MUST 在 Linux Node 20 和 Node 22 上运行完整产品验证，并 MUST 在 Linux、macOS、Windows Node 22 上运行可移植 release smoke。

#### Scenario: 验证最低 Node 版本
- **WHEN** push 或 pull request 触发产品 CI
- **THEN** Linux Node 20 job MUST 安装锁定依赖和支持的 OpenSpec CLI
- **AND** job MUST 运行完整产品验证

#### Scenario: 验证当前 Node 与桌面平台
- **WHEN** push 或 pull request 触发产品 CI
- **THEN** Linux Node 22 MUST 运行完整产品验证
- **AND** Linux、macOS、Windows Node 22 MUST 运行 unit tests 和 release smoke

### Requirement: release smoke 必须验证安装后生命周期
Buildr MUST 提供不依赖 development checkout runtime 的跨平台 release smoke，从当前候选生成正式 npm tarball，并使用安装后的 `buildr` 完成初始化、同步、诊断、optional Component 卸载和最终诊断。

#### Scenario: 从候选 tarball 验证 release lifecycle
- **WHEN** 维护者或 CI 运行 release smoke
- **THEN** verifier MUST 执行 `npm pack` 并将 tarball 安装到隔离 prefix
- **AND** 安装后的 CLI MUST 完成 `init --agent`、独立 `sync` 和 `doctor --json`
- **AND** 安装后的 CLI MUST 卸载一个 optional Component 并再次运行 `doctor --json`
- **AND** 两次 doctor MUST 没有 error

#### Scenario: release smoke 跨平台运行
- **WHEN** verifier 在 Linux、macOS 或 Windows Node 22 运行
- **THEN** verifier MUST 使用平台对应的 npm executable 和 installed bin 路径
- **AND** verifier MUST NOT 依赖 Bash、Unix-only 临时目录命令或固定 `/tmp` 路径

### Requirement: 产品验证必须记录阶段耗时
Buildr 产品总验证 MUST 记录每个阶段和整体 wall-clock elapsed milliseconds，并 MUST 在成功或失败时生成可供 CI 保存的机器可读 timing summary。

#### Scenario: 完整验证成功
- **WHEN** 产品总验证全部通过
- **THEN** 人类输出 MUST 展示每个阶段的耗时和总耗时
- **AND** verifier MUST 写出包含 schemaVersion、steps、status、durationMs 和 totalDurationMs 的 JSON summary

#### Scenario: 某阶段失败
- **WHEN** 产品验证阶段返回非零状态
- **THEN** timing summary MUST 记录失败阶段、非零状态和已完成阶段耗时
- **AND** 产品验证 MUST 保持该阶段的失败退出状态

#### Scenario: 耗时波动
- **WHEN** 某阶段或总耗时高于此前运行
- **THEN** 当前版本 MUST 只记录事实
- **AND** verifier MUST NOT 仅因耗时增长而失败

### Requirement: 产品总验证必须包含开源候选门禁
Buildr 产品总验证 MUST 运行开源候选安全 verifier，并 MUST 在公开 metadata、tracked candidate 或 npm tarball inventory 不满足发布边界时失败。

#### Scenario: 验证最终产品候选
- **WHEN** 维护者运行 `tools/verify-buildr-product`
- **THEN** verifier MUST 在最终成功前运行开源候选安全检查
- **AND** timing summary MUST 将该检查记录为独立阶段

### Requirement: Timing summary 必须支持开发完成报告
Buildr verification timing summary MUST 提供总耗时、每阶段名称/状态/耗时和失败退出状态，使 Agent 能确定最慢阶段、失败阶段和 summary 路径。

#### Scenario: Agent 汇报成功验证
- **WHEN** 产品完整验证成功并生成 timing summary
- **THEN** summary MUST 足以确定 totalDurationMs 和耗时最长的 step
- **AND** 产品验证输出 MUST 显示 summary 的绝对路径

#### Scenario: Agent 汇报失败验证
- **WHEN** 产品完整验证失败并生成 timing summary
- **THEN** summary MUST 标记整体失败状态和失败 step
- **AND** 失败 step MUST 保留非零 exitCode 与 durationMs
