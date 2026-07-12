## MODIFIED Requirements

### Requirement: Buildr root 承载默认 Organization 资产路径
Buildr MUST 将 Buildr root 作为默认 Organization 资产路径，并在根目录维护组织级规则、实践、Skills 和项目入口。

#### Scenario: 组织级资产路径
- **WHEN** Buildr 表示当前 Organization 上下文的规则、实践或 Skills
- **THEN** 这些资产 MUST 位于 Buildr root 的 `AGENTS.md`、`practices/` 和 `skills/` 下

#### Scenario: 项目级资产路径
- **WHEN** Buildr 表示当前 Organization 上下文下的项目
- **THEN** 项目资产 MUST 位于 `projects/<project>/` 下

#### Scenario: 共享服务路径
- **WHEN** Buildr 表示当前 Organization 上下文下的共享、基础或平台服务
- **THEN** 这些服务 MUST 归属某个 Project，并位于 `projects/<project>/services/` 下

### Requirement: 后续产品 MVP 基于 Organization 模型
Buildr Product MVP MUST 基于 root-as-Organization 模型设计初始化、项目创建、服务创建和诊断能力。

#### Scenario: 设计默认组织
- **WHEN** Product MVP 描述首次使用、个人使用或公司使用场景
- **THEN** MVP MUST 将用户选择的 Buildr root 视为默认 Organization 上下文

#### Scenario: 设计服务接入路径
- **WHEN** Product MVP 描述 service repo 接入和 service metadata
- **THEN** MVP MUST 使用 `projects/<project>/` 作为默认资产路径基础
