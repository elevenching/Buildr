## Context

所有受支持 adapter 当前都把内部 `admin`、`system`、`plugin` 来源声明为不可完全枚举，因此 `skillInventoryEvidence` 为 `partial`。现有实现同时在 render plan 和 runtime checker 中无条件生成 `runtime.skill_visibility_incomplete` warning；doctor 又把它聚合成 runtime warning。这个 finding 没有修复动作，也不代表观察到了同名 Skill，却让每个健康 workspace 都保持 warning。

Buildr 已经能从候选 projection、receipts、workspace/user destination inventory 对 Buildr 管理的 Skill identity 做逐项分类，并在观察到 `name_conflict`、`foreign_owner` 或不等价同名项时零写入阻塞。问题不在实际冲突 preflight，而在 partial assurance 被错误建模为健康 finding。

## Goals / Non-Goals

**Goals:**

- 让 doctor warning 只表达需要关注或处理的实际状态。
- 保留 runtime inventory 的证据等级和不透明来源，避免错误宣称全局无歧义。
- 保持 Buildr 管理候选的可观测同名冲突、ownership 和 digest preflight 不变。
- 让 JSON consumer 能区分实际 finding 与非操作性 assurance metadata。

**Non-Goals:**

- 不枚举或治理 Agent 内部、管理员、系统或插件安装的全部 Skills。
- 不检查与 Buildr 候选 identity 无关的外部 Skills。
- 不改变 adapter destination、activation、receipt 或 capability binding schema。
- 不保证 Agent 当前 session 已重新发现刚投射的 Skill。

## Decisions

### 1. Partial inventory 保留为 metadata，不生成 finding

`runtime check` 和 doctor 的 runtime scope 继续返回 `skillInventoryEvidence`，其中包含 `evidence: partial`、可观测 roots、`opaqueSources` 和 precedence。checker 不再把该事实复制为 warning finding，render plan 也不再输出无条件 warning。

备选方案是把 warning 降为 `info` finding。该方案仍会让健康摘要混入一个每次必现、不可操作的项目，并把证据属性重复编码成 finding，因此不采用。

### 2. 冲突检查保持 candidate-scoped

preflight 继续以 Buildr 本次计划写入或已持有 receipt 的 Skill identity 为候选，只在可观测 inventory 中查找同名项并比较 ownership、asset identity 与 render digest。无关外部 Skill 不进入 classifications；观察到真实不等价同名项时仍阻塞整次 mutation。

备选方案是完全不读取 runtime inventory。该方案会让 Buildr 在可观察到同名遮蔽时仍写入并误报成功，破坏投射安全，因此不采用。

### 3. Assurance 与 routing claim 分离

`partial` 仍意味着 Buildr 只能证明可观测范围内没有冲突，不能把顶层 Skill 路由描述为已全局无歧义。CLI 文档和产品 Skill 使用 metadata 说明这一证据上限，但普通 doctor 不要求用户修复不可修复的环境事实。

## Risks / Trade-offs

- [Risk] 用户只看人类可读 doctor 时可能忽略不透明来源。→ 保留 JSON `skillInventoryEvidence`，在显式 runtime check 和需要证明路由无歧义的流程中展示 assurance 边界。
- [Risk] 删除 warning 可能意外放松真实冲突。→ 保持 candidate classification 与 blocking findings 不变，并增加无关 Skill、可观测同名冲突和 partial metadata 的组合测试。
- [Risk] 旧 consumer 依赖固定 warning 数量。→ 这是诊断语义修正；稳定字段继续存在于 runtime scope，更新公开 JSON contract tests 明确新行为。
