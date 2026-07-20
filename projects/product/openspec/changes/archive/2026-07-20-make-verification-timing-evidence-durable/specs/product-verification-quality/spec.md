## ADDED Requirements

### Requirement: 验证 timing 证据必须具有运行级唯一归属
Buildr Candidate 和 Changed verification MUST 为默认本地运行生成 run-scoped timing summary 与 diagnostics，并 MUST 记录足以区分 worktree 候选的 source identity。

#### Scenario: 两个 worktree 使用默认输出
- **WHEN** 两个 Buildr worktree 分别运行 Candidate 或 Changed verification 且没有显式设置 timing 输出路径
- **THEN** 两次运行 MUST 使用不同的 evidence directory 和 summary 路径
- **AND** 任一运行 MUST NOT 覆盖另一运行的 summary 或 diagnostics

#### Scenario: summary 记录候选归属
- **WHEN** verification 生成 timing summary
- **THEN** summary MUST 记录 run id、run kind、开始与结束时间
- **AND** summary MUST 记录 repository root、Product root、Git HEAD、branch、dirty state 和包含未提交候选内容的稳定 fingerprint
- **AND** fingerprint algorithm identity MUST 可识别

#### Scenario: 调用方显式设置输出路径
- **WHEN** 调用方设置 `BUILDR_TIMING_OUTPUT` 或 `BUILDR_DIAGNOSTICS_OUTPUT`
- **THEN** verifier MUST 保持显式路径兼容性
- **AND** summary MUST 仍记录本次 run/source identity，使消费者能够发现路径复用或误归属

### Requirement: 验证人类输出必须显示完成 timing 摘要
Buildr Candidate 和 Changed verification MUST 在运行结束时直接输出可读的整体 timing 摘要，而不是只输出 summary 文件路径。

#### Scenario: 验证成功
- **WHEN** verification 全部通过
- **THEN** 人类输出 MUST 显示 total duration、预算状态（如适用）、最慢阶段、`failed: none` 和 summary 绝对路径

#### Scenario: 验证失败
- **WHEN** verification 至少一个阶段失败
- **THEN** 人类输出 MUST 显示 total duration、最慢阶段、失败阶段名称/状态和 summary 绝对路径
- **AND** timing 输出 MUST NOT 掩盖原失败退出状态

### Requirement: Changed verification 必须生成整体 timing summary
Buildr Changed verification MUST 使用与 Candidate 相同的 timing schema family 记录所选 DAG 的整体 wall-clock 与逐阶段证据。

#### Scenario: Changed plan 被执行
- **WHEN** `npm run test:changed` 选择并运行至少一个 verification step
- **THEN** verifier MUST 生成 `buildr.verification-timing/v1` summary
- **AND** summary MUST 将 run kind 记录为 `changed`
- **AND** summary MUST 记录 totalDurationMs、全部已完成 step、status、source identity 和 diagnostics 路径

#### Scenario: Changed 运行结束
- **WHEN** Changed verification 成功或失败并完成 summary 写入
- **THEN** summary 与 diagnostics MUST 保留在本次唯一 evidence directory
- **AND** 候选 package 等短生命周期执行制品 MUST 继续清理
