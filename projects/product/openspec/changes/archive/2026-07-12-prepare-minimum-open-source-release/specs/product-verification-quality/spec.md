## ADDED Requirements

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
