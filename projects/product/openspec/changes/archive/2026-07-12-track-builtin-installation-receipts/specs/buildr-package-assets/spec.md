## MODIFIED Requirements

### Requirement: package manifest 声明内置能力
Buildr package manifest MUST 声明可同步到用户 workspace 的产品内置 Rules、Skills 和 Commands，并提供旧 workspace 安全采用所需的官方完整性证据。

#### Scenario: 声明内置 Rules
- **WHEN** Buildr package 包含产品内置 Rules
- **THEN** `package/manifest.yml` MUST 声明每个内置 Rule 的 id、源路径、目标路径、description 和 required 状态
- **AND** version 或 hash 元数据 MAY 声明，但不是必填

#### Scenario: 声明内置 Skills
- **WHEN** Buildr package 包含产品内置 Skills
- **THEN** `package/manifest.yml` MUST 声明每个内置 Skill 的 id、源路径、目标路径、适用 runtimes 和 required 状态
- **AND** version 或 hash 元数据 MAY 声明，但不是必填

#### Scenario: 未声明版本的内置能力
- **WHEN** 某个内置能力未声明 version 或 hash
- **THEN** Buildr doctor MUST 仍使用安装回执检查该内置能力的精确 live 状态
- **AND** Buildr MUST NOT 仅因为没有独立 assets version 输出 warning

#### Scenario: 声明内置 Commands
- **WHEN** Buildr package 包含产品内置 Commands
- **THEN** `package/manifest.yml` MUST 声明每个内置 Command 在 `commands/manifest.yml` 中需要写入的 manifest entry
- **AND** 内置 Commands MUST 保持为声明和安装提示，不得变成自动本机安装

#### Scenario: 声明 legacy 官方完整性
- **WHEN** Buildr 需要让无回执 workspace 从受支持的旧版 Builtin 自动升级
- **THEN** package MUST 按 Builtin 身份声明对应 legacy SHA-256 完整性
- **AND** legacy 完整性 MUST 只用于证明随既有 CLI package 发布过的官方内容

#### Scenario: package check 校验内置能力
- **WHEN** Agent 运行 `buildr package check`
- **THEN** Buildr MUST 校验已声明的内置能力源路径
- **AND** Buildr MUST 校验 forbidden patterns、必需 Skill 文件、manifest entry 结构、目标路径安全性和 legacy integrity 格式及身份唯一性

#### Scenario: Rules 和 Skills manifest-first
- **WHEN** Buildr package 发布内置 Rules 或 Skills
- **THEN** sync MUST 将它们登记到 `rules/manifest.yml` 或 `skills/manifest.yml`
- **AND** Buildr MUST NOT 依赖扫描裸文件决定规则或技能是否生效

#### Scenario: Rule manifest metadata
- **WHEN** Buildr 创建、安装或更新 Rule manifest entry
- **THEN** entry MUST 声明 `id`、`source`、`path`、`description`、`enabled` 和 `required`
- **AND** `description` MUST 描述适用场景和用途，供 Agent 判断何时读取该规则
- **AND** `description` MUST NOT 用来承载规则正文

#### Scenario: package baseline 排除未声明内置能力
- **WHEN** Buildr 打包或校验产品资产
- **THEN** builtin package 源目录下的文件 MUST 只有在 package manifest 声明或被 package include 边界覆盖时才能进入发布包
