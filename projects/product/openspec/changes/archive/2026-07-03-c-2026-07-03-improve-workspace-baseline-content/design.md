## Context

Buildr 产品仓现在既是普通 org workspace，也是 Buildr 产品开发模块的宿主。发布给用户的 workspace baseline 不应直接复制当前 root `AGENTS.md`，因为它混有 Buildr 产品开发和示例组织业务验证 overlay。

正确结构应是：

```text
rules/AGENTS.workspace.md   # 可发布的通用 workspace 规则源
AGENTS.md                   # 当前 root 的组合入口，引入通用规则并叠加业务 overlay
product/package/manifest.yml # 声明 init 时将通用规则源渲染为用户 AGENTS.md
```

## Goals / Non-Goals

**Goals:**

- 默认 `AGENTS.md` 对新 workspace 真正有用，能指导 Agent 工作，而不是只列目录。
- 当前 root `AGENTS.md` 不重复维护通用规则，改为组合引用。
- 默认 README 解释 Buildr root 的价值、下一步和 runtime 差异。

**Non-Goals:**

- 不把当前产品仓的 `ASSETS.md` 发布到默认 baseline。
- 不把 `rules/AGENTS.acme.md` 进入 package manifest。
- 不新增命令或改变 `buildr init` 参数。

## Decisions

### Decision 1: `rules/AGENTS.workspace.md` 是发布版规则源

该文件应从当前 root `AGENTS.md` 中抽出通用内容：Buildr 定位、资产边界、层级记忆、任务启动、OpenSpec 工作流、runtime 边界、Git 规则和资产说明。它不得引用 `product/`、`acme`、当前私有路径或业务专属项目。

### Decision 2: root `AGENTS.md` 变成组合入口

当前 root `AGENTS.md` 的职责是：

1. 明确所有回复使用中文。
2. 要求先读取 `rules/AGENTS.workspace.md` 作为通用 Buildr workspace 规则。
3. 叠加 Buildr 产品开发规则：`rules/AGENTS.buildr.md`。
4. 叠加示例组织业务路由：业务任务读取 `rules/AGENTS.acme.md`。

### Decision 3: README 面向人和 Agent 的下一步

README 应说明这个目录为什么存在、Agent 进入后该做什么、项目和服务如何创建、不同 Agent runtime 如何处理，而不是只列命令。

## Risks / Trade-offs

- [Risk] 组合引用依赖 Agent 遵守 `AGENTS.md` 的读取指令。 → root `AGENTS.md` 必须把读取 `rules/AGENTS.workspace.md` 放在启动流程最前面。
- [Risk] 发布版规则过重会让简单 workspace 显得复杂。 → 保持规则面向工作方法，不引入产品仓私有细节。
