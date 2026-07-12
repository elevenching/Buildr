## Why

当前 `buildr init` 生成的 `AGENTS.md` 和 `README.md` 只是骨架说明，没有承载 Buildr workspace 的核心工作方法，导致新实例缺少足够有用的 Agent 协作约束。

同时，当前产品仓 root 的 `AGENTS.md` 与发布版 workspace 规则存在重复。按照自用验证设计，公共、可发布的规则应沉淀到独立规则源，再由产品仓 root 组合引用并叠加自身 overlay。

## What Changes

- 将 `rules/AGENTS.workspace.md` 扩展为高质量发布版 workspace 规则源，覆盖资产边界、层级记忆、任务启动、OpenSpec、runtime、Git 和资产说明。
- 将当前 root `AGENTS.md` 改成组合入口：先读取 `rules/AGENTS.workspace.md`，再应用 Buildr 产品开发和示例组织业务 overlay。
- 提升 `product/package/README.workspace.md` 的信息密度，让默认 README 解释 Buildr root 的用途、工作流、目录资产和 Agent-aware runtime。
- 保持业务专属内容不进入发布 baseline，仍由当前 root `AGENTS.md` 和 `rules/AGENTS.acme.md` 承载。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `buildr-package-assets`: 用户 workspace baseline 的 `AGENTS.md` 和 `README.md` 必须来自可独立维护的发布版内容源，并具备足够的工作指导价值。
- `root-organization-workspace`: 默认 root baseline 必须提供可工作的 Organization context 规则，而不是只生成空泛骨架。

## Impact

- 影响 root `AGENTS.md`、`rules/AGENTS.workspace.md` 和 `product/package/README.workspace.md`。
- 影响 `buildr init` 生成内容质量，但不改变 CLI 参数和目录结构。
- 需要通过临时 init 验证新 `AGENTS.md` / `README.md` 内容被正确渲染。
