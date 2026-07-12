## Why

Buildr 已经用 `rules/manifest.yml` 表达 Rules 的事实清单和完整性检查，但用户管理 Rules 仍只能手工维护 manifest，容易出现新增规则未登记、删除规则后残留、description 缺失等资产漂移。

同时，现有说明把 Rule/Skill 的差异过度绑定到“是否必须加载”。这不符合当前产品心智：Rule 控制 Agent 的价值观、边界和约束，Skill 封装可复用的专业动作；Buildr CLI 应约束资产边界和完整性，而不是替 Agent 预设上下文决策。

## What Changes

- 新增 `buildr rules add` 和 `buildr rules remove`，作为 root/Organization 级 `rules/manifest.yml` 的用户规则维护入口。
- `rules add/remove` 只维护 Rules 源资产边界和 manifest 完整性，不改写 `AGENTS.md` 正文，不自动执行 runtime render。
- `rules add` 必须注册已存在的 root `rules/*.md` 文件；未传 `--path` 时默认使用 `rules/<id>.md`；要求 description，并将其作为 Agent 判断规则语义相关性的索引，而不是人预设的路径/角色路由表。
- `rules remove` 必须删除 manifest entry 和对应规则文件；仅在显式 `--keep-file` 时保留规则文件，后续由 doctor 将保留文件报告为未登记规则文件。
- Buildr 必须保护 `source: buildr` 且 `required: true` 的内置规则，用户不得通过 `rules remove` 删除 required builtins。
- 调整 Rule/Skill 分层说明：
  - Rule 控制 Agent 的价值观、边界和约束。
  - Skill 封装可复用的专业动作和操作流程。
  - Rule 和 Skill 不以“是否必须加载”作为本质区分。
- 调整现有 specs 中“不得使用 rules add/remove”的要求，改为要求 Agent 使用 rules CLI 维护规则清单，并由 Agent 根据用户目标、修改范围、代码语义和 Rule description 判断相关规则。
- 不引入 `appliesTo.roles`、`appliesTo.paths` 等结构化路由字段；Buildr 不要求用户提前为新增服务维护规则匹配表。
- 本次不扩展 Project 级 `rules/manifest.yml`；Project 仍通过 `projects/<project>/AGENTS.md` 承载项目级规则入口。
- 不包含破坏性变更；新增命令补齐维护入口，现有手工维护 manifest 的方式仍然可用。

## Capabilities

### New Capabilities

- 无。

### Modified Capabilities

- `buildr-package-assets`: 将 package check 对 rules add/remove 的要求从“必须不存在”改为“必须能维护 root Rules manifest，且不自动写 runtime”。
- `product-agent-skills`: 调整 Buildr Skill 的 Rule/Skill 分层和规则维护引导，要求 Agent 使用 rules CLI 维护 manifest，并基于 Rule description 和实际上下文判断相关规则。
- `root-organization-workspace`: 调整默认 workspace 规则维护要求，允许并推荐 `rules add/remove` 维护 root Rules 源资产清单。
- `agent-readable-doctor`: 调整 Rules 诊断建议，使未登记规则、缺失规则和 metadata 问题可指向 `rules add/remove` 或手工修复。
- `workspace-first-runtime-projection`: 调整 rules manifest 的语义，明确 description 是规则语义索引，不是结构化路由配置；runtime 投射仍只负责让当前 Agent 能读取规则入口。

## Impact

- CLI：新增 `rules add`、`rules remove` help、参数解析、manifest 读写和保护 required builtin 的错误路径。
- Doctor：Rules 相关 finding 的 suggestion/command 需要更新。
- Package check 和 MVP 验证：覆盖 rules add/remove 主路径、required builtin 保护、默认不删文件、显式删文件和不自动 render。
- Buildr Skill、bootstrap guide、README/current state/release checklist：更新规则维护入口和 Rule/Skill 分层说明。
- Specs：移除“rules add/remove 不存在”的要求，补充 Buildr CLI 不替 Agent 做上下文决策的边界。
