## MODIFIED Requirements

### Requirement: Buildr workspace 作为项目管理资产库
Buildr MVP MUST 将 Buildr root 定义为长期项目管理资产库和 Organization 上下文实例，用于管理规则、OpenSpec、practices、skills、service metadata 和 runtime 投射关系。

#### Scenario: 初始化 workspace
- **WHEN** Agent 执行 `buildr init`
- **THEN** Buildr MUST 创建可作为 Organization 上下文维护的根资产骨架，而不是创建 `organizations/` 容器

#### Scenario: 共享 workspace
- **WHEN** 团队将 Buildr root 作为 Git repo 共享
- **THEN** root MUST 保存项目管理资产，而不是保存 service repo 的业务代码内容

### Requirement: workspace 目录骨架
Buildr MVP MUST 使用 root-as-Organization 模型生成项目资产目录。

#### Scenario: 创建项目资产目录
- **WHEN** Buildr 创建项目 `<project>`
- **THEN** Buildr MUST 在 `projects/<project>/` 下维护项目级资产

#### Scenario: 准备 service 默认目录
- **WHEN** Buildr 需要在项目下放置 service repo
- **THEN** Buildr MUST 默认使用 `projects/<project>/services/<service>/` 作为 service repo 目录

## REMOVED Requirements

### Requirement: 默认 Organization
**Reason**: Buildr root 本身就是 Organization 上下文，不再需要 `default` 或显式 `organizations/<org>/` 目录表达组织边界。

**Migration**: 用户通过 `buildr init --name <name> --profile <profile>` 设置 root 元数据；项目和服务使用根相对路径。
