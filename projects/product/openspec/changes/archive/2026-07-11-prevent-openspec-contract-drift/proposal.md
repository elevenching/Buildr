## Why

OpenSpec 目前只能校验单个 change 和 spec 的结构，无法发现多个 change 修改同一 Requirement、陈旧 delta 基于旧主规格继续同步，或同步结果删除了未声明要删除的契约；Buildr 已经发生过主规格被后续归档的陈旧 change 回退，而现有 strict validation 仍然通过。现在 OpenSpec 已作为可独立升级的 Component、`task-finish` 也已成为 Buildr 自有 sidebar，具备在不修改外部 OpenSpec CLI 和 Skills 的前提下增加稳定门禁的架构基础。

## What Changes

- 新增 Buildr 自有的 OpenSpec 契约门禁 CLI，记录 change 所触达主规格的 Requirement 基线，并检查 proposal capability、delta spec 和基线的一致性。
- 在同步或归档前阻止同一 capability/Requirement 的活动 change 冲突、陈旧基线和不完整基线；同步后验证 delta 已落实且未声明触达的 Requirement 与 Scenario 未被破坏。
- 为历史 active change 提供显式基线采用路径；无法证明当前主规格就是原始基线时保持阻塞，不自动猜测或覆盖。
- 新增 Buildr 自有的 `openspec-contract-guard` workspace Skill，并作为 OpenSpec Component 的 sidebar 成员交付；外部 `openspec-*` workflow Skills 和 OpenSpec CLI 保持原样、可随上游版本独立更新。
- OpenSpec Component 通过声明式 Skill Contribution 把门禁说明组合到 `task-triage` 和 `task-finish` 的稳定插槽；通用 Skill 源不直接包含 OpenSpec 门禁逻辑，Component 卸载并重新渲染后相关说明完全消失。
- 将门禁接入 change 建立、同步归档和 Buildr 产品验证，并提供 Agent-readable JSON 诊断与可执行下一步。
- OpenSpec Component 升级时校验门禁与声明的上游版本兼容；未经验证的上游版本不得静默绕过门禁。
- 不包含破坏性 API 或 schema 变更；已有 active change 若缺少基线，需要一次显式采用后才能进入受保护的同步或归档流程。

## Capabilities

### New Capabilities

- `openspec-contract-guard`: 定义 OpenSpec change 契约基线、跨 change 冲突检测、同步前后门禁、兼容性诊断和 CLI 行为。

### Modified Capabilities

- `managed-components`: OpenSpec Component 增加 Buildr 自有门禁 sidebar 成员，同时保持上游 CLI、workflow Skills 和 Project OpenSpec 数据边界。
- `product-agent-skills`: 增加声明式 Skill Contribution 渲染能力；OpenSpec Component 安装时向 task triage 与 task finish 贡献门禁说明，卸载后不保留悬空依赖。
- `buildr-package-assets`: 将门禁 Skill 纳入 package、Component integrity 和产品验证，覆盖安全同步、冲突、陈旧基线、破坏性结果与上游兼容性。

## Impact

- 影响 `tools/buildr` 的 CLI surface、OpenSpec 解析与 Agent-readable 输出，以及 `tools/verify-buildr-product*` 的验证入口和 fixtures。
- 影响随包 OpenSpec Component definition、workspace Skills manifest、Skill Contribution fragments、`task-triage`、`task-finish`、相关 package 校验和 runtime 投射。
- active change 内会增加 Buildr 管理的契约基线 sidecar；它随 change 一起归档，但不改变 OpenSpec 自有 artifact 格式。
- 影响产品文档、current-state knowledge 和对应 OpenSpec 主 specs；不修改外部 OpenSpec CLI 或 `openspec-*` Skills 的源内容。
