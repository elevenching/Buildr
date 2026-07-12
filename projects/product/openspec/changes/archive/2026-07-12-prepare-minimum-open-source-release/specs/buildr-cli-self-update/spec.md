## MODIFIED Requirements

### Requirement: 发布模式更新 registry package
发布模式 update MUST 查询当前 package 配置的 npm registry，并只更新同一 `@buildr-ai/buildr` package identity。

#### Scenario: registry 存在新版本
- **WHEN** registry 报告兼容的新版本且当前安装位置可安全更新
- **THEN** Buildr MUST 使用 npm 更新承载当前 executable 的 `@buildr-ai/buildr` package
- **AND** Buildr MUST NOT 改变 registry、scope、tag 或安装 prefix

#### Scenario: registry 已是最新版本
- **WHEN** registry 可达且当前版本不低于可用版本
- **THEN** Buildr MUST 报告 CLI 已是最新版本
- **AND** Buildr MUST NOT 重装 package 或同步 workspace

#### Scenario: registry 更新受阻
- **WHEN** registry 不可达、版本不兼容、权限不足或安装位置无法安全解析
- **THEN** Buildr MUST 停止且不得请求提权或切换 registry
- **AND** Buildr MUST 返回可供 Agent 解释的阻塞原因和下一步
