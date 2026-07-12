## MODIFIED Requirements

### Requirement: shared service 属于组织级共享服务资产
Buildr MVP MUST 支持 root `shared/` 下的 shared service，用于表达不隶属于单个 Project、可被多个 Project 复用的公共代码仓或能力单元。

#### Scenario: 接入共享服务
- **WHEN** 用户要求 Agent 接入 service repo 但没有说明它是业务项目服务还是共享服务
- **THEN** Agent MUST 引导用户确认该 service 应归属 Project 还是 root shared service

#### Scenario: shared service metadata
- **WHEN** service 归属 root shared service
- **THEN** Buildr MUST 能使用 `shared/services.yml` 维护 shared service metadata

#### Scenario: shared service 默认目录
- **WHEN** service 归属 root shared service 且由 Git URL 接入
- **THEN** Buildr SHOULD 使用 `shared/services/<service>/` 作为默认 shared service repo 目录

## REMOVED Requirements

### Requirement: legacy shared service 路径
**Reason**: Buildr root 本身就是 Organization 上下文，shared service 不再需要额外组织目录承载。

**Migration**: 旧 shared service 资产应迁移到 root `shared/`。
