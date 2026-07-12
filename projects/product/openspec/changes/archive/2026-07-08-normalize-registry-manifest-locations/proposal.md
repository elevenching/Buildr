## Why

`projects.yml` 和 `services.yml` 是管理 Project、Service 集合的长期资产，但当前位置放在父级根目录，和 `rules/manifest.yml`、`skills/manifest.yml`、`commands/manifest.yml` 的“资产目录内 manifest”心智不一致。

现在 Buildr 已经引入 manifest-first 的 Rules、Skills、Commands 管理模型，Project 和 Service registry 也应统一成目录内 `manifest.yml`，让目录结构本身表达资产类型和空集合状态。Project/Service manifest 只管理 Project/Service 集合本身，不接管 rules、skills、commands、openspec、practices 等其他资产。

## What Changes

- **BREAKING**：将 root Project registry 的事实源从 `projects.yml` 替换为 `projects/manifest.yml`；旧 `projects.yml` 不做内容迁移。
- **BREAKING**：将 Project service metadata 从 `projects/<project>/services.yml` 迁移为 `projects/<project>/services/manifest.yml`。
- `projects/` 和 `projects/<project>/services/` 应始终存在；即使集合为空，也通过空 manifest 表达结构识别。
- Project/Service manifest 使用领域 schemaVersion，并采用封闭 schema；未知字段由 `doctor` 提示，`update/sync` 清理。
- `skills/manifest.yml` 补齐 `schemaVersion: buildr.skills/v1`，与 Rules、Commands manifest 对齐。
- `projects.yml` 属于未启用旧能力，`update/sync` 发现后直接清理；已有 Project 目录由 `update/sync` 扫描生成最小 entry。
- 旧 `projects/<project>/services.yml` 做最小转换到 `services/manifest.yml`，转换后删除；未知字段不迁移。
- `create/update/sync` 维护独立 Git repo 的最近上级 Git 边界 `.gitignore`。
- CLI、doctor、package baseline、Buildr Skill 和验证脚本需要支持新路径和新 schema。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `project-registry`：Project registry 的事实源从 root `projects.yml` 调整为 `projects/manifest.yml`。
- `service-asset-indexing`：Service metadata 的事实源从 Project root `services.yml` 调整为 `services/manifest.yml`。
- `root-organization-workspace`：初始化、Project baseline 和 workspace 结构识别需要使用新的 manifest 路径。
- `product-agent-skills`：workspace/project `skills/manifest.yml` 需要声明 `schemaVersion: buildr.skills/v1`。

## Impact

- CLI：`init`、`project create`、`service create`、`doctor`、package check、workspace 读写 helper。
- Package：`package/workspace/projects/manifest.yml`、`package/workspace/projects/AGENTS.project.md`、Project baseline。
- Docs/Skill：Buildr Skill、bootstrap/current-state、OpenSpec specs。
- 兼容：MVP 开发期旧布局需要收敛；`projects.yml` 直接清理，`services.yml` 最小转换，Project/Service entry 可从目录事实补齐。
