## Why

当前 bootstrap guide 只泛化提示“按当前 Agent adapter 运行 runtime check/render”，容易让 Agent 在 Codex 这类已经原生读取 `AGENTS.md` 的环境里错误执行 `rules render`，生成不必要的规则桥接文件。

Buildr 的 onboarding 应该引导 Agent 先识别自身 runtime 能力，再只执行该 Agent 需要的投射动作。

## What Changes

- 更新 bootstrap guide：初始化后先判断当前 Agent 类型和其规则加载方式，再决定是否 render rules。
- 明确 Codex 场景：Codex 原生依赖 `AGENTS.md`，不需要 rules render；如有对应 Skills adapter，则只处理 Skills runtime。
- 明确 Claude Code 场景：Claude Code 仍通过 `CLAUDE.md` 桥接 `AGENTS.md`，需要 `runtime check claude-code` 后按缺失/过期结果 render rules/skills。
- 更新 runtime adapter 文档和产品手册，避免把 “runtime check/render” 表述成所有 Agent 的固定动作。
- 保持现有 CLI 不新增 Codex adapter 命令；当前优化先通过 bootstrap guide 约束 Agent 行为。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `agent-first-onboarding`: bootstrap guide 必须引导 Agent 根据自身 runtime 能力选择后续 runtime 动作。
- `workspace-first-runtime-projection`: runtime 投射必须区分规则桥接和 Skills 投射；原生读取 `AGENTS.md` 的 Agent 不应被要求生成规则桥接文件。

## Impact

- 影响 `product/package/bootstrap/guide.md`、产品手册和 runtime adapter 文档。
- 影响验证脚本：需要覆盖 bootstrap guide 中的 Codex/Claude Code adapter guidance。
- 不改变当前 `buildr runtime check claude-code`、`rules render claude-code`、`skills render claude-code` 的现有行为。
