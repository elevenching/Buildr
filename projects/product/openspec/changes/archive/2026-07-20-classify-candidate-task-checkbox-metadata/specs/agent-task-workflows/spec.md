## ADDED Requirements

### Requirement: 最终 Candidate 任务勾选作为可审计验证结果元数据
Buildr Product MUST 允许 Task Finish 将严格限定的最终 Candidate task checkbox transition 分类为 `closeout-metadata-only`，并 MUST 使用 `verification-result-metadata-only` subtype 组合原 Candidate evidence 与独立 transition evidence，而不得声称原 Candidate 直接验证了变化后的 delivery tree。

#### Scenario: 同一会话勾选唯一最终 Candidate 任务
- **WHEN** 当前会话的 Candidate 对 implementation identity 成功产生可复用 evidence，随后 active change 中唯一明确的最终 Candidate 任务仅由 `- [ ]` 变为 `- [x]`
- **THEN** Task Finish MUST 保留原 implementation Candidate evidence，并记录 source/target identity、change/task identity、精确 old/new marker 和 `verification-result-metadata-only` subtype
- **AND** Task Finish MUST NOT 调用 task-verification `execute` 或 Candidate executor
- **AND** 最终报告 MUST 分别说明 Candidate 验证的树与 metadata transition 覆盖的 delivery tree

#### Scenario: checkbox transition 伴随其他变化
- **WHEN** 勾选 Candidate task 的同时存在任务文本、顺序、其他 task、文件或实现内容变化
- **THEN** Task Finish MUST 将 transition 归类为 `implementation-changed`
- **AND** Task Finish MUST 在交付前重新运行 Candidate

#### Scenario: transition 来源或任务身份不可证明
- **WHEN** 当前会话无法关联刚成功的 Candidate evidence、存在多个可能任务、source identity 不匹配或 transition evidence 已丢失
- **THEN** Task Finish MUST NOT 仅凭 `tasks.md` 最终 diff 推断 `verification-result-metadata-only`
- **AND** Task Finish MUST fail closed 并重新运行 Candidate

### Requirement: OpenSpec apply 协调最终验证任务标记
Buildr OpenSpec apply sidebar MUST 指导 Agent 在最终 Candidate 成功后捕获 Candidate evidence，再仅勾选对应验证任务并捕获精确 transition evidence；Buildr MUST NOT 通过修改外部 `openspec-*` Skill 源实现该协调。

#### Scenario: Candidate 是 tasks 中最后一个验证任务
- **WHEN** Agent 按 OpenSpec apply 执行 active change，且未完成任务是最终 Candidate 验证
- **THEN** Agent MUST 先对未勾选状态运行 Candidate并捕获 identity/evidence，再将对应 checkbox 由 `- [ ]` 改为 `- [x]`
- **AND** Agent MUST 立即确认该 checkbox 是唯一内容差异并记录 target identity

#### Scenario: 最终标记不满足严格条件
- **WHEN** OpenSpec apply 需要同时更新多个任务、修正文案或产生其他内容变化
- **THEN** Agent MUST 按普通 implementation change 处理
- **AND** Agent MUST NOT 创建可复用的 verification-result metadata transition
