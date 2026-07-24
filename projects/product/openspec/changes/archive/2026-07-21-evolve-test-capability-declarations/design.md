## Context

Buildr 已将 workspace 设为唯一 Skill source authority，Project `capabilities.yml` 只表达 Skill requirements、bindings 与 applicability，Service repo 则是 Project 管理的可执行资产。测试能力声明属于某个 Project 的长期工作事实：它既不是 Skill binding，也不应写入某个技术栈专用 Rule。因此本 change 在 Project 资产中增加独立、可选的 `verification.yml`，由通用 `task-verification` provider 读取并由 Agent 持续维护。

当前 provider 已有 `minimal`、`affected`、`candidate` 三级协议、Candidate identity 和 evidence 生命周期。新设计必须保持这些稳定协作保证，使 Task Finish 等 consumers 无需知道具体测试能力或团队分层。

## Goals / Non-Goals

**Goals:**

- 让任意团队声明任意测试能力集合，而不是让通用 Skill 内置鲜肉、Spring 或其他技术栈分层。
- 没有声明时完全保持旧发现和执行边界，不产生新的失败、阻塞或环境启动。
- 让 Agent 通过初始化、增量发现、试运行证据和团队确认持续推动测试能力成熟。
- 把成熟度、阶段适用性、阻断强度、环境、副作用和授权建模为彼此独立的事实。
- 让 Project doctor 对已存在声明做结构诊断，但不要求每个 Project 都创建声明。

**Non-Goals:**

- 不把 Buildr 做成 CI、测试运行器、覆盖率平台或环境编排平台。
- 不自动安装测试工具、保存凭证、启动未授权外部环境或修改 Service repo。
- 不从测试名称推断覆盖关系，不自动把新测试升级为 Candidate gate。
- 不改变 `buildr.task-verification/v1` 的 capability identity、默认 binding 或 Task Finish 的 evidence 消费方式。

## Decisions

### 1. 使用独立 Project `verification.yml`

声明路径固定为 `projects/<project>/verification.yml`，schema 为 `buildr.project-verification/v1`。一个 Project 文件可以通过 capability 的 `command.cwd`、`applicability.paths` 和 coverage 描述多个 Service 或跨 Service 测试。

拒绝把字段加入 `capabilities.yml`：后者的 authority 是 Skill requirements/bindings/applicability，把测试命令放入会混淆工作方法依赖与项目测试事实。也拒绝默认写进 Service repo，因为 Buildr 不拥有外部业务仓内容，且跨 Service Candidate 需要 Project 级视图。

### 2. 缺失、augment、authoritative 三种政策模式

- 文件缺失：`legacy`，provider 完全保持现有 AGENTS、POM、文档和公开入口发现。
- `mode: augment`：已确认声明参与编排，未声明范围继续由 legacy policy discovery 补充；这是初始化后的默认模式。
- `mode: authoritative`：团队明确声明该文件已经覆盖 Project 测试政策，Candidate 完整性只由适用且 required 的稳定声明决定；结构或门禁缺失时 fail closed。

`project create` 不生成空声明，doctor 也不因缺失报告 finding，以保证真正的零配置兼容。

### 3. 成熟度与门禁强度保持正交

每项能力使用：

- `maturity: discovered | trial | stable`
- `stages: [minimal | affected | candidate]`
- `enforcement.<stage>: advisory | required`

`discovered` 只是候选事实，不自动执行；`trial` 只能以 advisory 参与被允许的阶段；只有 `stable` 能成为 required gate。这样 Agent 可以推动技术成熟度，团队仍对阻断语义作显式确认。

### 4. 声明采用可审计、无 shell 插值的命令形状

`command.argv` 使用非空字符串数组，`command.cwd` 使用相对 Project/workspace 可解析边界，避免把不可审计 shell 片段当作团队事实。声明还记录 coverage、environment、effects、authorization、dependsOn 和 supersedes。

只有团队显式声明 `supersedes` 时，上层能力才能去重底层检查；`dependsOn` 只表达真实前置关系。未知 capability、循环依赖、越界 cwd/path、`stable` 之外的 required gate 或高副作用 implicit authorization 都是声明错误。

### 5. Agent 负责发现和演进，关键治理由团队确认

“初始化测试声明”由 `task-verification` 意图直接命中：Agent 扫描 AGENTS、POM、package scripts、CI、项目文档和 Service repo 中可确认的测试入口，生成 `mode: augment` 的候选声明。不能确认的能力保持 `discovered`，环境、覆盖或副作用未知时明确记录 unknown，不自动执行。

普通任务中发现新增测试时，Agent可以提出增量补充；用户明确要求“更新/自动补充测试声明”时可以写入候选，但必须保留现有团队确认字段，不得直接提升为 stable/required。Agent 可以依据真实任务中的可重复成功、耗时和环境证据建议 `discovered → trial → stable`，从 advisory 提升为 required 仍需团队确认。

### 6. 选择器仍由 Agent 执行，但返回结构化决策证据

Skill 按阶段、改动范围、风险、成熟度、依赖、环境和授权构造 selected/skipped/blocked 集合：

- Minimal：选择直接相关、低成本、已授权的 stable 能力。
- Affected：选择影响面内的 stable required，并可运行已授权 trial/advisory。
- Candidate：运行适用的全部 stable required gate；不得按 diff 缩小 authoritative Candidate 集合。

Result Evidence 在现有字段上增加 `policyMode`、`availableCapabilities`、`selectedCapabilities`、`skippedCapabilities`、`blockedCapabilities`、`coverageSummary`、`environmentReadiness`、`authorizationDecisions` 和 `candidateCompleteness`。这些是旧 consumer 可忽略的兼容扩展，不升级 contract major version。

## Risks / Trade-offs

- [Risk] Agent 扫描可能把普通脚本误识别为测试能力。→ 初始化只产生 discovered 候选，必须保留来源和未知项，不能自动门禁。
- [Risk] `augment` 同时使用声明和 legacy discovery，可能出现重复命令。→ 只用稳定 capability id 和显式 supersedes 去重；无法证明覆盖时保留并如实报告。
- [Risk] 团队过早切换 authoritative 导致 Candidate policy 不完整。→ 切换时要求 Agent审查 Candidate required gates；doctor 校验结构，provider 无法确认完整性时返回 incomplete。
- [Risk] 声明命令可能具有未记录副作用。→ effects/authorization 是执行前硬边界；事实未知或实际行为更高时停止并请求授权。
- [Trade-off] 首版不提供专用 CLI 自动扫描器。→ 扫描依赖 Agent 已有代码与文档工具，避免固化技术栈；Buildr 只提供 schema、模板、诊断和 Skill 流程。

## Migration Plan

1. 随包发布 schema 参考、模板和 Project 声明校验器，但不改写既有 Project。
2. 更新 `task-verification` provider 与 contract，保持 capability identity、binding 和旧结果字段。
3. 对已有团队采用显式“初始化测试声明”，默认生成 augment/discovered 候选。
4. 团队逐项确认并渐进提升；任何时候删除可选文件即可回到 legacy 行为。
5. 若新版回滚，旧 Skill 会忽略未被其读取的 `verification.yml`；Project 文件仍是用户可保留数据，不自动删除。

## Open Questions

无。
