## Why

当前 publish workflow 只使用 GitHub 自动生成 release notes；当 `dev -> main` 通过单个 squash PR 收敛时，GitHub Release 只能展示发布 PR 标题，无法呈现 `CHANGELOG.md` 中已经维护的具体版本变化。后续发布需要让版本级 changelog 成为 GitHub Release 的可审阅事实来源，并在 npm publish 前阻止缺失或错配的发布说明。

## What Changes

- 从根 `CHANGELOG.md` 精确提取与目标 package version 对应的版本章节，生成 GitHub Release body。
- 在不可逆的 npm publish 前校验目标版本章节存在、唯一且包含具体内容；校验失败时终止 workflow。
- 创建 GitHub Release 时使用生成的 notes file、校验远端 tag 已存在，并确保 prerelease 不被标记为 Latest。
- 在发布准备流程中要求预览目标版本的最终 release notes，并在发布后验证 Release body 与目标版本匹配。
- 补充 release notes 提取器与 publish workflow 的低成本契约测试。
- 本变更不包含破坏性 CLI 或 package API 调整。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `open-source-release-governance`: 新增 GitHub Release body 必须来自匹配版本 changelog、在 publish 前 fail closed，并保持 prerelease 展示语义正确的发布契约。

## Impact

- 影响根 `.github/workflows/publish.yml`、`CHANGELOG.md` 的版本章节格式约束和 Product release verifier。
- 影响 `projects/product/tools/verification/release/`、`projects/product/test/open-source-release.test.mjs`、发布检查清单及 Product Project 的 `buildr-release` Skill。
- 不新增运行时依赖，不改变已发布 package 内容、CLI 命令或 npm dist-tag 规则。
