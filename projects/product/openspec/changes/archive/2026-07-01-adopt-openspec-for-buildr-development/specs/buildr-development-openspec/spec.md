## ADDED Requirements

### Requirement: Buildr 计划型产品工作使用 OpenSpec
Buildr 必须使用 OpenSpec change 来规划产品能力、跨领域规则、CLI 行为变更和影响架构的工作，然后再进入实现。

#### Scenario: 开始产品能力开发
- **WHEN** 维护者决定实现一个新的 Buildr 产品能力
- **THEN** 该工作必须先表示为包含 proposal、design、specs 和 tasks 的 OpenSpec change，然后再开始实现

#### Scenario: 探索文档准备进入实现
- **WHEN** 设计文档描述的方向已经准备进入可执行工作
- **THEN** 必须创建新的 OpenSpec change，引用该文档并将范围收敛为可实施的需求和任务

### Requirement: Buildr 文档和 OpenSpec artifacts 分工明确
Buildr 必须将长期概念设计保留在 `docs/`，并使用 OpenSpec artifacts 表达具体、可实施的变更。

#### Scenario: 讨论长期产品想法
- **WHEN** 维护者记录广泛的架构、产品或治理方向
- **THEN** 信息应写入 `docs/`，而不是直接视为实施计划

#### Scenario: 具体实现准备开始
- **WHEN** 维护者决定从某个产品方向中构建具体能力
- **THEN** 该能力必须被捕获为包含明确需求和任务的 OpenSpec change

### Requirement: OpenSpec 自举不改变 runtime 行为
OpenSpec 自举变更不得修改现有 Buildr CLI runtime check、render 或 adapter 行为。

#### Scenario: 应用自举变更
- **WHEN** OpenSpec 自举变更被实施
- **THEN** 现有 Buildr runtime 命令必须保持原有行为
