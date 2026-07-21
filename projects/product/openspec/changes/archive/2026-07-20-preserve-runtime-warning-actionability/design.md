## Context

runtime projection 会为 adapter inventory 的不可观测来源产生 `runtime.skill_visibility_incomplete` warning，并明确设置 `userActionRequired: false`。doctor 为每个 scope/adapter 把 runtime findings 聚合成顶层 `runtime.<agent>_warning`，当前只根据 severity 判断是否创建聚合 finding，没有传播 actionability 和诊断上下文。结果模型把未显式标记为 false 的 warning 视为 actionable，造成 readiness 和 repair plan 失真。

## Goals / Non-Goals

**Goals:**

- 聚合 runtime warning 时保留“是否需要用户行动”的事实。
- 非行动型 warning 仍可见，但不降低 readiness、不生成 repair plan。
- 顶层 finding 提供足以定位子 warning 的结构化上下文。
- 行动型及混合 warning 继续阻止 readiness，保持兼容安全边界。

**Non-Goals:**

- 不把 `runtime.skill_visibility_incomplete` 降级为 info 或删除。
- 不尝试枚举 Codex 的 admin/system/plugin Skills。
- 不改变 runtime check、render/sync 或 doctor 的退出码语义。
- 不为 `runtime check` 增加 JSON 输出。

## Decisions

### 1. actionability 采用“任一子 warning 需要行动”聚合

doctor 先取得当前 scope/adapter 的全部 warning findings。只有至少一个 warning 的 `userActionRequired !== false` 时，顶层 `runtime.<agent>_warning` 才是 actionable；全部子 warning 均明确为 false 时，顶层也设置 `userActionRequired: false`。

这比按 severity 一律 actionable 更准确，也比只看第一个 finding 更安全。混合 warning 仍要求处理，不会因同时存在非行动型提示而被错误放行。

### 2. 保留 warning severity，不用 info 隐藏可观测性边界

`partial` inventory 表示 Buildr 不能证明全局无同名 Skill，这是有效风险披露。warning summary 继续计数，但 readiness 与 actionability 由独立字段决定，符合 doctor 现有健康模型。

### 3. 聚合 finding 携带稳定来源摘要

顶层 finding 增加去重后的 `runtimeFindingCodes`、`evidence` 和 `opaqueSources`。字段只来自子 findings，不复制完整明细；完整细节继续保留在 `runtime.<adapter>[].findings`。

### 4. 在 runtime diagnostics unit 层直接覆盖三种组合

通过注入 checker fixtures 验证全非行动、全行动和混合 warning。另用现有结果模型断言顶层 finding 对 `health` 与 `repairPlan` 的影响，避免依赖真实 runtime 文件布局。

## Risks / Trade-offs

- [部分消费者可能把任何 warning 都当阻塞] → 保留 severity 兼容，同时由 `health` 和 `repairPlan` 提供规范决策字段；文档已要求消费者读取这些字段。
- [聚合 metadata 随子 finding 扩展] → 只暴露稳定摘要字段并去重，不复制任意内部对象。
- [错误把未知 actionability 当非行动] → 只有显式 `false` 才豁免；缺失字段继续按 actionable 处理。
