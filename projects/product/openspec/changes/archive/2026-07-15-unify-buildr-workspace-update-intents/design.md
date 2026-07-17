## Context

Buildr 的底层 CLI 有意保持单一职责：`buildr update` 只更新 CLI，`buildr skill install` 安装产品入口 Buildr Skill，`buildr sync` 使用当前 CLI package 收敛 workspace、产品入口 Skill与 Agent runtime。当前产品内置 Buildr Skill 只覆盖“更新 Buildr”和“同步 workspace”，遗漏“同步 Buildr”“更新 workspace”等常见表达，并把前者扩展为整个 workspace sync。

用户表达的对象决定期望状态：Buildr 指 CLI 与产品入口 Skill，workspace 指由当前 Buildr package 管理的 workspace 产品能力。动词“更新”和“同步”在同一对象内是等价表达，不应跨对象合并。

## Goals / Non-Goals

**Goals:**

- 让 Buildr Skill 分别归一“更新/同步 Buildr”和“更新/同步 workspace”两组表达。
- 让 Buildr 更新只触达 CLI 与产品入口 Skill，让 workspace 同步稳定触发 `sync`。
- 保留用户明确“只更新 CLI”时的最小操作边界。
- 让 Skill description、正文、spec、文档和验证使用同一意图词表与完成标准。

**Non-Goals:**

- 不改变 `buildr update`、`buildr sync` 的 CLI 实现或单命令副作用。
- 不引入新的聚合 CLI 命令。
- 不把普通的完整更新意图误扩展为安装外部 CLI、覆盖用户定制 optional Builtin 或其他需要授权的动作。

## Decisions

### 1. 先按对象分组，再归一动词

“更新 Buildr”“同步 Buildr”表示更新 Buildr 产品入口，Agent 执行 `update → 重新解析入口 → skill install`。“更新 workspace”“同步 workspace”表示用当前 Buildr package 收敛 workspace，Agent执行 `sync` 并使用其最终 doctor。

备选方案是把四种表达全部合并为 `update + sync`，但这会让“Buildr”对象隐含整个 workspace 修改，超出用户表达的范围，因此不采用。

### 2. “只更新 CLI”保留为显式窄化

“只更新 CLI”或明确不要安装/修复 Buildr Skill 时只执行 `update`。workspace 组本身就是 `sync` 的明确意图，不需要用户再说“只同步”。

这样既保留最小 CLI 更新入口，也让“更新 workspace”与“同步 workspace”稳定执行同一条产品路径。

### 3. 只修改 Agent 编排契约

实现集中在产品内置 Buildr Skill、canonical spec、相关说明与定向验证。CLI 仍保持可组合的原子命令，不增加自然语言别名命令。

## Risks / Trade-offs

- [Buildr Skill 安装需要已知 workspace target] → 按现有 target 解析规则定位 workspace；无法定位时报告事实，不扩大为 workspace sync。
- [`update` 因 Git、registry 或权限阻塞] → 沿用现有 fail-closed 契约，不使用旧 CLI 安装 Skill，并报告可执行决策点。
- [文档继续按动词而不是对象路由] → 验证覆盖两组各自的“更新/同步”表达以及“只更新 CLI”限制。
