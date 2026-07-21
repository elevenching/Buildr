---
name: task-verification
description: 用户要求测试、验证或耗时报告，或者实现型任务到达验证节点、Agent 准备判断或声称开发完成、Task Finish 需要核对或补齐 Candidate evidence 时使用；用户无需主动点名本 Skill。
---

# Task Verification Skill

本 Skill 是 `buildr.task-verification/v1` 的默认 provider。它负责发现当前 workspace 或 Project 已定义的验证政策，执行适合当前任务阶段的验证，把结果绑定到候选身份，测量验证自身的 wall-clock，并向直接调用者或 finish consumer 返回统一证据。它不拥有 task worktree placement、Git integration、部署或业务验收 policy。

本 Skill 不是只在用户主动说“验证”时使用：用户直接要求测试、检查或耗时报告时由 runtime description 发现；实现型任务到达验证节点或 Agent 准备声称完成时，由适用 Rule 的完成边界触发；Task Finish 需要 Candidate evidence 时通过 capability binding 调用 selected provider。binding 只选择实现，不替代首次意图发现。

## 1. 确认输入与政策 authority

执行前确认：

- 任务范围、当前 workspace、实际仓库或非 Git 工作边界，以及明确的 Project context。
- operation：`inspect` 只核对已有 evidence，`execute` 才运行验证命令，`cleanup` 只处理 evidence 生命周期。不得因为 consumer 调用 provider 就默认选择 `execute`。
- 请求的验证级别：`minimal`、`affected` 或 `candidate`；用户只说“验证”时根据任务阶段选择最低充分级别，不默认把局部工作升级为完整候选门禁。
- 当前候选 identity 和已有验证 evidence。Git 候选优先记录 repository root、tree 或包含未提交内容的稳定 fingerprint；非 Git 候选记录当前工具可证明的 snapshot identity。无法建立可比较 identity 时，将 evidence 标记为不可跨状态复用。
- 按 authority 顺序读取当前 scope 的 Rules/AGENTS、明确 Project capability/context、OpenSpec change/tasks、项目开发或发布文档、公开脚本与帮助。只读取任务相关范围，不按技术栈或文件名猜测命令。

具体命令由当前 workspace 或 Project 定义。不得把 Buildr Product 的 package check、临时 workspace E2E、`npm run test:candidate` 或 timing schema 固定为其他项目的默认入口。

找不到适用 Candidate policy 时返回 `status: incomplete`，说明缺失的政策、入口或候选 identity；不得把 `minimal` 或 `affected` 结果表述为完整验证。

## 2. 分层验证协议

### Minimal

单个普通实现任务完成后，只运行语法、类型、静态检查或与该任务直接相关的小范围测试。安全边界、不可逆迁移或用户明确要求的即时检查不受默认批量节奏限制。

### Affected

共享实现区域、验证入口或失败影响面的任务组完成后，集中运行一次受影响范围验证。同一候选状态下，只有能证明上层入口覆盖底层检查时才去重；无法证明覆盖关系时保留必要检查。

### Candidate

全部实现、自然语言资产、生成资产同步和 review 修订完成后冻结候选，再运行项目要求的完整验证。只有 `level: candidate`、`status: passed`、candidate identity 匹配且 evidence 可复用时，才能把结果作为实现完整验证或 Task Finish 的完成证据。

完整验证失败后退出候选冻结状态。修复期间优先重跑失败项与受影响检查；候选重新稳定后再执行一次新的 Candidate 验证。

## 3. 执行与 wall-clock

每次验证作为一次 execution 记录真实整体 wall-clock：

- 只有 operation 为 `execute` 时启动验证命令。`inspect` 和 `cleanup` 的 `taskVerificationExecuteCalls`、`candidateExecutorCalls` 必须为 `0`，其自身核对/清理耗时不得冒充验证耗时。

1. 验证入口输出可信 summary 时，核对 status、验证级别或 run kind、source/candidate identity 和 summary 归属；使用其整体耗时并标记 `timingSource: verifier-reported`，保留绝对 summary path 或等价 reference。
2. 普通命令没有 summary 时，从启动验证进程前到该进程退出后使用单调时钟测量，标记 `timingSource: wrapper-measured`。只报告实际可测的整体与单命令耗时，不声称不存在的逐阶段数据。
3. 并行执行时不得把各检查 `durationMs` 相加推算 `totalDurationMs`；总耗时必须来自整体 execution 的 wall-clock。
4. 工具返回 session、cell、process id 或运行中状态时，继续 wait、poll 或 resume 同一进程；暂时无输出不得启动第二个相同验证。

验证命令需要修改外部系统、部署环境、持久业务数据或共享状态时，停止并取得该具体副作用的授权。构建产物和项目政策明确允许的本地测试临时文件仍属于常规验证效果。

## 4. Candidate evidence 有效性

- evidence 必须记录验证时的候选 identity、dirty/snapshot 状态和 policy sources。
- commit、checkout、分支名或 push 变化但候选内容等价时，可以复用 evidence。
- rebase 冲突解决、后续编辑、生成资产更新或其他内容变化后，旧 evidence 失效。
- Project policy 可以把同一会话内、刚成功的最终 Candidate 任务唯一 `- [ ]` → `- [x]` 变化定义为 `verification-result-metadata-only`。此时 Candidate evidence 仍绑定 source implementation identity；consumer 只能组合独立的 source/target identity、change/task identity 和精确 marker transition，不得改写 `candidateIdentity` 或声称 Candidate 直接验证 target delivery tree。
- 上述 transition evidence 没有 versioned 持久化 receipt 时标记为 `session-only`。存在额外内容变化、任务歧义、source identity 不匹配或跨会话证据缺失时，不得从路径、文件类型或最终 checkbox 状态反推可复用性。
- provider 无法证明当前候选与 evidence 等价时，必须标记 `reusable: false` 并重新验证或返回 incomplete。
- 不引用其他 worktree、其他 run、被覆盖 summary 或无法匹配 source identity 的耗时。

## 5. Result Evidence

向 consumer 返回以下字段；没有独立 summary 文件时可以作为当前会话结构化证据返回，不要求为所有项目创建新文件：

```text
level: minimal | affected | candidate
status: passed | failed | incomplete
policySources: <实际采用的规则、Project 或文档>
candidateIdentity: <repository/snapshot 与 tree/fingerprint>
checks: <名称、命令摘要、状态、exitCode、durationMs>
totalDurationMs: <真实整体 wall-clock>
timingSource: verifier-reported | wrapper-measured
slowestCheck: <名称与 durationMs，未知时明确 unknown>
failedChecks: <失败项，成功时 none>
skippedChecks: <跳过项与原因，未跳过时 none>
reusable: true | false
operation: inspect | execute | cleanup
taskVerificationExecuteCalls: <本次启动验证 execution 的次数>
candidateExecutorCalls: <本次启动 Candidate executor 的次数>
evidenceReference: <summary 绝对路径或当前会话 evidence>
evidenceRetention: transient | caller-managed | session-only
cleanupAfter: consumer-finished | caller-policy | not-applicable
cleanupStatus: retained | cleaned | not-applicable
cleanupReference: <仅 transient 落盘 evidence 的精确、安全清理引用>
verificationResultMetadataTransition: <可选；subtype、source/target identity、change/task identity、精确 old/new marker 与 session-only retention>
```

必要检查失败时保留实际退出状态、已完成检查和耗时，停止把任务描述为验证完成。只有较低级别验证时，明确 Candidate 尚未执行。

## 6. Evidence 保留与清理

- verifier 在系统临时目录创建 summary/diagnostics 时标记 `evidenceRetention: transient`。系统临时目录不是长期存储；provider 必须返回精确 `cleanupReference`，但在当前有效 Candidate evidence 仍可能被 Task Finish 或其他 consumer 使用时保持 `cleanupStatus: retained`。
- 调用方显式指定稳定输出路径或 CI 上传 artifact 时标记 `caller-managed`；provider 不擅自删除，也不把该路径纳入默认任务清理。
- 只有当前验证摘要已经进入用户报告或 consumer evidence、没有后续 consumer，且 cleanup reference 可证明属于 provider 创建的单次 transient run 时才清理。删除必须针对精确 run 目录，禁止使用未解析变量、glob、workspace root 或系统临时目录根。
- 新 Candidate evidence 核对通过后，可以清理同一任务中已被替代且不再被引用的旧成功 transient run；失败 evidence 保留到诊断结束或被新 evidence 替代。
- Task Finish 在捕获最终摘要、完成集成与推送并确认没有后续 consumer 后，请求 selected provider 清理 transient evidence。清理失败不回滚已完成交付，返回 `cleanupStatus: retained`、实际路径和原因。
- transient evidence 清理后，最终报告保留已捕获的状态、候选、范围、耗时和失败/跳过摘要，并说明 `cleanupStatus: cleaned`；不得继续把已删除路径表述为长期可访问证据。`task-worktree` 不负责这项清理。

## 7. 面向用户报告

直接验证或实现准备完成时，报告至少包含：

```text
验证：通过 / 失败 / 不完整
候选：<identity>
范围：minimal / affected / candidate
检查：<通过数/总数；failed；skipped>
耗时：<整体 wall-clock；timing source；最慢检查及耗时>
证据：<reference>
证据生命周期：<retention；cleanup status；仍保留时的精确 reference>
```

`status: passed` 但 `level` 低于 `candidate` 时，必须追加“最终候选验证尚未执行”。不得只说“测试通过”，也不得把任务总耗时、排队时间或人工等待混入验证自身耗时。

## Guardrails

- 不替 workspace 或 Project 发明验证命令、覆盖关系、预算或通过阈值。
- 不依赖 `task-worktree`、`git-ops` 或任何固定 provider id；有 worktree 时只消费调用方提供的候选边界与 identity。
- 不把测试通过等同于业务验收、上线、归档、提交、推送或清理授权。
- 不重复启动仍在运行的验证，不相加并行步骤推算整体耗时。
- 不把 provider 的 `inspect`、`cleanup` 或 summary verifier 调用表述为重新执行验证；已有可信 Candidate 进入收尾时不得仅因 consumer 调用而启动 Candidate executor。
- 不在候选变化后沿用旧 evidence；唯一例外是 Project 明确定义且证据完整的 `verification-result-metadata-only` consumer composition，原 Candidate identity 仍保持不变。不把 lower-level evidence 报告为 Candidate。
