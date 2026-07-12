## Context

Buildr 当前把 `AGENTS.md` 作为标准规则资产，并已实现 Claude Code adapter：通过 `CLAUDE.md` 桥接 `AGENTS.md`，通过 `.claude/skills/` 投射 Skills。

但是不同 Agent 对规则入口的原生支持不同。Codex 在当前运行环境中直接读取 `AGENTS.md`，因此不需要像 Claude Code 一样生成 `CLAUDE.md`。如果 bootstrap guide 只笼统提示“运行 runtime check/render”，Agent 容易把 Claude Code 的规则桥接动作误套到 Codex 场景。

## Goals / Non-Goals

**Goals:**

- 让 bootstrap guide 明确要求 Agent 先识别自身 runtime 类型和规则加载能力。
- 明确 Codex、Claude Code 两类当前最重要场景的后续动作。
- 保持 Buildr 资产源统一为 `AGENTS.md`、`skills/`、`openspec/` 等，不把 runtime 产物变成源资产。
- 避免在没有 Codex adapter 实现时提示不存在的 Codex render 命令。

**Non-Goals:**

- 不在本 change 中实现新的 Codex runtime adapter。
- 不改变 `buildr runtime check claude-code`、`rules render claude-code`、`skills render claude-code` 的现有行为。
- 不引入自动探测当前 Agent 产品的 CLI 机制；当前先通过 bootstrap guide 给 Agent 明确决策规则。

## Decisions

### Decision 1: bootstrap guide 先做 Agent 自判

初始化后，Agent 必须先判断自己是否已经原生读取 Buildr 标准规则资产：

- 原生读取 `AGENTS.md`：不运行 rules render。
- 需要桥接文件才能读取规则：运行对应 adapter 的 runtime check/render。
- 只需要 Skills 投射：只运行对应 adapter 的 skills render/check。

这样可以把“Buildr 标准资产”和“某个 Agent 的 runtime 适配产物”分开，避免所有 Agent 都被 Claude Code adapter 语义绑住。

### Decision 2: Codex 现阶段跳过 rules render

Codex 当前依赖 `AGENTS.md`，所以 Codex Agent 引导用户使用 Buildr 时，初始化后只需读取 `AGENTS.md` 和继续执行 `doctor --json`、项目创建、服务接入等步骤。由于当前尚未实现 Codex Skills adapter，bootstrap guide 只能说明“如存在 Codex Skills adapter，再渲染 Skills；否则跳过”。

### Decision 3: Claude Code 继续使用既有 adapter

Claude Code 当前仍通过 `CLAUDE.md` 桥接规则，并用 `.claude/skills/` 承载 Skills runtime。bootstrap guide 应继续建议 Claude Code 运行：

```bash
buildr runtime check claude-code --scope <scope> --target <dir>
buildr rules render claude-code --scope <scope> --target <dir>
buildr skills render claude-code --scope <scope> --target <dir>
```

但这些命令只适用于 Claude Code，不应作为所有 Agent 的通用 onboarding 固定步骤。

## Risks / Trade-offs

- [Risk] 依赖 Agent 自判可能仍会出错。 → guide 中写清判定表，并在文档里把 Claude Code 与 Codex 分开。
- [Risk] Codex Skills adapter 未实现时，用户可能期待 Skills 自动投射。 → 明确现阶段 Codex 直接使用 `AGENTS.md`，Skills 投射等待对应 adapter。
- [Risk] 只改 guide 不改 CLI，约束力度弱于命令级 hard constraint。 → 当前先修正 onboarding 行为；后续可设计 `buildr runtime plan --agent <agent>` 这类命令把决策产品化。
