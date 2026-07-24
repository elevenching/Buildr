## ADDED Requirements

### Requirement: Package 原子交付任务资产观察 v2
Buildr package MUST 原子交付 `buildr.task-asset-review/v2` contract、默认 provider、内部 helper 与模板、workspace binding、产品入口路由和 Task Finish optional dependency。

#### Scenario: Package 安装 v2
- **WHEN** Buildr 初始化或同步 workspace
- **THEN** package MUST 安装 v2 contract 和完整 task-asset-review Skill 目录
- **AND** default binding 与 Task Finish requirement MUST 引用 v2

#### Scenario: Package 校验内部资源
- **WHEN** Agent 运行 package check 或产品 affected verification
- **THEN** verifier MUST 检查 helper、模板、manifest contract identity 和 provider/consumer version 一致性
- **AND** verifier MUST 覆盖共享路径、owner mismatch、原子写入、accept、reject 和 handoff 行为

#### Scenario: Optional provider 缺失
- **WHEN** `buildr.task-asset-review/v2` 对 Task Finish 不可用
- **THEN** doctor MUST 报告 non-blocking degradation
- **AND** runtime binding evidence MUST 声明 finalize stage skipped
