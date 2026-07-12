## ADDED Requirements

### Requirement: 随包资产使用 product/package manifest
Buildr MUST 使用 `product/package/manifest.yml` 声明产品随包资产和用户 workspace baseline。

#### Scenario: 随包资产边界
- **WHEN** Buildr 发布产品包或校验 package baseline
- **THEN** 发布包和 baseline MUST 只包含 `product/package/manifest.yml` 显式声明或引用的资产和 CLI 运行所需文件

#### Scenario: 开发资产引用随包资产
- **WHEN** Buildr 产品开发需要验证初始化或 runtime baseline
- **THEN** package manifest MAY 引用当前 root 的 `rules/` 和 `product/package/` 下的独立资产源

#### Scenario: 随包资产不得引用开发 overlay
- **WHEN** Buildr 校验 `product/package/manifest.yml`
- **THEN** package baseline MUST NOT 引用产品仓根特有规则、私有业务项目、私有组织名或私有路径

#### Scenario: 通用根规则进入随包规则源
- **WHEN** Buildr 维护默认 root 工作规则
- **THEN** 通用规则 MUST 以当前 root `rules/` 中可独立维护的规则文件作为源
- **AND** package manifest MUST 显式引用允许发布的规则文件，不得默认发布整个 `rules/` 目录

### Requirement: package manifest 声明发布边界
Buildr MUST 使用 `product/package/manifest.yml` 声明产品随包资产 include、workspaceDirectories、workspaceFiles、projectDirectories、projectFiles、模板变量、禁止内容和校验入口。

#### Scenario: package check 校验 manifest
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 manifest include 和文件映射源路径存在、模板变量完整，并报告禁止内容
- **AND** Buildr MUST 报告 `.gitkeep` 占位文件

#### Scenario: package check 校验初始化闭环
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 使用 package manifest 在临时目录执行初始化，并验证 `doctor --json` 通过

### Requirement: 初始化从 manifest 映射生成
Buildr MUST 从 `product/package/manifest.yml` 声明的目录和文件映射生成默认 root baseline 和项目 baseline。

#### Scenario: 渲染 root baseline
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 使用 manifest `workspaceDirectories` 和 `workspaceFiles` 生成 root 资产
- **AND** Buildr MUST 直接创建必要空目录，不通过 `.gitkeep` 占位文件表达目录意图

#### Scenario: root baseline 不包含 ASSETS
- **WHEN** Buildr 渲染默认 root baseline
- **THEN** 模板 MUST NOT 默认生成 `ASSETS.md`

#### Scenario: 渲染 project baseline
- **WHEN** Agent 执行 `buildr project create <project>`
- **THEN** Buildr MUST 使用 manifest `projectDirectories` 和 `projectFiles` 生成项目资产
