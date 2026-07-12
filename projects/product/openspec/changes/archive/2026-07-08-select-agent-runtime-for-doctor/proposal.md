## Why

Buildr 的 Agent-first onboarding 需要让 Agent 先明确“我是谁”和 Buildr 当前支持哪些 Agent runtime，否则 Agent 会从通用 help 或 doctor 输出中猜测 adapter，并把非当前 runtime 的缺失误报成当前任务噪音。现在 Codex 使用 Buildr 时已经验证主路径可用，但 `doctor` 同时检查 Claude Code 和 Codex，会让 Agent 在当前 runtime 已就绪时仍报告无关 warning。

## What Changes

- 新增 Agent runtime adapter 发现机制：`buildr runtime list --json` 作为 Agent 执行 runtime-specific 命令前的强制发现步骤。
- Runtime adapter 发现输出必须包含 Buildr 支持的 Agent id、unsupported Agent 引导、以及 adapter 必须实现的 render 能力清单。
- Runtime adapter 发现输出可以包含 `recommendedCommands`，为 Agent 提供 runtime-specific 推荐命令模板；完整 CLI 契约仍以命令帮助和实现为准。
- `doctor` 增加按 Agent 选择 runtime 检查的能力，例如 `buildr doctor --agent codex --target . --json`。
- 当传入支持的 Agent 时，`doctor` 只检查该 Agent 的 runtime 状态，并把其他 Agent runtime 状态排除在 warning 和 nextSteps 之外。
- 当传入不支持的 Agent 时，`doctor` 不运行任何 adapter checker，不使用 fallback adapter，输出 warning，并提示“Buildr 暂不支持当前 Agent runtime 的自动渲染，请联系 Buildr 作者反馈该 Agent”。
- Buildr Skill、bootstrap guide 和 init/sync 引导改为要求 Agent 先识别自身 runtime，再通过 `runtime list --json` 确认支持矩阵；不支持或无法识别时不得猜测 adapter。
- 明确 adapter render 能力清单：`rules-entry`、`product-buildr-skill`、`workspace-project-skills`、`skill-install-plans` 和 `runtime-check`。
- 明确 `sync` 语义：同步 Buildr 产品能力并准备当前 Agent 的 workspace 入口 runtime；Project scope 的 runtime 覆盖由显式 `render` / `skills render` / `runtime check --scope` 处理。
- 完善 CLI help：所有已支持命令和多级子命令的 `--help` 必须有有效输出，并且只输出帮助，不执行初始化、创建、渲染或其他状态变更。
- 不包含破坏性变更；未传 `--agent` 时保留现有广义诊断兼容行为，但 onboarding 引导必须推荐传入当前 Agent。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 增加 runtime adapter 发现、render 能力清单、不支持 Agent 的行为，以及 runtime render 资产范围。
- `agent-readable-doctor`: 增加 `doctor --agent <agent>` 的结构化诊断语义，避免非当前 runtime warning 噪音。
- `human-agent-onboarding`: 调整 onboarding 流程，要求 Agent 先探索 Buildr 支持的 Agent runtime，再选择当前 Agent adapter；不支持或无法识别时停止 runtime render 相关动作；确保 Agent 探索 CLI help 时不会触发状态变更。

## Impact

- CLI：新增 runtime adapter 列表/发现入口；扩展 `doctor` 参数和 JSON 输出；完善子命令 help 的无副作用行为。
- Doctor：runtime findings 和 nextSteps 按 `--agent` 过滤；不支持 Agent 时输出 warning，不运行具体 adapter checker。
- Runtime adapter：需要集中声明支持矩阵、render 能力、实现模式和推荐命令，供 CLI、doctor、Buildr Skill 和 bootstrap guide 共用。
- 文档与随包资产：更新 `README.md`、`package/bootstrap/guide.md`、`package/agent-skills/buildr/SKILL.md`、`package/bootstrap/bootstrap.contract.yml` 及相关 current state。
- 验证：更新 MVP 验证脚本，覆盖支持 Agent、不支持 Agent、未传 Agent 的兼容路径、`runtime list --json` 的 render 能力清单，以及全 CLI help surface 的有效输出和无副作用。
