## Context

当前 `task-cockpit` 已能生成稳定、自包含、只读的 HTML，但其核心模型仍是阶段列表，无法准确表达跨 change 的独立交付批次、尚未满足启动条件的依赖任务，也没有结构化 change 关联。集鲜 workspace 中的增强版已验证 `batches`、`dependencyPool`、业务/技术方案分层和完成项技术细节；本变更需要吸收这些实践，并基于上一 change 已交付的完整 Skill 目录投射能力，让 Skill 直接使用自身 `assets/` 模板。

`task-asset-review` 已是 `buildr.task-asset-review/v1` 默认 provider。集鲜增强版增加了对 Skill 资源和实际产物的覆盖核对，但不能因此移除 Buildr 已建立的 capability routing、只读调用和用户确认边界。

## Goals / Non-Goals

**Goals:**

- 用同一 artifact 统一“任务驾驶舱”和“任务看板”。
- 让看板以完整任务、真实 OpenSpec change、可独立交付批次和依赖池组织进度。
- 让模板直接随 Skill runtime 目录投射并保持单文件、离线、只读。
- 让资产审查能识别已有 Skill 仅覆盖描述但未覆盖模板、脚本或数据模型的情况。
- 让 Agent Skills 可移植核心与 OpenAI vendor extension 分别拥有清晰的校验责任。
- 保留现有 capability provider 和写回授权边界。

**Non-Goals:**

- 不把看板变为 OpenSpec、代码、测试或外部系统的第二事实源。
- 不要求每个批次都只能包含一个 change，也不禁止 code-only 或外部协作项。
- 不新增 task-cockpit capability contract，不引入 runtime Hook、daemon 或外部看板系统。
- 不自动把资产审查结论写回 Rule 或 Skill。
- 不让 `agents/openai.yaml` 参与非 OpenAI adapter 的语义解释，也不让 Skill 正文依赖该 vendor extension 才能执行。

## Decisions

### 1. 任务驾驶舱与任务看板是同一 artifact

Skill、spec 和用户文案使用“任务驾驶舱（任务看板）”建立同义关系，路径和文件格式保持不变。相比新增第二套看板，这能保留稳定入口并避免双重状态维护。

### 2. 看板必须关联真实 OpenSpec change

页面数据增加非空 `changes` 列表，每项保存 change id、状态、稳定路径、摘要和关联批次 id。创建看板前若尚无 change，task-triage 先完成 change-flow；未来设想不能冒充真实 change。一个批次通过 `changeIds` 关联零到多个 change，因此 code-only 或外部工作仍可成为批次内容，但整个复杂任务至少有一个契约锚点。

### 3. 用批次和依赖池替代线性阶段

`progress.batches` 表示能独立计划、实施和验收的交付集合；`progress.dependencyPool` 保存启动条件尚未满足的任务。阶段仅作为时间或状态描述，不再作为固定瀑布门禁。部分依赖解除时，Agent 将已就绪工作拆成新批次/change，而不是让整个任务停滞。

### 4. 方案和技术事实分层

`solution.businessPlan` 与 `solution.technicalPlan` 表达尚在推进的真实方案；`technical.details` 只记录已完成复杂任务的实现与验证事实。这样避免把预期实现写成既成事实，同时让普通用户先看到业务链路。

### 5. 融合集鲜资产审查方法但保留 provider contract

审查时同时读取候选目标 Skill 的 `SKILL.md`、`agents/`、`assets/`、`scripts/`、manifest 与必要的 runtime/实际产物，按完整覆盖、部分覆盖、存在冲突、尚无资产分类。Buildr 现有 selected-provider 调用、证据边界、只读行为和确认后写回不变。

### 6. 将 OpenAI metadata 定义为 Codex adapter 可选 UI 扩展

通用 Skill 源校验只定义可移植核心：有效 `SKILL.md` 以及可选随附目录和文件。Codex 发现与路由继续使用 `SKILL.md` 的 `name` 和 `description`，不要求 `agents/openai.yaml`。runtime adapter descriptor 的 Skills trait 声明可选 publication extensions；当 Codex package Skill 已提供 `agents/openai.yaml` 时校验其 OpenAI metadata 结构，缺失时继续正常发布和发现。其他 adapter 不声明也不消费该扩展。

Buildr render 不从 `name`、`description` 机械生成或反写 vendor 文件：展示名称和简短说明可以由 Agent 在作者阶段参考 Skill 生成，`default_prompt`、icon、brand、dependencies 和 policy 还可能包含额外作者意图。只有需要稳定 UI 定制的 Skill 才维护 `agents/openai.yaml`；没有定制需求时以 `SKILL.md` 为唯一必需事实。

完整目录投射行为保持不变：同一 Skill 的 `agents/`、`assets/`、`templates/`、`scripts/`、`references/`、`examples/` 和其他普通文件对所有 filesystem adapter 都按相同 identity 复制。保留文件不代表消费文件；只有 Codex/OpenAI adapter 解释 `agents/openai.yaml`。Skill 正文引用模板等执行资源时，统一从当前 `SKILL.md` 所在目录解析相对路径。

## Risks / Trade-offs

- [已有页面使用旧 `progress.stages` 数据] → 下次实质更新时迁移；模板只保证新模型，不静默猜测旧数据。
- [强制 change 关联使纯 code-only 简单任务无法创建看板] → 看板只面向复杂长期任务；无 OpenSpec change 的简单任务继续用对话汇报。
- [change 状态可能过期] → 每次实质更新从 OpenSpec status、路径和归档位置重新核实，不以页面反向覆盖。
- [资源审查增加读取成本] → 只检查与候选相关的源目录和实际产物，不做无关全量审计。
- [可选 metadata 与 Skill 正文发生漂移] → package verification 只对已存在的 Codex/OpenAI extension 校验结构，资产审查继续核对其与 `SKILL.md` 的语义一致性；不为所有 Skill 强制制造重复文案。
- [其他 adapter 看到不认识的 vendor 文件] → 完整目录投射继续保真复制，但 descriptor 不声明消费语义，文档明确 preservation 不等于 consumption。

## Migration Plan

1. 更新规格、Skill、必要 metadata、manifest、adapter contract 和模板。
2. 将当前 `buildr-task-assets-evolution` 驾驶舱迁移为新数据模型，并关联已归档的第一个 change 与当前 active change。
3. 运行 Skill 核心校验、Codex optional extension 校验、模板/契约测试、OpenSpec 严格校验和候选验证。
4. 若验证失败，回退本 change 的源文件；既有已归档 change 与主分支不受影响。

## Open Questions

无。
