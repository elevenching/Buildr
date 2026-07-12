## Why

Buildr 产品随包的默认 workspace/project 规则源仍放在当前 root `rules/` 下，使产品 baseline 源和当前开发 workspace 安装后的规则副本混在一起。

当前 Buildr root 本身也是一个真实 workspace，并且有组合入口 `AGENTS.md`。因此产品 canonical baseline 应收敛到 `product/package/`，当前 root 只保留安装后的 workspace 规则副本和私有 overlay。

## What Changes

- 将默认 workspace/project 规则源迁到 `product/package/workspace-rules/`。
- 更新 package manifest，使 `buildr init` 和 `buildr project create` 从 `product/package/workspace-rules/` 生成规则资产。
- 从当前 root `rules/` 移除 `AGENTS.workspace.md` / `AGENTS.project.md` 这类产品 baseline 源。
- 当前 Buildr root 保留组合入口 `AGENTS.md`，并使用 `AGENTS.workspace.md` 作为通用 workspace 规则副本。
- `buildr init` 在目标目录已有 root `AGENTS.md` 时不得覆盖它，而是将默认 workspace 规则写入 `AGENTS.workspace.md`。
- 更新 package check 和产品 MVP 验证，覆盖已有 root `AGENTS.md` 的兼容初始化场景。

## Capabilities

### Modified Capabilities

- `buildr-package-assets`: 随包默认 workspace/project 规则源迁入 `product/package/workspace-rules/`，并增加已有 root `AGENTS.md` 的兼容安装行为。
- `root-organization-workspace`: 默认初始化仍生成 root 规则入口；已有组合入口时保留 `AGENTS.md` 并生成 `AGENTS.workspace.md`。

## Impact

- 影响 `product/package/manifest.yml`、`buildr init`、package check、产品 MVP 验证和产品文档。
- 不改变 `rules render` 语义；它仍只负责 Agent runtime 桥接。
- 不改变普通新 workspace 的默认结果：无已有 `AGENTS.md` 时仍生成 root `AGENTS.md`。
