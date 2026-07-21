## ADDED Requirements

### Requirement: package maintenance 必须组合独立 verifier
Buildr package maintenance application MUST 通过职责明确的 verifier modules 组合 package check，且每个 verifier MUST 提供稳定执行入口和结构化的成功或失败结果。

#### Scenario: 检查 package maintenance facade
- **WHEN** CLI architecture verifier 检查 package maintenance application
- **THEN** command handler MUST 只负责建立共享 package context、调用已登记 verifier 和汇总输出
- **AND** handler 与单个 smoke module MUST NOT 内嵌 Commands、Rules、Skills、runtime 和 workspace 生命周期的完整组合场景

#### Scenario: verifier 报告失败
- **WHEN** 任一 package verifier 发现契约问题或子进程失败
- **THEN** verifier MUST 将问题归属到稳定 step identity
- **AND** 聚合层 MUST 保留可定位诊断而不是仅报告无边界的 package check 失败
