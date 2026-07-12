## Why

当前 Buildr 将 workspace/project Skills 统一建模为 `skills/manifest.yml` 加本地完整源目录。这适合团队自定义 Skill，但对产品随包或上游维护的默认 Skills 会导致 `buildr init` 复制大量 `SKILL.md` 源内容到用户 workspace，使默认 baseline 变重，也模糊了“用户源资产”和“可由产品/registry 重建的引用资产”的边界。

现在需要优化 Skills 管理：保留本地源目录模式，同时允许 manifest 只声明可解析来源，让默认 Skills 像 Commands 一样轻量登记，但不把所有 Skill 内容强行压进清单。

## What Changes

- 为 workspace/project Skills manifest 增加引用型条目：Skill 可通过 `source` 声明产品随包、registry 或其他受支持来源，而不要求 workspace 中存在 `skills/<skill-id>/SKILL.md`。
- 保留本地源目录条目：团队自定义或需要直接维护内容的 Skill 继续通过 `path` 指向 `skills/<skill-id>/`，完整说明、脚本、模板、示例和引用材料仍保留在源目录。
- 明确 `path` 与 `source` 互斥，renderer/runtime check 必须能解析两类条目并报告来源冲突或不可解析来源。
- 调整默认 package baseline：产品提供的默认 workspace Skills 优先以 manifest 引用表达，不再默认复制对应 Skill 源目录到用户 workspace。
- 不改变 Commands 的 manifest-only 模型，不引入 service scope，不把本地 Skill 完整内容嵌入 YAML。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `product-agent-skills`: 修改 workspace/project Skills manifest 与维护命令契约，支持引用型 Skill 和本地源目录 Skill 并存。
- `buildr-package-assets`: 修改默认 workspace baseline 对随包 Skills 的映射要求，允许默认 Skills 只通过 manifest 引用进入 workspace。

## Impact

- 影响 `buildr skills add/remove/render`、runtime check 和 doctor 对 Skills manifest 的解析与诊断。
- 影响 `package/manifest.yml`、默认 `package/workspace/skills/manifest.yml` 和 package check 对 baseline 映射的校验。
- 需要迁移默认 OpenSpec Skills 的 baseline 表达，减少 init 后用户 workspace 中的默认 Skill 源文件。
- 不包含破坏性变更：已有 `path` 本地源目录 Skill 继续有效。
