## Why

`redesign-skill-scope-and-conflict-governance` 已把 workspace 确立为唯一 Skill source authority，并把 Project 收敛为 capability/applicability context，但部分 canonical requirements、产品说明和验证措辞仍沿用 workspace/Project Skill source 模型。继续保留这些相互矛盾的契约会让后续实现、验证和文档再次恢复已经废弃的 Project Skill 语义，因此需要在进入下一项资产模型重构前完成一次全量收敛。

## What Changes

- 清理 canonical specs 中把 Project 描述为 Skill source、manifest、安装范围或 runtime 可见性边界的残留要求。
- 将“project Skill discovery/root”统一重述为 workspace destination 下 Agent 原生 Skills root，或 Project capability/applicability context。
- 保留 legacy Project Skill migration 的显式兼容语义，不把历史输入重新解释为受支持的 Project source scope。
- 同步公开文档、产品入口 Skill、runtime adapter 指南、验证断言和错误文案，确保所有入口使用同一模型。
- **BREAKING**：任何仍把 Project `skills/manifest.yml` 当作当前受支持源资产的扩展或内部调用都不再具备契约依据，只能走 legacy migration。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `workspace-first-runtime-projection`: 删除 workspace/root/project Skills 解析与 Project Skill discovery 的当前态表述，统一为 workspace source 和 user/workspace destination。
- `human-agent-onboarding`: 统一 onboarding 中 Skill 投射、Project 专用 Skill 和 migration 指引。
- `buildr-package-assets`: 修正 package 验证仍要求维护 Project Skill manifest 的过期契约。
- `cli-product-surface`: 修正帮助、错误和迁移语义中的当前态 Project Skill 表述。
- `agent-first-product-positioning`: 将 runtime 可投射资产明确为 workspace Skills，而 Project 只提供业务上下文。
- `skill-capability-contracts`: 将 contract/provider source 收敛到 workspace registry，Project 只保留 requirements、bindings 与 applicability。
- `managed-skill-assets`: 修正文档目的和产品入口说明中的 workspace/project source 残留，同时保留 legacy migration requirements。
- `product-agent-skills`: 统一产品入口的 source authority、destination 和 Project context 路由措辞。

## Impact

- 影响 `openspec/specs/` 中上述 canonical capabilities 及其 delta contract。
- 影响 `docs/`、README、随包 Buildr Skill、runtime adapter 指南和相关 contract/package/runtime verification。
- 主要是契约与文案收敛；若验证暴露仍读取 Project Skill source 的实现路径，则必须删除或隔离到 legacy migration 入口。
- 不改变已交付的 user/workspace destination、冲突治理和 migration 数据安全保证。
