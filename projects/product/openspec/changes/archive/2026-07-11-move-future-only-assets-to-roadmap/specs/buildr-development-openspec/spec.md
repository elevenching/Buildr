## ADDED Requirements

### Requirement: Buildr 未来规划资产使用明确 Roadmap 语境
Buildr MUST 将尚未实现但仍保留为产品方向的详细资料维护在明确的 Roadmap 语境中，并 MUST 将其与当前事实、行为契约、可执行规则、Skills 和历史 archive 区分。

#### Scenario: 保留尚未实现的详细产品方向
- **WHEN** Buildr 维护尚未实现的角色 Agent、工作流或产品能力详细资料
- **THEN** 资料 MUST 位于 `docs/roadmap/` 或等价的明确未来规划位置
- **AND** 资料 MUST 显著说明其尚未实现且不是当前产品事实或可执行资产
- **AND** 资料 MUST NOT 使用会把未来方向表述为 Buildr 当前已提供能力的承诺性口吻

#### Scenario: 从产品入口发现未来规划
- **WHEN** 维护者从 Buildr 产品 README、产品主说明或文档索引查找后续方向
- **THEN** 文档 MUST 提供可发现的 Roadmap 入口
- **AND** 入口 MUST 说明 Roadmap 不替代 current-state knowledge、canonical specs 或 active OpenSpec change

#### Scenario: 未来方向准备进入实现
- **WHEN** Roadmap 中的某个方向准备进入具体实现
- **THEN** 维护者 MUST 为该方向创建独立 OpenSpec change 并收敛可实施范围
- **AND** Roadmap 文档本身 MUST NOT 被视为已经批准或完成的实现契约

#### Scenario: 移动未来资料不改写历史事实
- **WHEN** 维护者把误放在当前产品资产面的未来资料移动到 Roadmap
- **THEN** 当前产品入口和仍有效的文档引用 MUST 指向新位置
- **AND** historical OpenSpec archive MUST NOT 为适配新路径而被回改
- **AND** 若资料不属于 package 发布边界，移动 MUST NOT 将其隐式加入 workspace baseline 或 Agent runtime
