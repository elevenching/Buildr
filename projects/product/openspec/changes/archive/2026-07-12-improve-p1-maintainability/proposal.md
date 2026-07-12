## Why

上一轮 CLI 模块化已经移除了单文件入口的主要风险，但 package maintenance、doctor、runtime Skill renderer、MVP verifier 和产品 Skill 契约仍存在大文件、大方法、宽依赖和职责混杂问题。这些热点已经开始降低验证定位效率并放大后续演进成本，因此需要在最小开源前完成一轮保持行为兼容的结构性收敛。

## What Changes

- 将 package maintenance 的静态校验、smoke checks、输出生成和命令编排拆分为边界明确的模块。
- 将 doctor 的 scope discovery、registry/runtime diagnostics、结果汇总和展示拆分为独立诊断单元。
- 将 Claude Code runtime Skill renderer 拆分为 manifest、contribution、source resolution 和 render plan 等可独立测试的模块，并保留现有入口兼容性。
- 收窄 CLI 模块对共享 platform namespace 的依赖，改为显式、最小的依赖导入，并通过架构门禁阻止宽依赖回流。
- 将 MVP verifier 拆分为按场景组织的验证脚本和公共断言库，保留单一聚合入口。
- 增加基于 `node:test` 的细粒度单元测试，并纳入产品完整验证。
- 将过大的 `product-agent-skills` capability 按“Skill 资产管理”和“Agent 任务工作流”拆分，降低自然语言契约的耦合度。
- 增强架构验证，对关键 facade、模块依赖和验证器结构建立可执行约束。
- 保持现有 CLI 命令、参数、输出语义、退出码、runtime 投射结果和已支持工作流兼容；不包含破坏性变更。

## Capabilities

### New Capabilities

- `managed-skill-assets`: 定义 workspace/project Skill 源资产、类型、manifest 和 Codex runtime 投射契约。
- `agent-task-workflows`: 定义内置场景化 Skills、任务工作流、OpenSpec guard、Git/worktree/finish 协作和分层验证契约。

### Modified Capabilities

- `cli-modular-architecture`: 增加关键应用模块、runtime renderer 和 verifier 的可维护边界、显式依赖及细粒度测试要求。
- `product-agent-skills`: 将 Skill 资产管理和 Agent 任务工作流要求迁移到独立 capability，保留 Buildr 核心 Skill 与组件引导职责。

## Impact

- 影响 `tools/cli/`、`tools/render-claude-code.mjs`、`tools/verify-buildr-product-mvp`、相关架构验证脚本和测试入口。
- 影响 `package.json`、CLI 架构文档、OpenSpec capability 划分和产品验证流程。
- 不新增运行时依赖，不改变公开 CLI API、安装模型或资产格式。
