## MODIFIED Requirements

### Requirement: 初始化从 manifest 映射生成
Buildr MUST 从 `product/package/manifest.yml` 声明的目录和文件映射生成默认 root baseline 和项目 baseline，并确保默认 workspace 规则和 README 具备可直接指导 Agent 工作的内容质量。

#### Scenario: 渲染 root baseline
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 使用 manifest `workspaceDirectories` 和 `workspaceFiles` 生成 root 资产
- **AND** Buildr MUST 直接创建必要空目录，不通过 `.gitkeep` 占位文件表达目录意图

#### Scenario: root baseline 不包含 ASSETS
- **WHEN** Buildr 渲染默认 root baseline
- **THEN** 模板 MUST NOT 默认生成 `ASSETS.md`

#### Scenario: root AGENTS 具备工作指导价值
- **WHEN** Buildr 渲染默认 root `AGENTS.md`
- **THEN** 文件 MUST 说明 Buildr workspace 的资产边界、层级记忆、任务启动、OpenSpec、runtime 和 Git 基础规则
- **AND** 文件 MUST NOT 引用产品仓私有业务项目、私有路径或私有业务规则

#### Scenario: root README 具备 onboarding 价值
- **WHEN** Buildr 渲染默认 root `README.md`
- **THEN** 文件 MUST 说明该 workspace 的用途、目录资产、常用下一步和 Agent runtime 差异

#### Scenario: 渲染 project baseline
- **WHEN** Agent 执行 `buildr project create <project>`
- **THEN** Buildr MUST 使用 manifest `projectDirectories` 和 `projectFiles` 生成项目资产
