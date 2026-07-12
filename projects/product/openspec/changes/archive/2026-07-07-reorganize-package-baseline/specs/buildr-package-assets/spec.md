## MODIFIED Requirements

### Requirement: 随包资产使用 package manifest
Buildr MUST 使用产品 root 下的 `package/manifest.yml` 声明产品随包资产和用户 workspace baseline。

#### Scenario: 随包资产边界
- **WHEN** Buildr 发布产品包或校验 package baseline
- **THEN** 发布包和 baseline MUST 只包含产品 root 内 `package/manifest.yml` 显式声明或引用的资产和 CLI 运行所需文件

#### Scenario: 开发资产引用随包资产
- **WHEN** Buildr 产品开发需要验证初始化或 runtime baseline
- **THEN** package manifest MAY 引用产品 root 下的 `package/` 随包资产源

#### Scenario: 默认 workspace baseline 源进入 package workspace 目录
- **WHEN** Buildr 维护默认 workspace baseline
- **THEN** 默认 workspace 规则、README、workspace metadata、Git ignore 模板、命令行工具清单入口和 workspace Skills 源 MUST 位于产品 root 下的 `package/workspace/`
- **AND** package manifest MUST 从 `package/workspace/` 显式引用默认 workspace baseline 源

#### Scenario: 默认 Project 模板源归属 workspace projects 容器
- **WHEN** Buildr 维护默认 Project baseline 文件
- **THEN** 默认 Project 模板源 MUST 位于产品 root 下的 `package/workspace/projects/`
- **AND** package manifest MUST 从 `package/workspace/projects/` 显式引用默认 Project baseline 文件

#### Scenario: 随包资产不得引用开发 overlay
- **WHEN** Buildr 校验 `package/manifest.yml`
- **THEN** package baseline MUST NOT 引用产品仓根特有规则、私有业务项目、私有组织名或私有路径

#### Scenario: 通用根规则进入 workspace baseline 规则源
- **WHEN** Buildr 维护默认 root 工作规则
- **THEN** 通用规则 MUST 以产品 root 下 `package/workspace/rules/` 中可独立维护的规则文件作为源
- **AND** package manifest MUST 显式引用允许发布的规则文件，不得默认发布整个 `rules/` 目录
