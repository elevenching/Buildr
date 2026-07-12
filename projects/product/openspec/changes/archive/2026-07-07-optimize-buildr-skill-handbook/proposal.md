## Why

Buildr Skill 是 Agent 使用 Buildr 的首选入口，但当前维护边界还不够稳定：根 `AGENTS.md` 只应该给产品仓内的维护原则，而不应该变成 Buildr Skill 的维护手册；`package/agent-skills/buildr/SKILL.md` 需要按这些原则继续优化成 Agent 操作手册；诊断入口也需要统一到 `buildr doctor --json`，避免 Agent 在 `runtime check`、render 检查和各类专项命令之间先猜入口。

这次变更目标是收敛维护原则和操作入口，不重新设计 Skills manifest，也不扩展新的 Skill 登记模型。

## What Changes

- 在根 `AGENTS.md` 增加短的 Buildr Skill 维护原则：明确 `package/agent-skills/buildr/SKILL.md` 是 Agent 使用 Buildr 的操作手册，维护时应帮助 Agent 判断任务归属、源资产入口、CLI 主路径、诊断方式和必要的后续读取。
- 按维护原则优化 `package/agent-skills/buildr/SKILL.md`：正文直接进入操作流程和决策规则，按 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类 Buildr 资产组织内容，命令说明服务于 Agent 决策，不写成完整 CLI 参考。
- 将 `buildr doctor --json` 定为 Buildr Skill 和 bootstrap 引导中的默认事实入口；专项检查命令只作为更细诊断或修复时的后续入口。
- 将 doctor 的默认入口要求写入能力契约，确保后续 CLI、runtime adapter 和 Skill 文档优化都围绕同一个诊断模型。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `product-agent-skills`: 增加 Buildr Skill 的产品仓维护原则和 Agent 操作手册要求，并要求 Skill 以 `doctor --json` 为默认事实入口。
- `agent-readable-doctor`: 明确 `doctor --json` 是 Agent 获取 Buildr workspace、源资产和 runtime 状态的默认结构化诊断入口。

## Impact

- 影响根 `AGENTS.md`、`package/agent-skills/buildr/SKILL.md`、`package/bootstrap/guide.md` 和 `package/bootstrap/bootstrap.contract.yml`。
- 影响 Buildr Skill 中对 `doctor`、`runtime check`、render、commands 和 skills 管理命令的叙述顺序。
- 不引入新 CLI 命令，不移除现有专项检查命令；只调整默认入口和文档/契约的优先级。
