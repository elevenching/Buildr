## ADDED Requirements

### Requirement: Buildr root 承载默认 Organization 资产路径
Buildr MUST 将 Buildr root 作为默认 Organization 资产路径，并在根目录维护组织级规则、实践、Skills、共享服务和项目入口。

#### Scenario: 组织级资产路径
- **WHEN** Buildr 表示当前 Organization 上下文的规则、实践或 Skills
- **THEN** 这些资产 MUST 位于 Buildr root 的 `AGENTS.md`、`practices/` 和 `skills/` 下

#### Scenario: 项目级资产路径
- **WHEN** Buildr 表示当前 Organization 上下文下的项目
- **THEN** 项目资产 MUST 位于 `projects/<project>/` 下

#### Scenario: 共享服务路径
- **WHEN** Buildr 表示当前 Organization 上下文下的共享服务入口
- **THEN** 共享服务资产 MUST 位于 `shared/` 下

## MODIFIED Requirements

### Requirement: Organization 作为一级所有权和规则边界
Buildr MUST 使用 Organization 表示最高层级的所有权、规则和项目资产边界；默认情况下，一个 Buildr root 即一个 Organization 上下文实例。

#### Scenario: 个人用户使用根组织上下文
- **WHEN** 个人用户在 Buildr root 中管理自己的项目
- **THEN** Buildr MUST 以该 root 表示该用户的默认项目资产边界

#### Scenario: 企业用户使用根组织上下文
- **WHEN** 企业团队在 Buildr root 中管理项目上下文
- **THEN** Buildr MUST 以该 root 表示企业、团队或客户的规则和资产边界

### Requirement: 后续产品 MVP 基于 Organization 模型
Buildr Product MVP MUST 基于 root-as-Organization 模型设计初始化、项目创建、服务接入和诊断能力。

#### Scenario: 设计默认组织
- **WHEN** Product MVP 描述首次使用、个人使用或公司使用场景
- **THEN** MVP MUST 将用户选择的 Buildr root 视为默认 Organization 上下文

#### Scenario: 设计服务接入路径
- **WHEN** Product MVP 描述 service repo 接入和 service metadata
- **THEN** MVP MUST 使用 `projects/<project>/` 和 `shared/` 作为默认资产路径基础

## REMOVED Requirements

### Requirement: Organization 资产路径使用 organizations 目录
**Reason**: 默认 `organizations/<org>/` 物理层要求用户在已代表组织的根目录下重复创建同名组织，导致初始化结果空壳化、命令重复和上下文边界不清。

**Migration**: 旧版 `organizations/<org>/` 布局应由 `doctor` 识别为 legacy multi-organization layout。单组织 workspace 应迁移为 root-as-Organization 布局；多组织 workspace 应留给高级模式或兼容读取处理。
