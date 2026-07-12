## Context

现有 Core 要求表达简练，但没有要求 Agent 在阶段完成或阻塞时主动说明流程如何继续。

## Goals / Non-Goals

**Goals:**

- 让用户知道当前事项最合适的下一步。
- 让下一步依据当前状态和已有工作约定，而不是通用套话。

**Non-Goals:**

- 不在 Core 中重复各 Skill 的具体流程。
- 不要求任务结束后继续推荐无关工作。

## Decisions

Core 只规定通用行为：结合当前状态、适用 Rule、Skill 和项目约定说明下一步。具体命令和流程继续由对应 Skill 提供。

## Risks / Trade-offs

- Agent 可能机械追加建议 → 明确任务完整结束时只说明完成，不追加无关建议。
