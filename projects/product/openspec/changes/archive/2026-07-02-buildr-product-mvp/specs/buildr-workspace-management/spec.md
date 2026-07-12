## ADDED Requirements

### Requirement: Buildr workspace 作为项目管理资产库
Buildr MVP MUST 将 Buildr workspace 定义为长期项目管理资产库，用于管理规则、OpenSpec、practices、skills、service metadata 和 runtime 投射关系。

#### Scenario: 初始化 workspace
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST 创建可作为项目管理资产库维护的基础文件骨架和 `organizations/` 容器

#### Scenario: 初始化不创建默认组织目录
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST NOT 直接创建 `organizations/default/` 组织资产目录

#### Scenario: 共享 workspace
- **WHEN** 团队将 Buildr workspace 作为 Git repo 共享
- **THEN** workspace MUST 保存项目管理资产，而不是保存 service repo 的业务代码内容

### Requirement: 默认 Organization
Buildr MVP MUST 支持默认 Organization `default`，用于个人或首次使用场景。

#### Scenario: 用户未指定组织
- **WHEN** 用户接入项目或 service 时没有指定组织
- **THEN** Buildr MUST 使用默认 Organization `default` 表示隐式组织边界

#### Scenario: 用户指定显式组织
- **WHEN** 用户明确指定团队、客户、公司或企业组织
- **THEN** Buildr MUST 在 `organizations/<org>/` 下维护该组织资产

### Requirement: workspace 目录骨架
Buildr MVP MUST 使用 Organization 模型生成项目资产目录。

#### Scenario: 创建项目资产目录
- **WHEN** Buildr 创建项目 `<project>`
- **THEN** Buildr MUST 在 `organizations/<org>/projects/<project>/` 下维护项目级资产

#### Scenario: 准备 service 默认目录
- **WHEN** Buildr 需要在项目下放置 service repo
- **THEN** Buildr MUST 默认使用 `organizations/<org>/projects/<project>/services/<service>/` 作为 service repo 目录

### Requirement: workspace 忽略嵌套 service repo
Buildr MVP MUST 防止外层 workspace Git 误提交嵌套 service repo 的业务代码内容。

#### Scenario: service repo 嵌套在 workspace 中
- **WHEN** Buildr 将 service repo clone 到项目默认 service 目录
- **THEN** Buildr MUST 维护 workspace `.gitignore` 规则以忽略该 service repo 的业务代码内容

#### Scenario: 诊断忽略规则
- **WHEN** `doctor` 检查 workspace 状态
- **THEN** Buildr MUST 能报告嵌套 service repo 是否被 workspace Git 忽略
