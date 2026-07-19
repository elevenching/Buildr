## Why

Buildr 当前把 Skill 的源资产归属、Project 业务层级和 Agent runtime 可见范围统一建模为 workspace/Project scope，但 Agent Skills runtime 实际以用户目录和当前工作目录为发现边界，同名 Skill 还可以跨来源并存而不提供确定性覆盖规则。这使 Project Skill 的“使用范围”无法兑现，也让用户级安装、workspace 投射、同名升级和外部同名资产之间缺少可验证的治理契约。

## What Changes

- **BREAKING**：Buildr 只在 workspace 根 `skills/` 和 `skills/manifest.yml` 管理 Skill 源资产；Project 不再拥有 `skills/` 或 `skills/manifest.yml`，`skills add/remove` 不再接受 `projects/<project>` 作为资产维护 scope。
- 明确定义 Workspace 为 Buildr 治理根和 Agent 工作目录；Project 只作为 workspace 内的业务、依赖和能力需求节点，不作为 Skill 安装、发现或隔离边界。
- **BREAKING**：将 Skill runtime 投射目标显式区分为用户层与当前 workspace/工作目录层；同一 workspace Skill 可按明确目标 render，但不能依靠 Project 路径表达使用范围。
- Project 可以引用 workspace Skill、声明 capability requirement、binding 或适用性信息；这些声明用于语义路由和 readiness 检查，不承诺 Agent runtime 的访问隔离。
- 为 Buildr 受管 Skill 建立来源、所有 workspace、版本/integrity、源摘要、runtime 摘要和投射目标回执，使同一资产的幂等投射、受控更新、所有权转移和安全卸载可区分。
- 定义 Buildr 自己的冲突治理：同 ID 同内容幂等；同 ID 同一资产演进线允许受控更新；同 ID 不同来源或所有者为名称冲突并阻止候选投射；不同 ID 提供相同 capability 时继续通过显式 binding 选择。
- Buildr 在投射前检查候选 ID 涉及的当前 Agent 有效 Skills 集。与 plugin、system、人工安装或其他 workspace 的同名 Skill 相遇时，不采用 Agent runtime 的“同名共存”作为确定性保证，而是报告来源和可执行解决路径并保持零部分写入。
- 同一 Agent 有效发现范围内，同一 Buildr Skill ID 最多保留一个有效投射；用户层已有同一受管资产时，workspace render 记录 `satisfied-by-user`，不再产生重复副本。
- 为现有 Project Skill 源资产提供保守迁移：先检测同 ID 内容和 ownership 冲突，再迁移或引用到 workspace manifest；无法无歧义收敛时停止并保留现场。
- 更新 init、sync、doctor、runtime adapter、Component/package baseline、CLI 帮助和产品文档，使它们统一使用 workspace Skill 源与 user/workspace render target 术语。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `root-organization-workspace`: 移除 Project Skill 源目录 baseline，并明确 Workspace、工作目录和 Project 的 Skill 边界。
- `project-registry`: 将 Project Skill 资产改为对 workspace Skill/capability 的逻辑引用与需求声明。
- `managed-skill-assets`: 将 Skill 源维护收敛到 workspace，新增 user/workspace 投射目标、ownership receipt、冲突分类和迁移契约。
- `workspace-first-runtime-projection`: 按用户层与 workspace 层发现根生成投射计划，并在写入前检查有效 Skill 集和重复投射。
- `skill-capability-contracts`: 移除 Project Skill provider scope 继承，保留 Project capability 需求/绑定语义，并要求不同 provider 使用不同 Skill ID。
- `product-agent-skills`: 更新 Buildr Skill 对 Skill 创建、安装、render、冲突和迁移的用户意图路由。
- `human-agent-onboarding`: 调整 init/sync/runtime guidance，不再把 Project Skills 作为 Agent runtime render capability。
- `buildr-package-assets`: 移除默认 Project Skill baseline 和 workspace/project Skill package 映射，更新临时 workspace 验证契约。
- `cli-product-surface`: 调整 `skills add/remove/render` 的公开 scope、render target、冲突 diagnostics 和 breaking migration 说明。
- `agent-first-product-positioning`: 更新公开产品模型，将 Project 从 Skill runtime scope 改为业务与能力需求节点。

## Impact

- CLI：`skills add/remove/render/bind/unbind`、`render`、`sync`、`init`、`doctor`、runtime check 和迁移入口。
- 数据模型：`buildr.skills/v2` 或其后续 schema、projection receipt、用户层安装 ownership receipt、Project registry/capability 引用。
- Runtime adapters：Codex、Claude Code、Cursor、Qoder、TRAE、TRAE Work 和 WorkBuddy 的用户级/工作目录级 Skills root、发现集合检查和 activation guidance。
- Package/Components：workspace baseline、Project template、内置 Skill descriptor、Component ownership/contribution 和 package verification。
- 兼容性：已有 `projects/<project>/skills/`、Project bindings、同名 workspace/Project Skill、用户层未受管 Skill 以及历史 runtime receipts 都需要显式迁移或诊断。
- 文档与测试：产品定位、CLI reference、adapter 文档、capability contract 文档、known limitations、fixtures、unit/contract/integration/E2E 与 candidate verification。
