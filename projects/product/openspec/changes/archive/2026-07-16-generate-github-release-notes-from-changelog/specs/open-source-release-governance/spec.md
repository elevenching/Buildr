## ADDED Requirements

### Requirement: GitHub Release 必须使用匹配版本的 changelog
Buildr MUST 将根 `CHANGELOG.md` 中与目标 package version 精确匹配的版本章节作为 GitHub Release 的具体发布说明来源，并 MUST 在 npm publish 前完成提取和校验。

#### Scenario: 为目标 tag 生成具体发布说明
- **WHEN** tag 驱动的 release workflow 已解析出目标 package version
- **THEN** workflow MUST 从 `CHANGELOG.md` 提取唯一的 `## <version> - <YYYY-MM-DD>` 章节
- **AND** GitHub Release body MUST 包含该章节的具体内容且不得包含相邻版本章节
- **AND** workflow MUST NOT 只使用 GitHub 自动生成的 PR 摘要替代该内容

#### Scenario: 目标版本发布说明无效
- **WHEN** 目标版本章节缺失、重复或没有非空正文
- **THEN** release notes 生成 MUST 返回非零状态并提供可执行诊断
- **AND** workflow MUST 在 registry write 或 npm publish 之前停止
- **AND** workflow MUST NOT 静默回退到自动生成的 Release body

#### Scenario: 创建候选版 GitHub Release
- **WHEN** 已验证的 prerelease tag 触发 GitHub Release 创建
- **THEN** workflow MUST 使用预先生成的 notes file
- **AND** workflow MUST 校验远端 tag 已存在
- **AND** GitHub Release MUST 标记为 prerelease 且 MUST NOT 标记为 Latest

#### Scenario: 创建稳定版 GitHub Release
- **WHEN** 已验证的 stable tag 触发 GitHub Release 创建
- **THEN** workflow MUST 使用预先生成的 notes file
- **AND** workflow MUST 校验远端 tag 已存在
- **AND** GitHub Release MUST NOT 标记为 prerelease
