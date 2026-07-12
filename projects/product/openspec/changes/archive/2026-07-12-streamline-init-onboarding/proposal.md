## Why

Buildr 首次使用目前要求用户或 Agent 连续理解并执行 `init`、`sync` 和 `doctor`，虽然这些内部阶段职责不同，但公开 onboarding 暴露了不必要的流程复杂度。现在需要让首次初始化收敛为一个可发现、可验证的高层命令，同时保留源资产初始化与日常同步的独立生命周期。

## What Changes

- 为 `buildr init` 增加 `--agent <agent>`，作为推荐的首次 onboarding 形式；命令按顺序初始化 Organization/Root 源资产、执行对应 adapter 的完整 `sync`，并以该 `sync` 的最终 doctor 结果作为完成条件。
- 保留不带 `--agent` 的 `buildr init`，继续只初始化源资产，供高级、自动化和多 Agent 场景使用；保留 `buildr sync <agent>` 作为已初始化 workspace 的日常 reconcile 入口。
- 在任何文件写入前校验 `--agent`；若源资产初始化成功但后续 sync 或 doctor 失败，保留可诊断的已初始化 workspace，并明确提示修复后重试 `sync`，不伪装成完整 onboarding 成功。
- 将 README、CLI help/reference、bootstrap guide、Buildr Skill、current-state knowledge 和 onboarding verifier 的 canonical 首次路径更新为 `runtime list -> init --agent`。
- 不删除 `skill install`、`sync`、`doctor` 等低层或专项修复入口，不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `human-agent-onboarding`: 将公开首次 runtime 准备从多个连续命令收敛为带 `--agent` 的单个 `init` 高层命令，并区分纯源资产初始化兼容形式。
- `buildr-product-capability-sync`: 规定 `init --agent` 复用完整 sync 管线与最终 doctor，而不复制另一套产品能力/runtime 同步逻辑。
- `product-agent-skills`: 规定首次 `init --agent` 也会通过 sync 安装或修复产品入口 Buildr Skill，同时保留独立 `skill install`。
- `npm-cli-package`: 要求安装后的 CLI 支持单命令完成 workspace 初始化、runtime 准备与 doctor 闭环。

## Impact

- CLI：`tools/cli/application/workspace-operations.mjs`、command help/registry 及相关兼容性验证。
- Onboarding 验证：repository onboarding、临时 workspace E2E 和 npm 安装路径。
- 产品资产与文档：README、CLI reference、bootstrap guide、Buildr Skill、package contract、current-state knowledge 和 release checklist。
- OpenSpec：上述四个 canonical capabilities 的 delta specs；现有 `init`、`sync` 和 `skill install` 调用保持兼容。
