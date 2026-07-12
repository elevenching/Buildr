## Why

Buildr 当前把 `practices/` 列为 Organization 和 Project 的核心资产并在初始化时创建目录，但没有对应的索引、发现、诊断或维护协议；这会让空目录和含糊的“实践”概念扩大产品表面，却不能形成可治理闭环。团队经验最终应按约束、可复用动作、产品事实或普通说明分别沉淀为 Rule、Skill、OpenSpec 或 docs，因此现在应移除独立 Practices 资产模型。

## What Changes

- **BREAKING**：新 workspace 和新 Project 的 baseline 不再创建 `practices/`，产品当前资产清单、Project 模板和诊断基线也不再要求该目录存在。
- **BREAKING**：Buildr 不再将 Practices 描述为 Organization、Project 或 runtime source asset；产品文档和随包自然语言资产改为使用 Rule、Skill、OpenSpec 与 docs 的明确边界。
- 保留已有 workspace 和 Project 中的 `practices/` 目录及其内容；`init`、`update`、`sync`、`project create` 和 doctor 不得删除、覆盖、迁移或因该遗留目录阻塞正常操作。
- 为遗留 `practices/` 提供温和的迁移说明：约束转为 Rule，可复用操作流程转为 Skill，产品事实与需求变更转为 OpenSpec，其他说明保留为普通 docs；迁移由用户审阅后显式完成。
- 保留 OpenSpec archive 和历史文档原文，不回写历史记录。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `root-organization-workspace`: 从 workspace/Project baseline 移除 `practices/`，并明确遗留目录的数据保留与非阻塞兼容。
- `organization-model`: Organization 当前资产路径不再包含独立 Practices 类型。
- `buildr-workspace-management`: 长期管理资产库的当前能力边界不再包含 Practices。
- `project-registry`: Project 资产边界不再把 Practices 列为独立类型。
- `workspace-first-runtime-projection`: runtime source asset 说明不再把 Practices 列为受治理资产。
- `human-agent-onboarding`: Project 资产识别和 onboarding 说明不再依赖 Practices 类型，并提供遗留内容分类迁移引导。
- `product-agent-skills`: Buildr Skill 的本地作者型 Skill 说明不再使用可能被误解为 Practices 资产类型的“项目实践”措辞。

## Impact

- 随包契约：`package/manifest.yml` 的 workspace/Project directory baseline。
- CLI 与诊断：Project baseline 状态、doctor 输出以及 init/update/sync/project create 的目录创建行为。
- 自然语言资产：Product README、产品主文档、Project 规则模板、Buildr Core 与 Buildr Skill 随包源。
- 测试与发布验证：package check、workspace/Project 创建 E2E、managed mutation/data-integrity 验证和 npm pack smoke。
- 不影响已有 `practices/` 数据，不修改历史 OpenSpec archive；roles/prototype、`service create --rules`、内部 package 标识、`package build`、权限门禁和 Component/OpenSpec 生命周期不在本 change 范围内。
