## Why

Buildr 当前把任务验证协议分散在 `task-triage`、`task-worktree` 和 `task-finish` 中：worktree lifecycle contract 不承诺验证结果，Task Finish 却需要可信验证证据才能安全继续，导致“由谁决定验证、如何绑定候选、如何报告验证耗时”缺少可替换的稳定责任边界。现在需要把验证从 worktree 生命周期中解耦，让有无 worktree 的实现任务都能生成一致、可消费、可审计的验证证据。

## What Changes

- 新增 `buildr.task-verification/v1` capability contract 和默认 `task-verification` workspace Skill，负责解析当前 workspace 或 Project 的验证政策，按最小反馈、受影响范围、最终候选三个级别执行验证，并返回绑定候选身份的标准结果与 wall-clock 耗时证据。
- 保留 `buildr.task-worktree-lifecycle/v1`，将 `task-worktree` 收紧为 checkout placement、retention、cleanup 和 tree identity provider，不再拥有通用验证编排与报告政策。
- 让 `task-finish` required 依赖任务验证能力；已有证据可信时复用，缺失、级别不足或候选变化时调用 selected verification provider，并统一报告验证范围、状态、总耗时、最慢检查、失败或跳过项和证据来源。
- 调整 `task-triage`、产品入口路由、产品说明、随包 manifest/runtime 资产和验证契约，确保新入口可发现、默认 binding ready、替换 provider 后 consumers 仍可组合。
- 明确耗时由验证执行层测量：优先消费 verifier 自身 summary，否则由 provider 使用进程外 wall-clock 测量；并行步骤不得通过相加推算整体耗时。
- 明确验证既可由用户直接意图触发，也必须在 Agent 准备声称实现完成或收尾 consumer 需要 Candidate evidence 时自动触发；binding 选择 provider，不替代 runtime 意图发现。
- 为落盘 evidence 增加保留与清理生命周期：临时证据在消费者使用完毕前保留，由 verification provider 安全清理；长期审计证据必须使用调用方管理的稳定位置，不能把系统临时目录当作长期引用。
- 将 verification provider 交互明确分为 `inspect`、`execute` 和 `cleanup`，并把收尾后的 tree transition 分类为 `same-content`、`closeout-metadata-only` 和 `implementation-changed`；已有 Candidate 进入收尾时，前两类不得再次启动 Candidate executor。
- 不改变 `buildr.task-worktree-lifecycle/v1` 的 contract identity、授权与清理保证，不把 Buildr Product 的 `test:candidate` 固化为所有 workspace 的通用命令。

## Capabilities

### New Capabilities

- `task-verification`: 定义任务验证政策解析、三级执行、候选身份绑定、耗时测量、证据有效性和面向消费者的结果契约。

### Modified Capabilities

- `agent-task-workflows`: 将通用验证职责从 task-worktree 生命周期移交给独立验证 provider，并让 Task Finish 消费该能力。
- `product-agent-skills`: 增加任务验证意图的 capability 路由、runtime 发现与替换边界。
- `buildr-package-assets`: 将新 contract、默认 Skill、binding、consumer dependency 和防回退验证纳入随包边界。

## Impact

- 受影响的随包资产包括 workspace Skills manifest、package manifest/bootstrap、`task-triage`、`task-worktree`、`task-finish`、产品入口 Buildr Skill、相关 capability contract 和新增 `task-verification` Skill。
- 受影响的产品事实包括任务工作流、产品 Agent Skills、随包资产和产品文档。
- 需要扩展 package、architecture、capability/runtime 和任务工作流契约测试，并验证七个 supported runtime 的投射与 doctor capability graph。
- 需要增加收尾组合场景 fixture，直接断言已有可信 Candidate 时 `taskVerificationExecuteCalls` 与 `candidateExecutorCalls` 均为 0，只有实现内容变化时才为 1。
- 新默认 provider 是新增能力；现有 worktree lifecycle contract 保持兼容，不包含破坏性升级。
