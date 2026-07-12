## Why

Git Ops 目前没有统一的提交信息格式，Core 也没有定义独立于 Skill 生命周期的默认提交语言。需要明确格式与语言的资产边界，使提交信息稳定、简洁且不随 Git Ops 卸载而失效。

## What Changes

- Git Ops Skill 提供精简的 Conventional Commits 格式、类型选择和生成规则。
- Buildr Core 规定无更具体约定时提交信息默认使用中文。
- Git Ops Skill 遵循 Core 和更具体的项目或仓库约定；卸载 Git Ops 不影响 Core 默认语言。
- 产品验证覆盖提交格式和 Rule/Skill 分层契约。
- 不包含破坏性变更。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `product-agent-skills`: 明确 Git Ops 的提交信息格式、生成规则及其与 Core 语言约束的关系。
- `buildr-package-assets`: 在 required Core 中提供默认中文提交语言，并验证其独立于 Git Ops 生命周期生效。

## Impact

- 修改随包 Buildr Core、Git Ops Skill 和产品验证。
- 更新产品 OpenSpec 与验证脚本。
- 不修改 Git 仓库内容，不增加 commit hook 或 CLI 强制校验。
