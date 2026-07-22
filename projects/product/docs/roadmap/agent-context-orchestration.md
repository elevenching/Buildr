# Agent 自编排与上下文接续

> Roadmap：尚未实现。重要性：t0。紧急性：t1。本文只记录产品方向，不是当前能力或实施契约。上位边界以 [Agent 时代的工作基础设施](agent-work-infrastructure.md) 为准。

## 目标

Buildr 为 Agent 提供可查询、可治理、可跨会话和跨 Agent 接续的工作资产与共享任务状态；Agent 根据当前目标选择 Workspace、检索相关内容、动态加载能力，并自行规划和编排工作。

核心模型：

```text
用户目标
+ 多个 Workspace 中的工作事实
+ 适用 Rules / Skills / Commands / Tools
+ 当前 Task State
→ Agent 形成任务上下文
→ Agent 拆解、编排和执行
→ 值得接续的状态与证据写回 Buildr
```

Buildr 不拥有 Agent 的 context window，不生成通用执行计划，也不维护固定岗位 Agent 路由。

## Agent 没有固定职业身份

Agent 的专业身份由当前任务加载的能力形成，而不是预先创建永久的产品、前端、后端、测试或运营 Agent：

```text
Task A + 产品事实 + 产品 Skill → 当前表现为产品能力
Task B + 代码事实 + 开发 Skill → 当前表现为开发能力
Task C + 验证规则 + 测试 Skill → 当前表现为测试能力
```

同一个 Agent 可以在一个端到端任务中连续切换这些能力。岗位名称可以作为人类可读视图或能力模板，但不成为 runtime identity、权限路由或固定团队结构。

执行审计仍可记录实际 Agent runtime、模型、会话和 Run identity；它与职业身份是不同概念。

## Agent 负责语义编排

未来 Agent 可以自行：

- 从目标和事实中提出 Task DAG。
- 判断节点依赖、并行机会和冲突风险。
- 为每个节点选择 Workspace、Rules、Skills、Commands 和 Tools。
- 创建 subagent 或选择其他可用 Agent runtime。
- 在失败后重新规划。
- 聚合结果、处理冲突并决定是否达到完成条件。

Buildr 不替 Agent 生成 DAG、分配角色或选择能力。Buildr 可以持久化 Agent 已接受、需要跨会话接续或需要人审阅的 DAG、Decision、Risk 和 Evidence，并为人提供可读投影。

## Buildr 提供的支撑

### 1. 多 Workspace 查询

- 提供 Enterprise 与 Workspace catalog、稳定 identity 和访问边界。
- 提供工作资产、Source 和关系的查询接口。
- 允许 Agent 根据任务跨 Workspace 检索，不维护固定业务路由表。

### 2. 动态能力资产

- 以 Rules 提供价值、边界和约束。
- 以 Skills 提供可复用专业动作和完成标准。
- 以 Commands、Tools、Packages 或 capability contracts 提供可发现执行能力。
- 保持资产 source authority、版本、integrity、scope 和 runtime 投射。

Agent 根据 description、任务语义和实际范围选择能力；Buildr 不预先拼装固定角色包。

### 3. 可接续 Task State

只保存下一个 Agent 或下一个会话需要继续使用的内容：

- 目标与完成标准。
- 已接受的 Task DAG 与依赖。
- Decision、原因、排除方案和人工覆盖。
- 风险、阻塞和未决问题。
- 产物引用、验证结果和 Evidence。
- 本任务已确认涉及的 Workspace 与工作资产引用。

不保存隐藏推理、完整 context window 或所有 Tool 日志。

### 4. 上下文来源与回溯

- 让 Agent 能按需回到原始 Specs、代码、外部文档和验证证据。
- 为跨节点、跨 Workspace 和跨 Agent 的引用保留来源。
- 避免只传摘要导致失真，也避免复制完整对话造成噪声和锁定。

## Execution Run 不等于工作任务

```text
WorkTask                       ExecutionRun
────────                       ────────────
目标、约束、Decision           Agent/runtime/机器
依赖、Task State、Evidence     queue/running/failed
需要跨 Agent 接续              lease/heartbeat/timeout
Buildr 提供持久化和治理         runtime/provider 负责执行
```

同一 WorkTask 可以由多个 Agent、多个会话或多次 Run 推进。queue、claim、lease、timeout、retry、cancel 和并发限制属于确定性执行设施，可由 Agent runtime、OpenHands、Multica 或其他 provider 提供。

只有真实异步、多机器或无人值守需求出现后，才评估独立 Execution Run provider；不在 Buildr core 中预建通用 Scheduler。

## 需要验证的问题

1. Agent 能否仅依靠 catalog、资产查询和 Task State，在不同 runtime 之间恢复同一任务。
2. Agent 如何动态选择多个 Workspace，并在权限不足或来源冲突时请求人判断。
3. Rules、Skills、Commands 和 capability contracts 是否足以表达动态专业能力，不需要固定岗位 Agent。
4. 多父节点合流时，Agent 如何保留来源、去重并处理冲突。
5. 哪些 Task State 值得持久化，哪些应停留在单次 Run。
6. Agent 自编排与外部 Execution Run provider 如何保持清晰协议和可替换性。
7. 飞书、Agent 原生界面和 Buildr 界面发起的任务能否使用同一套资产与接续状态。

## 首要探索顺序

1. 定义 Enterprise、Workspace、Source 与工作资产查询契约。
2. 定义最小可接续 Task State，不包含完整对话和隐藏推理。
3. 验证 Agent 根据任务跨 Workspace 检索，并动态加载 Rules 与 Skills。
4. 验证同一任务从一个 Agent runtime 切换到另一个 runtime 后继续工作。
5. 验证 Agent 自行提出和维护 Task DAG，人可以审阅与覆盖。
6. 在真实需求出现后，对接一个可替换 Execution Run provider，验证 queue、cancel、resume 和 evidence 关联。
7. 基于结果再评估更广泛的多 Agent 并发，而不是先建设固定角色团队和调度中心。
