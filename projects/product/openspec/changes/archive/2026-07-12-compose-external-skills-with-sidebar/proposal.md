## Why

OpenSpec workflow Skills 当前以 `skills/buildr/openspec-*` 的 Buildr fork 形式交付，混淆了外部上游资产和 Buildr sidebar 的所有权，也使上游升级必须重新合并 Buildr 私有正文。与此同时，workspace mutation 事务目录尚未自动加入 Git 忽略，异常残留可能进入用户的版本控制视图。

## What Changes

- **BREAKING**：OpenSpec Component 不再拥有或物化 `skills/buildr/openspec-*` fork，改为登记并安装保持上游内容的外部 OpenSpec workflow Skills。
- 扩展 Skill Contribution，使 Component sidebar 可以对没有 Buildr slot marker 的外部 Skill 进行非侵入式 prepend/append 组合，并只在 Agent runtime 生成派生版本。
- 保留 `openspec-contract-guard` 作为 Buildr 自有 sidebar 能力主体，以 contributions 将透明度、路径边界和契约门禁接入上游 OpenSpec 工作流及 Buildr 任务 Skills。
- OpenSpec 上游升级只更新外部 Skill 的 resolved source、版本和 integrity；Buildr sidebar 独立升级并进行兼容性验证。
- `init`、`update` 和 `sync` 确保 workspace 根 `.gitignore` 包含 `/.buildr/mutations/`，且不忽略需要持久化的 `.buildr/workspace.yml`。
- 更新迁移、卸载、runtime reconcile、doctor 和产品验证，覆盖旧 fork 到外部 Skill + sidebar 模型的安全收敛。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `managed-components`: 调整 OpenSpec Component 成员所有权，并支持对外部 Skill 的 sidebar contribution 组合。
- `managed-skill-assets`: 明确外部 resolved Skill 的本地物化、上游纯净性与 runtime 派生边界。
- `buildr-package-assets`: 调整 OpenSpec package 交付结构和验证契约。
- `buildr-product-capability-sync`: 增加旧 OpenSpec fork 的迁移与更新收敛行为。
- `managed-data-integrity`: 要求 mutation 临时状态在 workspace Git 视图中被精确忽略。

## Impact

- 影响 `package/manifest.yml`、workspace skills baseline、OpenSpec Component definition、上游 Skill package sources 和 sidebar fragments。
- 影响 Skills source assembly、Component validation、runtime render plan、builtin/component update migration 和 doctor。
- 影响 init/update/sync 的 `.gitignore` 收敛逻辑。
- 需要更新 Component、runtime adapter、package validation、临时 workspace E2E 和迁移 fixtures。
