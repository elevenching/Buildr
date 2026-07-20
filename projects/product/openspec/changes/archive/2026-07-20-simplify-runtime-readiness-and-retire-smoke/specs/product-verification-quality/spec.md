## MODIFIED Requirements

### Requirement: runtime adapter 验证必须按契约和实现族分层
Buildr 产品验证 MUST 对全部 supported runtime adapter 执行低成本 descriptor/plan/capability evidence 契约，并 MUST 仅按不同投射、skills root、checker 或 cleanup 实现语义选择代表执行昂贵 CLI 生命周期；Candidate MUST NOT 生成或执行真实 Agent marker smoke workspace。

#### Scenario: 验证全部 supported adapter
- **WHEN** fast 或 candidate verifier 运行 runtime adapter contract
- **THEN** contract MUST 遍历全部 supported adapter 的 traits、target、activation、capability evidence 和 RuntimePlan 安全边界

#### Scenario: 验证昂贵 adapter 生命周期
- **WHEN** affected CLI 或 candidate verifier 运行 runtime adapter parity
- **THEN** verifier MUST 覆盖 native recursive、per-source reference、same-directory vendor、central vendor 和 root-index bridge 等不同实现族
- **AND** verifier MUST NOT 仅因多个 adapter 品牌复用同一实现而重复完整 install/render/check/idempotency 生命周期

#### Scenario: scoped render 隔离无关 Project
- **WHEN** verifier 对某个 Project 执行 scoped render 和 cleanup
- **THEN** verifier MUST 验证无关 Project 的受管投射仍然存在且内容不变
- **AND** 该回归 MUST 覆盖 same-directory vendor、central vendor 和 root-index bridge cleanup 模型

#### Scenario: Agent runtime marker smoke 暂不属于 Candidate
- **WHEN** Candidate 编排 runtime adapter 验证
- **THEN** registry MUST NOT 包含 Agent runtime marker smoke workspace generator 或真实 Agent invocation step
- **AND** contract tests MUST NOT 固化某个品牌的历史 smoke status、marker result、product version 或 surface 快照
- **AND** npm release smoke、package smoke 和 workspace lifecycle E2E MUST 保持各自既有 owner 与覆盖
