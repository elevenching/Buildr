## Why

Buildr 已具备本地 checkout、tarball 和跨平台验证闭环，但公开仓库仍包含占位 URL，npm identity 尚未绑定已创建的 `buildr-ai` scope，且缺少可重复执行的公开安全扫描与受控 RC 发布入口。现在需要先把这些发布前事实和门禁收口，才能安全地把干净快照推到公开 GitHub，并在后续阶段发布 `0.1.0-rc.1`。

## What Changes

- 将官方源码身份固定为 `https://github.com/elevenching/Buildr`，npm package identity 固定为 `@buildr-ai/buildr`，CLI executable 继续为 `buildr`。
- 以中文 `README.md` 作为主入口，新增仅对应 README 的英文翻译 `README.en.md`；其他文档继续遵循项目管理语言。
- 补齐公开 package metadata、MIT 署名、反馈与安全入口，并移除公开材料中的 URL 占位符。
- 新增可重复执行的开源安全扫描，检查当前候选 tree、公开文本、异常大文件和 npm tarball inventory，并进入产品验证与 CI。
- 新增只由 release tag 和受保护 GitHub Environment 驱动的 RC/正式发布 workflow；本 change 只准备 workflow，不推送公开 GitHub、不创建 tag、不发布 npm。
- 要求 Buildr 产品完整验证的开发报告包含总耗时、最慢阶段、失败阶段和 timing summary 路径，但不设置性能阈值。
- 本 change 不包含公开 GitHub 的外部 push、仓库设置修改、首次 npm publish 或 trusted publisher 配置。

本次 package 名称尚未正式发布，不构成对既有 registry 用户的破坏性变更；对开发 checkout 的 CLI 命令保持兼容。

## Capabilities

### New Capabilities
- `open-source-release-governance`: 定义公开仓库身份、中英文 README、候选安全扫描和受控 GitHub/npm release 准备边界。

### Modified Capabilities
- `npm-cli-package`: 将公开 registry package identity 和 metadata 收敛为 `@buildr-ai/buildr`，并定义 RC/正式 dist-tag 语义。
- `buildr-cli-self-update`: 将 registry package 自更新约束绑定到新的 `@buildr-ai/buildr` identity，并补齐既有 canonical spec Purpose。
- `product-verification-quality`: 将开源安全扫描纳入候选验证，并要求 timing summary 能支持开发完成报告。
- `buildr-development-openspec`: 要求 Buildr 产品任务的最终验证报告主动呈现耗时摘要，且只翻译公开 README。

## Impact

- 影响 workspace 根 `README.md`、新增 `README.en.md`、`LICENSE`、`CONTRIBUTING.md`、`SECURITY.md` 和公开模板中的 canonical URL。
- 影响 `projects/product/package.json`、package lock、package metadata/static validation、release checklist、known limitations 和 current-state knowledge。
- 新增开源候选安全 verifier、相关测试和 GitHub release workflow，并调整完整产品验证与 CI。
- 影响 `projects/product/AGENTS.md` 的 Buildr 产品开发完成报告约定；不改变用户 workspace Rules、Skills、Components、Commands 或 runtime adapter。
