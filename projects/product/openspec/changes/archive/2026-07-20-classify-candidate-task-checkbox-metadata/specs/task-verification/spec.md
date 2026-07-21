## ADDED Requirements

### Requirement: Candidate evidence 与验证结果元数据 transition 分离
Task verification provider MUST 继续将 Candidate evidence 绑定实际验证的 implementation identity；consumer MAY 仅在 Project policy 明确定义且 transition evidence 完整时，将该 evidence 与 `verification-result-metadata-only` transition 组合用于收尾。

#### Scenario: Consumer 核对受限 metadata transition
- **WHEN** consumer 提供与 Candidate identity 一致的 source identity，以及同一会话内唯一最终 Candidate task checkbox 的完整 transition evidence
- **THEN** provider MUST 以 `inspect` 核对原 Candidate evidence，且 `taskVerificationExecuteCalls` 与 `candidateExecutorCalls` MUST 均保持 `0`
- **AND** Result Evidence MUST 保持原 `candidateIdentity`，不得改写为 target delivery identity

#### Scenario: Consumer 缺少可审计 transition evidence
- **WHEN** consumer 只有变化后的 tree 或最终 diff，无法证明同一会话动作、唯一任务和精确 marker transition
- **THEN** provider MUST 将原 Candidate evidence 标记为不可直接复用于变化后的 implementation candidate
- **AND** consumer MUST 请求新的 Candidate execution 或报告 incomplete

#### Scenario: Transition evidence 仅在当前会话存在
- **WHEN** verification-result metadata transition 没有 versioned 持久化 receipt
- **THEN** consumer MUST 将 transition evidence 标记为 `session-only`
- **AND** 跨会话丢失该证据后 MUST NOT 从路径或 checkbox 状态反推可复用性
