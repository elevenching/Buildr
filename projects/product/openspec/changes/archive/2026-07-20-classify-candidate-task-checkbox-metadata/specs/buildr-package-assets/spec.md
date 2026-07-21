## ADDED Requirements

### Requirement: 产品验证覆盖 Candidate task metadata 分类
Buildr package verification MUST 覆盖 `verification-result-metadata-only` 的允许与拒绝路径，并 MUST 确认该优化不改变 task-verification capability contract、provider identity 或默认 binding。

#### Scenario: 校验唯一 checkbox transition
- **WHEN** package contract tests 读取 Task Finish、Task Verification、OpenSpec apply sidebar 和 closeout fixtures
- **THEN** 验证 MUST 确认同一会话内唯一最终 Candidate task 的精确 `[ ]` → `[x]` transition 复用 Candidate evidence 且 executor counts 均为 `0`
- **AND** 验证 MUST 确认结果保留 implementation Candidate identity 与独立 target delivery identity

#### Scenario: 校验 fail-closed 分支
- **WHEN** fixture 表示额外内容变化、任务歧义或跨会话缺少 transition evidence
- **THEN** 验证 MUST 确认 transition 为 `implementation-changed` 且需要新的 Candidate execution
- **AND** verifier MUST 拒绝仅按 `tasks.md` 路径、Markdown 类型或最终 checkbox 状态放行

#### Scenario: 校验能力拓扑兼容
- **WHEN** Buildr package verification 检查本次指导与 fixture
- **THEN** 验证 MUST 确认 `buildr.task-verification/v1`、selected provider 与 binding identity 保持不变
- **AND** 验证 MUST 确认外部 `openspec-*` Skill 源未被修改
