## Why

Buildr 目前只能分别管理 Rules、Skills 和 Commands，无法把同一工具或工作流的多类资源作为统一单元安装、更新、卸载和诊断；OpenSpec 的 CLI 声明与 workflow Skills 因而处于割裂状态。现在需要引入 workspace 级 Component，让 Agent 能根据用户意图和资源组成建立稳定的生命周期边界，同时保持 Agent runtime 可重建、外部 CLI 不由 Buildr 自动安装的现有边界。

## What Changes

- 新增 workspace 级 Component 源资产：`components/manifest.yml` 登记状态，`components/<source>/<id>/component.yml` 保存已安装版本、成员、来源和 integrity。
- Component 可以统一拥有一个或多个 Rules、Skills、Command collections；即使只有一个成员，用户明确要求作为 Component 时也按 Component 管理。
- Buildr Skill 在用户仅表达“安装某个东西”时先调查其资源组成；跨资产类型或需要统一生命周期时创建或选择 Component，再交给 CLI 确定性物化。
- Buildr Skill 在用户仅表达“卸载 OpenSpec”等对象级卸载意图时，先确认对象是否由 Component 管理；如果是，必须展示 Component 卸载范围并获得二次确认后才能执行。
- 新增 Component 的 list、check、install、uninstall CLI；安装和卸载完成后按指定 Agent adapter reconcile runtime 并运行 doctor。
- Commands 从单一 `commands/manifest.yml` 扩展为 `commands/**/manifest.yml` 集合模型；根 manifest 保持默认 workspace collection，Component 可拥有独立 Command collection。
- 将 OpenSpec 作为首个随包 Component，统一管理 OpenSpec Command collection 与 workflow Skills；不包含 Project Scaffold，也不修改或删除 Project 中的 OpenSpec 内容。
- Component 更新使用已安装 `component.yml`、workspace 实际成员和当前 package 定义进行三方比较，避免把正常版本升级误判为用户修改，或静默覆盖真实修改。
- **BREAKING**：迁移后 OpenSpec Skills 不再作为彼此独立的 Builtins 管理；Component 成员不能单独通过 `builtin`、`skills` 或 `commands` 删除，必须通过 Component 生命周期操作。
- 不引入 Project/Service Component、远程 Component registry、任意 Hook、外部 CLI 自动安装或 OpenSpec 契约门禁实现。

## Capabilities

### New Capabilities

- `managed-components`: 定义 workspace Component 的 manifest、定义文件、成员所有权、安装/更新/卸载、三方比较、runtime reconcile 与 OpenSpec 首个组件行为。

### Modified Capabilities

- `command-line-tool-assets`: 支持 `commands/**/manifest.yml` Command collections、聚合检查、集合冲突和 Component 所有权。
- `buildr-package-assets`: 允许 package manifest 声明并校验随包 workspace Components 及其定义、成员、版本和 integrity。
- `buildr-product-capability-sync`: 让 update/sync 按 Component 状态物化产品能力，并迁移 OpenSpec 独立 Builtins 为统一 Component。
- `root-organization-workspace`: 将 `components/`、`components/manifest.yml` 和 Commands collections 纳入 workspace 源资产基线。
- `agent-readable-doctor`: 聚合 Component 状态、成员完整性、Command collection 冲突和 runtime 同步结果。
- `product-agent-skills`: 增加安装对象分析与 Component 路由，并明确 Component 与单项 Rule、Skill、Command 维护入口的分工。

## Impact

- 影响 Buildr CLI 的 Component、Commands、Builtin、update、sync 和 doctor 路径。
- 影响 `package/manifest.yml`、`package/targets/workspace/`、workspace baseline 与产品验证脚本。
- Component 成员所有权以 `component.yml` 为事实来源，Rules、Skills 条目不新增重复的 Component 所有权字段。
- 需要迁移现有 workspace 中的 OpenSpec Skills，并处理已修改、缺失或已单独卸载的旧状态。
- 需要更新 Buildr Skill、Buildr Core、产品文档、current state、bootstrap contract 和端到端验证。
