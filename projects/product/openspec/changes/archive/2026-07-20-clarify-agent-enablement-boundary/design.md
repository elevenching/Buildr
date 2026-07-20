## Context

当前 Buildr 已经具备 Agent-first、工作资产、共享工作环境和任务上下文的基本模型，README 也已使用“工作事实与工作方法”解释工作资产。不过产品主说明、Buildr Skill 和 Buildr Core 仍使用“工作内容、工作能力与工作方式”等旧三段式表达；“Buildr 不是另一个 Agent”只作为局部价值说明出现，尚未成为产品开发时可执行的边界。

本次用户确认了三个需要同时成立的产品事实：组织持续维护工作资产后，成员可以从一句自然语言指令开始；公开术语只保留工作事实与工作方法；Buildr 的核心边界是不与 Agent 抢活。它们需要在规范、公开入口、Agent 使用入口和 Product Project 规则中保持同一语义。

## Goals / Non-Goals

**Goals:**

- 用一句直接的公开表达说明组织成员如何通过 Agent 开始工作。
- 将工作资产的公开解释统一为工作事实与工作方法。
- 把“不与 Agent 抢活”转化为能约束新能力设计的产品边界。
- 保持 README、产品说明、Buildr Skill、Buildr Core 与 Product Project 规则一致。

**Non-Goals:**

- 不改变 `buildr init`、更新或同步 workspace 的实际命令语义。
- 不新增检索引擎、Codebase Memory、多层上下文加载或 Agent orchestration。
- 不缩减当前受管资产类型，也不把工作事实与工作方法变成新的存储目录或 manifest 类型。
- 不把“任何人”解释为绕过组织准入、权限、凭证或外部环境条件。

## Decisions

### 1. 公开承诺保持一句话，操作边界留在使用契约

公开入口使用用户确认的表达：“任何人进入组织都可以从一句自然语言指令开始，由 Agent 准备工作环境并进入任务。”这句话表达产品结果，不展开 Git 更新、`buildr sync`、runtime adapter、授权和依赖准备。具体行为继续由 onboarding、workspace update 和 runtime specs 约束。

备选方案是在同一句中加入“组织已维护资产”“取得 Workspace”“同步 runtime”等条件。该方案更精确，但会把产品定位写成操作手册，削弱首次理解，因此不采用。

### 2. 工作事实与工作方法是公开解释，不是封闭资产 taxonomy

公开文档统一使用：工作事实回答“干的是什么”，工作方法回答“怎么干”。Rules、Skills、Commands、Specs、Projects、Services 和专业能力继续作为示例映射到这两类，但受管资产模型保持开放。

备选方案是保留“工作内容、工作能力、工作方式”三段式。其边界重叠，且“专业能力”与 Skills、流程等工作方法重复，因此不采用。

### 3. 用价值门槛而不是绝对禁令表达“不抢活”

Buildr 不实现 Agent 的通用理解、推理、规划、对话和专业任务执行主体，但可以治理 Agent 使用的 Skills、Rules、Commands 和其他工作方法，也可以提供需要确定性的 CLI、完整性保护、投射和诊断。新增能力必须说明至少一种 Buildr 特有价值：长期治理、跨 Agent 复用、确定性约束或可验证诊断。

备选方案是简单规定“Buildr 不执行任务”。这会错误排除 Agent 通过 Buildr CLI 执行资产维护，也会与 Buildr 管理专业 Skills 的事实冲突，因此不采用。

### 4. 按职责同步不同入口

- README 和产品说明承载用户可见承诺与两类工作资产解释。
- Buildr Skill 和 Buildr Core 承载 Agent 可执行的职责边界，不重复宣传性长文案。
- Product Project `AGENTS.md` 增加新能力评审门槛。
- OpenSpec delta 保存上述长期产品语义；英文 README 与中文公开入口保持等价，而不是逐字直译。

## Risks / Trade-offs

- [“任何人”可能被理解为无条件获得组织权限] → 将权限、凭证和环境条件保留在 onboarding 行为契约与使用说明中，同时避免在公开一句话中堆叠细节。
- [工作事实与工作方法被误认为新的存储分类] → 在规范和产品说明中明确这是公开解释模型，资产类型仍开放且沿用现有 manifests。
- [“不抢活”被误解为 Buildr 不能管理 Skills 或执行 CLI] → 使用长期治理、跨 Agent 复用、确定性约束和可验证诊断作为进入 Buildr 的正向门槛。
- [多处文案发生漂移] → 以 delta spec 为契约，集中更新中英文 README、产品说明、Agent 入口与开发规则，并通过文档检查和最终候选验证确认一致性。
