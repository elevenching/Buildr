## Context

当前规范和 `task-worktree` 已要求实现型 change 在 propose 前创建 worktree，但触发顺序没有在两个实际入口闭环：`task-triage` 只输出语义路径，用户直接要求创建 change 时则可能直接命中上游 `openspec-propose`。Buildr 不能修改外部 OpenSpec Skill 正文，因此需要通过随包 Skill 源和 Component contribution 补齐正常路由与直接入口兜底。

## Goals / Non-Goals

**Goals:**

- 让 `task-triage` 同时输出语义路径和执行位置判断。
- 让实现型 `change-flow` 在任何 artifact 写入前先完成 canonical worktree 创建或复用。
- 让直接命中的 `openspec-propose` 也执行相同的写入前门禁。
- 保持纯元内容任务无需机械创建 worktree，并保留任务升级后的安全迁移路径。
- 用静态检查和组合场景验证防止路由再次退化。

**Non-Goals:**

- 不把 change 与 worktree 建模为一一绑定关系。
- 不改变 `buildr worktree create` CLI 或 worktree lifecycle contract。
- 不新增 capability contract，不让 `task-triage` 无条件 requires worktree capability。
- 不修改上游 `openspec-propose` Skill 正文。

## Decisions

### 1. 语义路径和执行位置分开判断

`task-triage` 先选择 `code-only`、`spec-maintenance`、`change-flow` 或暂停，再独立选择 `implementation`、`metadata-only` 或待确认。这样能够正确表达 `code-only + worktree`、`change-flow + worktree` 和 `change-flow + 当前 workspace` 等组合，避免把“需要 change”误写成“必然需要 worktree”。

替代方案是只在 `change-flow` 分支增加一句“创建 worktree”。该方案无法覆盖 code-only 实现任务，也会错误要求纯 proposal 建 worktree，因此不采用。

### 2. Task Triage 负责选择，Task Worktree 负责执行

当执行形态为 `implementation` 时，`task-triage` 输出创建或复用 worktree 的下一动作；如果同时选择 `change-flow`，必须等 worktree ready 后再进入 propose。`task-worktree` 继续负责 workspace、repository、task id、branch、start point、doctor/sync 和 lifecycle evidence，不判断业务语义。

这保持“语义分流—环境准备—专业动作”的既有职责分层，不复制 worktree 操作手册。

### 3. 通过 OpenSpec contribution 提供直接入口兜底

Buildr 在 `openspec-propose@prepend` contribution 中增加 artifact 写入前检查。预计进入代码、构建、测试或长期开发上下文时，先使用 `task-worktree`；明确为纯元内容时允许留在当前 workspace；无法判断时先澄清。门禁必须发生在上游步骤 `openspec new change` 之前。

替代方案是直接修改上游 Skill，但会破坏 Component 上游正文完整性和升级能力，因此不采用。

### 4. 不新增 capability dependency

现有 `buildr.task-worktree-lifecycle/v1` 已覆盖 checkout 创建与复用的稳定结果。缺口是条件式入口路由，而不是新执行能力。若让 `task-triage` 无条件 requires worktree capability，会让纯文档、spec-maintenance 和暂停判断在 provider 不可用时也被错误阻塞。

因此本次保持 manifest、contract 和 binding 不变，通过 Skill routing guidance 与组合验证收敛行为。

### 5. 双层验证保护路由

静态 package verifier 检查 `task-triage` 的执行形态/任务位置输出和 propose contribution 的写入前门禁；组合测试验证安装后的 runtime 同时包含正常路由与直接 propose 兜底，并确认上游 Skill 正文未被改写。

## Risks / Trade-offs

- [Risk] guidance 依赖 Agent 判断执行形态，无法像 CLI schema 一样完全机械强制 → 使用正常入口与直接入口双门禁，并用可验证的输出字段减少遗漏。
- [Risk] `metadata-only` 被过度使用以绕开 worktree → 明确只要预计进入代码、构建、测试或长期上下文就属于 `implementation`，不按文件扩展名猜测。
- [Risk] OpenSpec Component 未安装时不存在 propose 兜底 → `task-triage` 仍提供正常路由；直接 OpenSpec 集成增强属于 Component 生命周期边界，不提升为全局 Core 逻辑。
- [Risk] 文案型静态断言过于脆弱 → 检查稳定语义片段和组合结果，不锁定整段文字。
