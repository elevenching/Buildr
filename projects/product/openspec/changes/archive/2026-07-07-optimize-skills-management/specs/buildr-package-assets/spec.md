## ADDED Requirements

### Requirement: package manifest 声明 workspace Skill 引用来源
Buildr package manifest MUST 支持声明产品随包 workspace/project Skill 引用来源，并将其与 workspace baseline 文件映射和产品内置 Agent Skills 分离。

#### Scenario: 声明 skillSources
- **WHEN** Buildr 产品包提供可被 workspace/project `skills/manifest.yml` 引用的 Skill 源资产
- **THEN** `package/manifest.yml` MUST 通过专用字段声明 source id、源路径和适用 runtime
- **AND** 该声明 MUST NOT 使用 `agentSkills` 字段

#### Scenario: skillSources 不参与 init 文件映射
- **WHEN** Agent 执行 `buildr init`
- **THEN** manifest 中声明的 `skillSources` MUST NOT 被直接复制到目标 workspace `skills/<skill-id>/` 目录
- **AND** Buildr MUST 继续只按 `workspaceDirectories` 和 `workspaceFiles` 生成 workspace baseline 文件
- **AND** 默认 workspace 可通过 `skills/manifest.yml` 中的引用型条目启用这些 Skill

#### Scenario: package check 校验 skillSources
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 manifest 声明的 `skillSources` 源路径存在
- **AND** Buildr MUST 校验每个 source 具备可读取的 `SKILL.md`
- **AND** Buildr MUST 校验 `SKILL.md` frontmatter 的 `name` 与 source id 一致
- **AND** Buildr MUST 校验 source 内容不包含 forbidden patterns

#### Scenario: workspace baseline 引用 package Skill source
- **WHEN** package workspace baseline 的 `skills/manifest.yml` 声明 `source: package:<source-id>`
- **THEN** Buildr package check MUST 校验 `<source-id>` 存在于 package manifest 的 `skillSources`
- **AND** Buildr MUST NOT 要求该 Skill 的 `SKILL.md` 也出现在 `workspaceFiles` 映射中

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
- **THEN** 默认 workspace 规则、README、workspace metadata、Git ignore 模板、命令行工具清单入口和 workspace Skills manifest MUST 位于产品 root 下的 `package/workspace/`
- **AND** package manifest MUST 从 `package/workspace/` 显式引用默认 workspace baseline 源
- **AND** 默认 workspace Skills manifest 引用的包内 Skill 源 MAY 位于 package manifest 专用 Skill source 声明指向的位置
- **AND** 未直接映射到用户 workspace 的 Skill 源 MUST NOT 放在 `package/workspace/`

#### Scenario: 默认 Project 模板源归属 workspace projects 容器
- **WHEN** Buildr 维护默认 Project baseline 文件
- **THEN** 默认 Project 模板源 MUST 位于产品 root 下的 `package/workspace/projects/`
- **AND** package manifest MUST 从 `package/workspace/projects/` 显式引用默认 Project baseline 文件

#### Scenario: 随包资产不得引用开发 overlay
- **WHEN** Buildr 校验 `package/manifest.yml`
- **THEN** package baseline MUST NOT 引用产品仓根特有规则、私有业务项目、私有组织名或私有路径

#### Scenario: 通用根规则进入随包规则源
- **WHEN** Buildr 维护默认 root 工作规则
- **THEN** 通用规则 MUST 以产品 root 下 `package/workspace/rules/` 中可独立维护的规则文件作为源
- **AND** package manifest MUST 显式引用允许发布的规则文件，不得默认发布整个 `rules/` 目录
