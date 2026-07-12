## Why

Buildr Core 已明确 Rule 只承载基础模型、长期原则和硬边界，场景化流程应优先沉淀为 Skill；但当前产品随包仍发布多个 optional 内置 Rule，用来描述 OpenSpec、任务分流、worktree 和 Git 操作流程。继续把这些流程放在 Rule 层会扩大默认规则负担，也会让 Rule manifest 的 `description` 继续承担 Skill routing 的职责。

现在需要把现有内置 Rule 重新分层：保留真正必须常驻的 ontology 和 invariant，把任务触发型流程迁移到内置 Skills。Buildr 仍处于 MVP 自举阶段，本次不设计旧 optional Rule 的外部兼容迁移。

## What Changes

- 保留 `buildr-core` 作为唯一 required 内置 Rule，继续承载 Buildr 基础模型、资产边界和必须常驻的硬边界。
- 将 `buildr-task-triage` 转为 `task-triage` Skill，用于从用户任务意图判断影响范围和后续处理方式。
- 将 `buildr-worktree` 转为 `task-worktree` Skill，用于任务 worktree 的创建、使用、保留和清理边界。
- 将 `buildr-git` 转为 `git-ops` Skill，用于 Git 意图消歧、授权边界、提交策略和远端安全默认值；不作为 Git 命令教程。
- 删除 `buildr-openspec` Rule，不迁移为 Buildr 自有 Skill，也不保留 OpenSpec workflow 索引；OpenSpec 意图由现有 `openspec-*` Skills 自行匹配。
- 调整 package manifest、默认 workspace baseline、package check 和验证脚本，使产品不再把场景化流程作为 optional Rules 发布。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `buildr-package-assets`: 调整产品 package 中内置 Rules 与内置 Skills 的发布边界，确保 procedural guidance 以 Skill 形式进入默认 workspace。
- `product-agent-skills`: 增强 Buildr Skill 与内置 workspace Skills 的职责说明，让 Agent 通过 Skills 处理任务分流、OpenSpec、worktree 和 Git 操作流程。

## Impact

- 影响随包源资产：`package/manifest.yml`、`package/workspace/rules/`、`package/workspace/skills/`、`package/workspace/rules/manifest.yml`、`package/workspace/skills/manifest.yml`。
- 影响 Buildr CLI 的 package check 和产品验证脚本中对 baseline 文件的断言。
- 影响产品文档、Buildr Skill、bootstrap guide 和 OpenSpec current state 中关于内置 Rules/Skills 的说明。
