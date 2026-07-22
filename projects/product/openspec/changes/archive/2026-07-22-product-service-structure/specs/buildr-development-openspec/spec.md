## ADDED Requirements

### Requirement: Product planning root 与 Service verification root 必须协同但保持所有权分离
Buildr 产品开发 MUST 以 Product Project root 维护 OpenSpec、任务与项目级验证政策，并 MUST 以 Buildr Service root 执行源码、npm package、测试和发布验证；验证编排必须显式识别两个根的所有权。

#### Scenario: 创建 Product OpenSpec change
- **WHEN** Agent 为 Buildr 可执行 Service 创建产品变更
- **THEN** proposal、design、delta specs 和 tasks MUST 位于 Product Project 的 `openspec/changes/`
- **AND** implementation MUST 位于同一 task worktree 的 Buildr Service root

#### Scenario: 运行 affected 或 Candidate
- **WHEN** Product 验证同时覆盖 OpenSpec 和 Buildr Service 实现
- **THEN** verifier MUST 从 Project root 解析 canonical specs 和任务事实
- **AND** MUST 从 Service root 解析 package scripts、运行源码、测试、package assets 和 npm identity

#### Scenario: 报告候选身份
- **WHEN** verifier 生成 Product Candidate evidence
- **THEN** evidence MUST 绑定包含 Project 与 Service 变更的同一 Git candidate fingerprint
- **AND** MUST 明确记录 Project planning root 与 Service package root，不得把其中一个伪装为另一个
