## ADDED Requirements

### Requirement: Organization 作为一级所有权和规则边界
Buildr MUST 使用 Organization 表示 Workspace 下最高层级的所有权、规则和项目资产边界。

#### Scenario: 个人用户使用默认组织
- **WHEN** 个人用户在 Buildr workspace 中管理自己的项目
- **THEN** Buildr MUST 能以 Organization 模型表示该用户的默认项目资产边界

#### Scenario: 企业用户创建显式组织
- **WHEN** 企业团队在 Buildr workspace 中管理项目上下文
- **THEN** Buildr MUST 能以 Organization 模型表示企业、团队或客户的规则和资产边界

### Requirement: Organization 资产路径使用 organizations 目录
Buildr MUST 使用 `organizations/<org>/` 作为组织级资产路径，不得在新资产路径中继续使用 `companies/<company>/` 作为一级层级。

#### Scenario: 组织级资产路径
- **WHEN** Buildr 表示组织级规则、实践或 Skills
- **THEN** 这些资产 MUST 位于 `organizations/<org>/` 下

#### Scenario: 项目级资产路径
- **WHEN** Buildr 表示某个组织下的项目上下文
- **THEN** 项目资产 MUST 位于 `organizations/<org>/projects/<project>/` 下

#### Scenario: 共享服务路径
- **WHEN** Buildr 表示某个组织下的共享服务入口
- **THEN** 共享服务资产 MUST 位于 `organizations/<org>/shared/<service>/` 下

### Requirement: Buildr 层级术语使用组织而非公司
Buildr MUST 在层级、路径、scope、模板和资产边界描述中使用“组织”或 `Organization`，不得使用“公司”或 `Company` 表示 Buildr 一级层级。

#### Scenario: 描述 Buildr 层级
- **WHEN** 文档描述 Buildr 的上下文层级
- **THEN** 层级 MUST 表示为框架、组织、项目、服务

#### Scenario: 描述现实企业
- **WHEN** 文档描述现实中的企业采用场景或法律公司主体
- **THEN** 文档 MAY 使用“公司”或“企业”，但 MUST NOT 将其作为 Buildr 层级名

### Requirement: 后续产品 MVP 基于 Organization 模型
Buildr Product MVP MUST 基于 Organization 模型设计默认组织、项目创建、服务接入和诊断能力。

#### Scenario: 设计默认组织
- **WHEN** Product MVP 描述首次使用或个人使用场景
- **THEN** MVP MUST 使用默认 Organization 表示隐式组织边界

#### Scenario: 设计服务接入路径
- **WHEN** Product MVP 描述 service repo 接入和 service metadata
- **THEN** MVP MUST 使用 `organizations/<org>/projects/<project>/` 作为项目资产路径基础
