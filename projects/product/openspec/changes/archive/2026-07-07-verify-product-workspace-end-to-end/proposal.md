## Why

Buildr Skill 是 Agent 使用 Buildr workspace 的操作手册和主入口；产品级验证必须证明这个手册描述的路径在真实临时 workspace 中可以闭环。

当前 `tools/verify-buildr-product-mvp` 已经覆盖大量端到端行为，但它的定位仍偏“脚本集合”：没有明确声明它是完整临时 workspace 验收，也没有强约束验证分组必须和 Buildr Skill 的七类资产入口对齐。随着 Buildr Skill 成为 Agent 默认入口，这个验证层需要更明确、更可维护。

## What Changes

- 将产品级验证明确定位为“临时 workspace 端到端验收”：每次从空临时目录初始化 Buildr workspace，并验证 Agent 常用的主要操作路径。
- 验证分组必须和 Buildr Skill 对齐，至少覆盖 Workspace、Project、Service、Rules、Commands、Skills、Runtime 七类资产。
- 验证必须检查 Buildr Skill 安装后的 runtime 内容仍能作为 Agent 操作手册使用，包括 doctor-first、七类资产章节、产品内置 Skill 与 workspace/project Skills 的边界。
- 增加一个产品级总验证入口，统一执行 package check、临时 workspace 端到端验收和 OpenSpec strict 校验，降低 Agent 记忆成本。
- 保留 `tools/verify-buildr-product-mvp` 作为现有 MVP 验证脚本，可以增强其输出和分组；是否新增 wrapper 由实现决定。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `buildr-package-assets`: 明确产品验证必须以临时 workspace 端到端验收覆盖主要 workspace 功能，并提供统一产品验收入口。
- `product-agent-skills`: 要求产品验证和 Buildr Skill 操作手册保持对齐，验证安装后的 Buildr Skill 内容和 Agent 使用路径。

## Impact

- 影响 `tools/verify-buildr-product-mvp` 或新增的产品级验证 wrapper。
- 影响根 `AGENTS.md` 中产品验证命令说明。
- 影响 `package/bootstrap/bootstrap.contract.yml`、`package/agent-skills/buildr/SKILL.md` 或验证脚本中的关键文本检查。
- 不改变 Buildr workspace 功能模型；只强化验证覆盖和验证入口。
