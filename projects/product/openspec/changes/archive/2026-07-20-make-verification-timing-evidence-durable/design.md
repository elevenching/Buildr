## Context

Candidate 目前通过 `candidate.mjs` 记录 `totalDurationMs` 和 step timing，但默认写入系统临时目录中的固定文件名，diagnostics 也使用固定目录；不同 worktree 或并发 run 会互相覆盖。reporter 只向终端打印 summary 路径，与 canonical spec 要求的人类可见总耗时不一致。Changed verification 复用相同 DAG executor，却没有 summary writer，并在结束时删除 diagnostics。`task-finish` 只要求“可信验证结果”，没有明确消费 timing evidence，因此 Agent 容易只报告通过/失败。

本 change 同时修改验证框架与 builtin `task-finish` provider，但不改变 `buildr.task-finish/v1` 的授权、副作用或 provider 协作边界；timing 属于其现有 Result Evidence 的细化。

## Goals / Non-Goals

**Goals:**

- 每次 Candidate/Changed run 默认获得互不覆盖的 summary 与 diagnostics 路径。
- summary 能证明运行类型、来源 worktree、Git HEAD 和包含未提交内容的候选 fingerprint。
- 人类输出直接显示整体耗时、预算状态、最慢阶段、失败阶段和 summary 路径。
- Changed 与 Candidate 复用同一 summary schema 和 formatter。
- `task-finish` 必须读取、核对并报告最终完整验证 timing evidence。

**Non-Goals:**

- 不把 timing 超预算改成阻塞性失败。
- 不长期提交本机 timing/diagnostics，也不建立 Buildr workspace 新资产类型。
- 不让 Changed 取代 Candidate，也不要求普通非 Buildr 项目采用本框架。
- 不修改 Git integration、worktree cleanup 或 OpenSpec archive 的授权策略。

## Decisions

### 1. 默认使用 run-scoped evidence directory

Candidate 和 Changed 分别在系统临时目录下通过 `mkdtemp` 创建 `buildr-<kind>-evidence-*`，其中保存 `timing.json` 与 `diagnostics/`。执行制品继续放在单独的短生命周期 execution root 并在结束时清理。这样默认运行不会共享可写路径，summary 与 diagnostics 具有相同生命周期和归属。

显式 `BUILDR_TIMING_OUTPUT` 与 `BUILDR_DIAGNOSTICS_OUTPUT` 继续生效，CI 或调用方对显式路径的唯一性负责。相比维护一个可变 `latest` 文件，本设计直接输出本次绝对路径，避免重新引入覆盖事实源。

### 2. 抽取共享 timing evidence 模块

新增 `timing/evidence.mjs`，负责：创建 evidence paths、生成 source identity、构造/写入 `buildr.verification-timing/v1`、计算最慢和失败阶段、输出人类摘要。Candidate、Changed 与现有 `report.mjs` CLI 复用该模块，避免三套格式漂移。

### 3. source identity 使用候选 fingerprint

summary 增加兼容字段：

- `run`: run id、kind、startedAt、finishedAt；
- `source`: repositoryRoot、productRoot、branch、HEAD、dirty 和 `candidateFingerprint`。

fingerprint 对 HEAD、相对 Product root、tracked diff、未跟踪文件路径/类型/内容做 SHA-256。它不修改真实 index，也不承诺等于 Git tree object id，但能区分同一 HEAD 上不同 worktree 候选并检测 summary 被覆盖或误用。显式记录算法版本，后续可演进。

### 4. 人类摘要保持紧凑

每个 step 的既有耗时输出保留；run 结束额外输出四项：total/budget、slowest、failed（成功为 none）和 summary 绝对路径。毫秒保留在 JSON，人类输出格式化为秒，避免长 JSON 淹没终端。

### 5. Task Finish 消费最终 Candidate summary

`task-finish` 在冻结候选完成完整验证后，必须从该命令输出解析 summary 路径并读取 JSON；核对 status、run kind、source identity 与当前 worktree/候选证据，最终报告总耗时、最慢阶段、失败阶段和路径。summary 缺失、不可读、被覆盖或归属不一致时，如实标记 timing evidence 不可信，并在仍可重跑时重新执行最终验证；不得引用其他 run 或凭 step 输出推算并行 wall-clock。

Changed timing 可以用于实现阶段反馈，但不能替代最终 Candidate timing。

## Risks / Trade-offs

- [临时目录会累积 evidence] → 每次只保留文本 summary 与 diagnostics，候选 tarball 等执行制品仍删除；文档说明系统临时目录负责生命周期管理。
- [fingerprint 读取未跟踪文件增加少量开销] → 只处理 Git 未忽略文件，验证本身远重于该哈希；异常时 fail closed，不生成无归属 summary。
- [显式环境变量仍可能被调用方复用] → summary 记录 run/source identity，`task-finish` 必须核对；默认路径保证唯一。
- [Skill 与实现可能不同步] → package contract tests 同时验证 timing 消费步骤和最终报告字段，Candidate 覆盖 package/runtime 投射。
