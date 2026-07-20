## Context

当前 `task-worktree` 同时承担 task checkout 生命周期和三级验证说明，但 `buildr.task-worktree-lifecycle/v1` 只保护 placement、retention、cleanup 与 `treeChanged` 证据。`task-finish` 在正文中自行发现项目验证命令、核对 Candidate timing summary 并报告耗时，manifest 却没有一个能提供验证最低保证的 required dependency。结果是验证政策、执行、候选绑定和最终披露没有独立 owner，也无法在不替换 worktree provider 的情况下替换验证方法。

这项变化横跨随包 contract、workspace Skills、runtime 路由、Task Finish 组合关系、产品文档和契约测试。它必须保持 Buildr 的 Agent-first 边界：Buildr 组织和投射可复用工作方法，不新增常驻执行器、Hook 或统一测试 DSL，也不替项目猜测测试命令。

## Goals / Non-Goals

**Goals:**

- 建立独立、可替换的 `buildr.task-verification/v1`，为直接验证意图和 Task Finish 提供稳定结果证据。
- 让 workspace 或 Project 继续拥有具体验证政策和命令，provider 只负责解析、选择、执行、计时和报告。
- 支持最小反馈、受影响范围、最终候选三级验证，并把完整完成声明限定在可信 Candidate 证据上。
- 让验证适用于有 worktree、当前分支、无 Git 和非代码候选，不把 checkout 机制写入验证 contract。
- 保留 `buildr.task-worktree-lifecycle/v1` 的现有 identity 和清理保证，收紧默认 `task-worktree` provider 的职责与入口。
- 统一验证结果的候选身份、状态、总 wall-clock、检查明细、最慢项、失败/跳过项和证据来源，使调用方不再自行估算。

**Non-Goals:**

- 不提供 Buildr CLI 的通用测试 runner，也不定义跨语言测试配置格式。
- 不把 Buildr Product 的 `npm run test:candidate`、timing schema 或预算固定为所有 workspace 的要求。
- 不改变 worktree placement、retention、cleanup 或 Git 集成 policy。
- 不让 `task-triage` 变成验证 executor，也不要求每个普通任务都运行完整候选门禁。
- 本 change 不扩大 `task-finish` 到无 worktree 的轻量提交/推送收尾场景。

## Decisions

### 1. 新建独立验证 contract，不扩张 worktree lifecycle contract

新增 `buildr.task-verification/v1`，默认由 `task-verification` Skill 提供。`task-finish` 将它声明为 required dependency；产品入口对明确验证、测试结果检查或开发完成验证报告意图路由到 selected provider。

选择独立 contract，是因为验证可在没有 worktree 时发生，也需要被 Task Finish 和未来发布/交付工作流独立替换。把它加入 `buildr.task-worktree-lifecycle/v1` 会把测试政策与 Git checkout 副作用耦合，并迫使单纯 worktree 清理依赖验证实现。

备选方案是只把验证段落留在 `task-worktree` 正文中。该方案不能为 `task-finish` 提供可诊断 dependency，也无法安全替换 provider，因此不采用。

### 2. 项目定义政策，验证 provider 负责执行与证据

`task-verification` 按以下 authority 顺序读取适用事实：当前 scope 的 Rules/AGENTS、明确 Project context、OpenSpec change/tasks、项目开发或发布文档、项目公开脚本/帮助。它不得根据技术栈名称猜测命令，也不得把 Buildr Product 的入口外推到其他 workspace。

provider 接收任务范围、目标验证级别、候选边界和已有证据，选择 `minimal`、`affected` 或 `candidate`。没有可确认的 Candidate policy 时返回 `incomplete` 与缺口，而不是把较低级别结果提升为完整验证。

备选方案是把具体验证矩阵写入 contract。那会让 contract 变成跨项目测试 DSL，违背 provider 可替换和 Project authority，因此不采用。

### 3. 定义最小验证结果证据，而不要求所有项目生成文件

Result Evidence 至少包含：验证级别与状态、policy sources、候选 identity、检查名称/命令摘要/状态/退出码/耗时、真实总 wall-clock、timing source、最慢检查、失败与跳过项、可用时的 summary path。候选 identity 使用当前环境可证明的最强稳定身份；Git 候选优先 tree/fingerprint，无 Git 候选使用 provider 明确记录的 snapshot identity。无法建立足够身份时不得声称证据可复用。

contract 不要求所有项目落盘统一 JSON。已有 verifier summary 时 provider 必须消费并核对；没有时允许返回结构化会话证据。这样既能组合 Task Finish，又不为普通仓库引入新文件协议。

### 4. 总耗时取单次执行 wall-clock，并标注来源

验证命令能提供可信 summary 时使用 `verifier-reported`；否则 provider 从启动验证进程前到进程退出后使用单调时钟测量，标记为 `wrapper-measured`。并行步骤不得相加推算总耗时；进程返回 session/cell/process id 时必须等待同一执行，不得重复启动。

Task Finish 继续对 Buildr Product 的 `buildr.verification-timing/v1` 做专项 fail-closed 核对，但这成为项目特化消费逻辑，不进入通用 contract。

### 5. 用户报告由执行验证的 provider 产出，消费者可复用

直接完成开发或用户明确要求验证时，`task-verification` 报告状态、候选、级别、检查通过/失败/跳过、总耗时、最慢检查和证据来源。`task-finish` 复用相同证据并加入归档、Git、doctor 和 cleanup 状态；若 evidence 缺失、级别不足、身份不匹配或候选变化，则调用 selected provider 重新验证。

Rule 只保留“没有最终候选可信证据不得宣称实现完成、必须如实披露验证状态”的完成边界；三级流程、命令选择、计时和字段留在 Skill/contract。

### 6. 保留 worktree lifecycle，并消除入口歧义

`task-worktree` 继续提供 `buildr.task-worktree-lifecycle/v1`，正文保留候选 tree identity 与验证证据失效的交接边界，但移除三级验证执行、命令覆盖判断和用户验证报告。它的 description 收紧到创建、定位、保留、迁移入口和清理 task worktree。

`task-verification` description 覆盖运行测试、验证改动、判断开发能否完成以及报告验证耗时。产品入口路由表增加该 capability；binding 只选择 provider，不替代 runtime description 的首次发现。

### 7. 验证自动触发与 evidence 生命周期分别闭环

`task-verification` 既是可直接发现的顶层 provider，也是 `task-finish` 的 required dependency。用户明确要求测试、验证或耗时报告时由 description 直接发现；实现型任务到达验证节点、Agent 准备声称实现完成时，由 Core 完成不变量与 provider description 共同触发；用户要求收尾时由 `task-finish` 解析 binding 后调用 selected provider。用户不需要主动说出 Skill 或 capability 名称。

落盘 evidence 必须标明 `evidenceRetention`、`cleanupAfter`、`cleanupStatus` 和可用时的 `cleanupReference`。默认系统临时目录证据是 `transient`：当前有效 Candidate evidence 在后续 consumer 使用前保留，新证据核对通过后可清理被替代的旧成功 run；`task-finish` 在验证摘要已进入最终报告、集成与推送完成且没有后续 consumer 后，请求 verification provider 清理。失败证据在诊断结束或被新证据替代前保留。显式输出路径或 CI artifact 是 `caller-managed`，provider 不擅自删除。

清理由产生 evidence 的 verification provider 实现，并且必须校验精确 run 目录和 ownership；`task-finish` 只决定消费完成时点，`task-worktree-lifecycle` 不拥有与 checkout 无关的临时证据。清理失败不回滚已经完成的交付，但最终报告必须披露保留路径与原因。完成报告在清理 transient evidence 后报告已捕获的摘要字段与 `cleanupStatus`，不得把已删除的临时路径表述为长期可访问引用。

### 8. 收尾按 transition class 去重验证执行

provider 交互分为三种 operation：`inspect` 只核对已有 evidence 与候选身份，`execute` 才启动验证命令，`cleanup` 只处理已消费 evidence。Task Finish 加载或调用 selected provider 不等于再次执行验证；最终报告和组合测试必须分别记录 provider operation 与 executor invocation count。

Task Finish 在实现完成验证时冻结 `implementationCandidateIdentity`，并在收尾提交前记录 `deliveryTreeIdentity` 与两者之间的可归因 delta：

- `same-content`：commit、checkout、parent、branch、push 或其他容器变化不改变已验证内容。只执行 `inspect` 并复用 evidence，`taskVerificationExecuteCalls: 0`、`candidateExecutorCalls: 0`。
- `closeout-metadata-only`：差异完全来自 Task Finish 已授权且可归因的 OpenSpec sync/archive、归档格式规范或同类 Project 明确定义的 closeout-only artifacts。保留 implementation Candidate evidence，另行运行该工作流已经要求的 focused checks；不得调用 task-verification `execute`，两项 executor count 仍为 0。最终报告同时说明 implementation Candidate 与 closeout delta checks，不能声称原 Candidate 覆盖归档后的 delivery tree。
- `implementation-changed`：rebase 冲突解决、生成资产更新、代码/配置/运行时资产或任何无法完全归因于 closeout-only scope 的差异。原 evidence 失效，调用 selected provider `execute` 生成新 Candidate，成功后 count 为 1；不能降级成只跑 focused checks。

分类必须基于动作来源、变更范围和 Project policy 的组合证据，不能只按文件扩展名、目录名或“看起来像文档”猜测。无法证明 `closeout-metadata-only` 时 fail closed 为 `implementation-changed`。Task Finish 的 OpenSpec strict、contract guard 和 `git diff --check` 属于 closeout workflow checks，不计作 task-verification Candidate executor invocation。

## Risks / Trade-offs

- [风险] 新 required dependency 可能让旧 workspace 的 `task-finish` 在只同步部分资产时 blocked。→ 通过 package manifest 原子交付 contract、provider、binding 和 consumer declaration，并用 doctor/package E2E 验证升级后 ready。
- [风险] `task-worktree` 与 `task-verification` description 仍可能同时命中“运行测试”。→ 从 worktree description 删除构建/测试意图，并增加 runtime inventory/contract 测试检查边界。
- [风险] 普通项目没有结构化 timing summary。→ 允许 provider 使用单调时钟做 wrapper measurement，并明确证据来源，不伪造逐阶段数据。
- [风险] 无 Git 候选的 snapshot identity 缺少统一算法。→ v1 只要求 provider 记录可证明且可比较的身份；无法证明时 evidence 不可复用，不在本 change 新建通用 fingerprint CLI。
- [风险] 临时 evidence 若立即删除，Task Finish 无法复用；若永不删除，会在系统临时目录无界累积。→ provider 显式返回生命周期，当前有效 Candidate 保留到 consumer 完成，被替代和收尾后的 transient run 由 provider 清理。
- [风险] description 只写“用户要求”会把自动完成验证误解为手动工具。→ description 同时覆盖 Agent 到达验证节点、准备完成声明和 consumer 调用，Core Rule 保留不可绕过的完成边界。
- [风险] OpenSpec archive 改变 Git tree，通用 `treeChanged` 规则可能让 Agent 保守重复 Candidate。→ 冻结 implementation identity、单独记录 delivery tree 和可归因 closeout delta；前两类 transition 明确禁止 verification execute，无法证明元数据边界时才重验。
- [取舍] `task-finish` 仍 required 依赖 worktree lifecycle，因此本 change 不解决无 worktree 完整收尾。→ 保持当前产品范围，避免把验证职责拆分和 Task Finish 入口扩张混成一个 change。

## Migration Plan

1. 新增 contract、默认 Skill、workspace/package manifest entries 和默认 binding，但保留现有 worktree provider 与 binding。
2. 将 `task-finish` 增加 required verification dependency，并在 provider 正文中改为消费/补齐标准证据。
3. 收紧 `task-worktree`，更新 `task-triage`、产品入口、产品说明和随包验证。
4. 验证 capability graph、七 runtime 投射、默认/替换/缺失 provider 场景和 Task Finish 组合行为。
5. 完整 sync 后由 doctor 验证新 graph ready；若激活出现结构错误，恢复旧 manifest/binding 整体候选，不留下半激活状态。

## Open Questions

无。v1 不要求统一落盘 schema，也不扩大 Task Finish 的 worktree 范围；这些边界已在本 change 中确定。
