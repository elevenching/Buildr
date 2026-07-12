## MODIFIED Requirements

### Requirement: 随包资产使用 product/package manifest
Buildr MUST 使用 `product/package/manifest.yml` 声明产品随包资产和用户 workspace baseline。

#### Scenario: 随包资产边界
- **WHEN** Buildr 发布产品包或校验 package baseline
- **THEN** 发布包和 baseline MUST 只包含产品 root 内 `package/manifest.yml` 显式声明或引用的资产和 CLI 运行所需文件

#### Scenario: 开发资产引用随包资产
- **WHEN** Buildr 产品开发需要验证初始化或 runtime baseline
- **THEN** package manifest MAY 引用产品 root 下的 `package/` 随包资产源

#### Scenario: 默认规则源进入随包规则目录
- **WHEN** Buildr 维护默认 workspace/project 规则 baseline
- **THEN** 默认规则源 MUST 位于产品 root 下的 `package/workspace-rules/`
- **AND** package manifest MUST 从 `package/workspace-rules/` 显式引用默认 workspace/project 规则源

#### Scenario: 随包资产不得引用开发 overlay
- **WHEN** Buildr 校验 `product/package/manifest.yml`
- **THEN** package baseline MUST NOT 引用产品仓根特有规则、私有业务项目、私有组织名或私有路径

#### Scenario: 通用根规则进入随包规则源
- **WHEN** Buildr 维护默认 root 工作规则
- **THEN** 通用规则 MUST 以产品 root 下 `package/workspace-rules/` 中可独立维护的规则文件作为源
- **AND** package manifest MUST 显式引用允许发布的规则文件，不得默认发布整个 `rules/` 目录
