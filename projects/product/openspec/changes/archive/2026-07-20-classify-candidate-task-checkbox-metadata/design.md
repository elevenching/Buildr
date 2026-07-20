## Context

Candidate evidence 当前严格绑定验证时的 candidate identity。最终 OpenSpec task 若是 Candidate 本身，按“完成后立即勾选”规则会在验证成功后产生一次预期内容变化。直接放宽 fingerprint 比较会掩盖真实实现修改；坚持任意变化即重跑则造成确定性的无价值重复。

该行为横跨 OpenSpec apply、Task Verification、Task Finish 与 Product policy。外部 OpenSpec Skill 不属于 Buildr 产品源，Buildr 只能通过已有 sidebar contribution 叠加自身约束。

## Goals / Non-Goals

**Goals:**

- 精确定义一种可审计的 `verification-result-metadata-only` transition，避免只因最终 Candidate task checkbox 重跑 Candidate。
- 保持 Candidate evidence 只证明树 A，同时以独立 transition evidence 证明树 B 仅增加验证结果元数据。
- 对额外改动、歧义或丢失证据继续 fail closed。
- 保持现有 capability contract、provider 与 binding 拓扑兼容。

**Non-Goals:**

- 不把任意 `tasks.md`、Markdown 或 closeout 编辑都视为可复用。
- 不让 Task Verification provider 修改 `tasks.md`，也不让 OpenSpec apply 拥有 Candidate 执行政策。
- 不提供跨会话自动恢复 transition evidence 的持久化 receipt；本次先采用 session-observable 证据。
- 不修改外部 `openspec-*` Skill 源。

## Decisions

### 1. 组合两段证据，而不改变 Candidate identity

Candidate evidence 的 `candidateIdentity` 继续绑定树 A。Task Finish/consumer 另行记录 `verificationResultMetadataTransition`，包含 source/target identity、change id、task path、唯一 task identity、精确 old/new marker、同一会话关联与 diff 分类。最终报告明确 Candidate 验证了 A，A→B 只由受限元数据证据覆盖。

备选方案是把 checkbox 从 fingerprint 排除；这会让任意 task 内容变化不可观测，拒绝采用。

### 2. 作为 `closeout-metadata-only` 的严格子类

transition class 保持 `closeout-metadata-only`，新增 reason/subtype `verification-result-metadata-only`，避免扩大 contract 枚举和 capability version。允许条件必须全部成立：

- 先有当前会话刚成功且可复用的 Candidate evidence；
- 唯一差异是 active change `tasks.md` 中一个明确的最终 Candidate 验证任务由 `- [ ]` 变为 `- [x]`；
- 任务文本、缩进、顺序及其他文件/行均未改变；
- source identity 与 Candidate evidence 一致，target identity 在勾选后立即捕获；
- Project policy 明确定义该 transition。

任何条件无法证明都归类为 `implementation-changed`。不采用“按路径或扩展名放行”的宽松方案。

### 3. session-only transition evidence

本次不引入新落盘 schema。consumer 可在当前会话保留结构化 transition evidence，并标记 `evidenceRetention: session-only`。会话证据丢失、重新进入任务或无法还原动作来源时不得仅凭最终 diff 推断，必须重跑 Candidate。

未来若重复跨会话恢复成为实际需求，可另行定义 versioned persisted receipt；不在本 change 中提前扩展数据模型。

### 4. OpenSpec apply 通过 Buildr sidebar 协调时序

Buildr sidebar 指导：完成最终 Candidate 后先捕获 evidence，再立即只勾选对应任务并捕获 transition。外部 OpenSpec apply 仍负责普通任务完成标记，不承载 Buildr verification policy。

## Risks / Trade-offs

- [Risk] Agent 把其他 tasks 编辑误判为元数据 → 通过唯一 diff、精确 marker、source identity 和 Project allowlist 全部必需来 fail closed。
- [Risk] Candidate 没有直接验证树 B → 最终报告明确证据组合，禁止声称 Candidate 覆盖 B。
- [Risk] session-only evidence 在上下文丢失后不可恢复 → 将证据缺失明确归类为必须重跑，不从 diff 倒推动作来源。
- [Risk] 文本政策与测试漂移 → fixture 同时覆盖允许路径、额外编辑、任务歧义和跨会话缺证据路径。

## Migration Plan

1. 更新 Product policy、Buildr-owned Skills 与 OpenSpec sidebar。
2. 更新 fixtures、contract tests 与文档。
3. 运行 affected verification 和完整 Candidate。
4. 变更仅为指导与契约收紧，无数据迁移；回滚可恢复旧文本与 fixture。

## Open Questions

None.
