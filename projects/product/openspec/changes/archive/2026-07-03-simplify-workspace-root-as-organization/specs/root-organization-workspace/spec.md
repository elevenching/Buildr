## ADDED Requirements

### Requirement: Buildr root 作为 Organization 上下文实例
Buildr MUST 将默认初始化目录定义为一个 Organization 上下文实例，而不是多 Organization 容器。

#### Scenario: 个人上下文
- **WHEN** 个人用户在 `~/personal` 初始化 Buildr
- **THEN** Buildr MUST 将 `~/personal` 作为该用户个人项目的 Organization 上下文根目录

#### Scenario: 公司上下文
- **WHEN** 用户在 `~/acme` 初始化 Buildr
- **THEN** Buildr MUST 将 `~/acme` 作为 `acme` 公司或团队项目的 Organization 上下文根目录

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST 创建可直接作为 Organization 上下文维护的根资产，而不是只创建空容器。

#### Scenario: 初始化根资产
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 在 `<dir>` 下创建根 `AGENTS.md`、`ASSETS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`practices/`、`skills/`、`shared/` 和 `projects/` 的基础骨架

#### Scenario: 初始化元数据
- **WHEN** Buildr 创建 `.buildr/workspace.yml`
- **THEN** 该文件 MUST 记录 schema version、上下文 kind、实例 name 和 profile

### Requirement: 项目资产使用根 projects 目录
Buildr MUST 默认使用根 `projects/<project>/` 维护项目级资产。

#### Scenario: 创建项目
- **WHEN** Agent 执行 `buildr project create pig --target <root>`
- **THEN** Buildr MUST 在 `<root>/projects/pig/` 下创建项目级 `AGENTS.md`、`openspec/`、`practices/`、`skills/`、`services.yml` 和 `services/`

#### Scenario: 未指定组织的 service 接入
- **WHEN** Agent 执行 `buildr service link pig/freshx <repo-ref> --target <root>`
- **THEN** Buildr MUST 将该服务接入 `<root>/projects/pig/` 的 service metadata 和默认 service repo 目录

### Requirement: 共享服务使用根 shared 目录
Buildr MUST 默认使用根 `shared/` 表达当前 Organization 上下文的共享服务资产。

#### Scenario: 共享服务 metadata
- **WHEN** Buildr 初始化根组织上下文
- **THEN** Buildr MUST 准备 `shared/services.yml` 和 `shared/services/` 作为组织共享服务的默认资产入口

#### Scenario: 诊断共享服务
- **WHEN** `doctor` 检查 Buildr root
- **THEN** Buildr MUST 诊断根 `shared/services.yml`、`shared/services/` 和其中 service repo 的状态

### Requirement: 默认 scope 使用根相对表达
Buildr MUST 支持根相对 scope 作为默认 scope 表达。

#### Scenario: 项目 scope
- **WHEN** Agent 运行 `buildr runtime check claude-code --scope projects/pig --target <root>`
- **THEN** Buildr MUST 解析根规则、项目规则和相关 runtime 投射状态

#### Scenario: 共享服务 scope
- **WHEN** Agent 运行 `buildr doctor --scope shared/openapi --target <root> --json`
- **THEN** Buildr MUST 解析根共享服务 `openapi` 的 metadata 和本地 repo 状态

### Requirement: 旧 organizations 布局可诊断
Buildr MUST 识别旧版 `organizations/<org>/` 布局，并给出结构化迁移或兼容建议。

#### Scenario: legacy workspace
- **WHEN** `doctor` 发现根目录存在 `organizations/` 但不存在新模型的 `projects/` 或 `.buildr/workspace.yml`
- **THEN** Buildr MUST 报告该目录使用 legacy multi-organization layout，并提供迁移单个 organization 为 root context 的建议

#### Scenario: 兼容旧 scope
- **WHEN** Agent 对 legacy workspace 使用 `organizations/<org>/projects/<project>` scope
- **THEN** Buildr MAY 兼容解析该 scope，但 MUST 在诊断结果中标记该路径不是默认推荐模型
