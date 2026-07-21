## Why

Buildr 已分别说明 Agent-first、工作资产和自然语言 onboarding，但尚未把“组织成员从一句自然语言指令开始，由 Agent 准备工作环境并进入任务”收敛为统一的产品承诺，也没有用稳定的开发边界防止 Buildr 复制 Agent 本身的理解、推理与任务执行能力。当前文档还混用“工作内容、工作能力与工作方式”等多组概念，需要统一成更直接的“工作事实与工作方法”。

## What Changes

- 将“任何人进入组织都可以从一句自然语言指令开始，由 Agent 准备工作环境并进入任务”确立为 Agent-first 组织 onboarding 的公开产品表达。
- 将工作资产的公开解释收敛为“工作事实”与“工作方法”，同时保留工作资产类型可扩展、不可被当前枚举封闭的边界。
- 明确 Buildr、Agent 与人的责任：Buildr 治理并投射工作资产、提供确定性工具和诊断；Agent 负责理解目标、发现相关资产、形成任务上下文并推进任务；人负责目标、业务判断与必要授权。
- 将“不与 Agent 抢活”转化为可执行的产品开发规则：Buildr 不成为另一个 Agent，不复制 Agent 的通用理解、推理、规划、对话和专业任务执行能力；只有需要长期治理、跨 Agent 复用、确定性约束或可验证诊断的部分才进入 Buildr 产品边界。
- 对齐中文与英文公开 README、产品说明、Buildr Skill、Buildr Core 和 Product Project 规则；不改变 CLI 行为、runtime adapter、资产生命周期或用户数据。

本变更不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-first-product-positioning`: 增加组织成员自然语言进入任务的产品承诺，统一工作资产二分法，并明确 Buildr 不复制 Agent 通用能力的职责边界。

## Impact

- 规范：`openspec/specs/agent-first-product-positioning/spec.md`。
- 产品入口与说明：仓库根 `README.md`、`README.en.md`，以及 `projects/product/README.md`、`docs/buildr-product.md`。
- Agent 入口与规则：`package/targets/runtime/skills/buildr/SKILL.md`、`package/targets/workspace/rules/buildr/core.md`、`AGENTS.md`。
- 不影响 CLI API、JSON contract、runtime adapter、依赖或发布数据结构。
