## Why

Buildr 当前把用户日常入口、兼容旧调用的入口和产品维护命令平铺在同一份主帮助与“Current CLI Surface”清单中，导致已实现不等于应被普通用户依赖，deprecated no-op 参数也仍被 bootstrap 主路径推荐。现在需要建立可验证的产品表面分层，使 help、文档、spec 和测试对正式承诺、兼容边界与内部用途表达一致。

## What Changes

- 建立 public、legacy compatibility、internal/maintenance 三类产品表面，并规定主帮助、主题帮助、主产品文档和维护文档各自展示哪些类别。
- 保留 `package check` 与 `package build` 的现有功能和安全契约，将它们定位为产品维护、验证和发布命令，不再混入普通 workspace 用户主路径。
- 保留 `package:<id>` 的现有数据语义，将其明确为 package manifest 与随包 Skill 解析链使用的内部 source identity；不得作为用户资产 id 或 `skills add` 的公开输入推荐。
- 将 `service create --rules` 明确为 legacy compatibility no-op：继续接受旧调用并输出迁移提示，但不读取该路径、不写入 Service metadata，也不再出现在主帮助和 bootstrap canonical 示例中。
- 盘点并记录其他现有兼容表面，包括未传 `--agent` 的 doctor、旧 Service scope shorthand、旧 registry/metadata 迁移与已退出资产目录；兼容实现保留，但 canonical 输出和修复建议不得反向推荐 legacy 形式。
- 调整 CLI help、当前事实文档、产品说明、bootstrap guide 和相关验证，使同一入口的分类、用途与可见性一致。
- 不删除现有 CLI 命令，不改变 Components、OpenSpec、Service metadata 或 managed-data-integrity 的数据语义；不回改历史 archive。
- 本 change 不包含破坏性变更。

## Capabilities

### New Capabilities

- `cli-product-surface`: 定义 Buildr CLI 与关联数据标识的 public、legacy compatibility、internal/maintenance 分类、可见性和兼容边界。

### Modified Capabilities

无。

## Impact

- CLI：`tools/buildr` 的主帮助、`service create` 主题帮助和兼容提示。
- 随包入口：`package/bootstrap/guide.md` 与 Buildr Agent Skill 中的 canonical 命令说明。
- 产品事实：`docs/buildr-product.md`、`openspec/knowledge/buildr-current-state.md`、产品 README 和维护文档。
- 验证：help 无副作用断言、legacy `--rules` 兼容测试、package 维护命令与内部 `package:<id>` 边界检查。
- 无新增外部依赖，不修改历史 archive。
