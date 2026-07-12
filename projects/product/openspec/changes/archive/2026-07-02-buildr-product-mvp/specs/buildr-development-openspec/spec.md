## MODIFIED Requirements

### Requirement: Buildr 计划型产品工作使用 OpenSpec
Buildr MUST 使用 OpenSpec change 来规划产品能力、跨领域规则、CLI 行为变更和影响架构的工作，然后再进入实现。

#### Scenario: 开始产品能力开发
- **WHEN** 维护者决定实现一个新的 Buildr 产品能力
- **THEN** 该工作 MUST 先表示为包含 proposal、design、specs 和 tasks 的 OpenSpec change，然后再开始实现

#### Scenario: 探索文档准备进入实现
- **WHEN** 设计文档描述的方向已经准备进入可执行工作
- **THEN** MUST 创建新的 OpenSpec change，引用该文档并将范围收敛为可实施的需求和任务

#### Scenario: 产品 MVP 进入实现
- **WHEN** Buildr Product MVP 的 proposal 和 design 已经收敛为可实施能力
- **THEN** MUST 补齐对应 specs 和 tasks，并以这些 artifacts 作为后续实现、校验和归档依据
