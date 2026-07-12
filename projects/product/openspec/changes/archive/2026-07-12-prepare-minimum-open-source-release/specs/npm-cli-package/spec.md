## ADDED Requirements

### Requirement: 公开 registry package identity 必须稳定
Buildr 公开 npm package MUST 使用 `@buildr-ai/buildr` identity、`buildr` executable 和指向 `https://github.com/elevenching/Buildr` 的完整 registry metadata。

#### Scenario: 检查准备发布的 package
- **WHEN** 维护者运行 package check 或 `npm pack --json`
- **THEN** package name MUST 是 `@buildr-ai/buildr`
- **AND** repository、homepage 和 bugs MUST 指向 canonical GitHub repository
- **AND** `publishConfig.access` MUST 是 `public`
- **AND** package MUST 声明用于发现 CLI、Agent workspace 和开发工具的 keywords

### Requirement: npm 版本必须映射明确 dist-tag
Buildr release automation MUST 将 prerelease 版本发布到 `next`，将稳定版本发布到 `latest`，并 MUST 拒绝 tag 与 package version 不一致的候选。

#### Scenario: 发布 0.1.0 RC
- **WHEN** package version 是 `0.1.0-rc.1` 且 Git tag 是 `v0.1.0-rc.1`
- **THEN** release automation MUST 选择 npm dist-tag `next`

#### Scenario: 发布 0.1.0 正式版
- **WHEN** package version 是 `0.1.0` 且 Git tag 是 `v0.1.0`
- **THEN** release automation MUST 选择 npm dist-tag `latest`

#### Scenario: tag 与 package version 不一致
- **WHEN** release tag 去除 `v` 后不等于 `package.json#version`
- **THEN** release automation MUST 在 npm publish 前失败
