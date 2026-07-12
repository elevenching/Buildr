## MODIFIED Requirements

### Requirement: service metadata 作为最小服务资产索引
Buildr MVP MUST 使用项目级 `services.yml` 作为 service metadata 的最小索引，记录目录结构无法表达的信息。

#### Scenario: 记录 Git 来源
- **WHEN** service repo 来源是 Git URL
- **THEN** service metadata MUST 记录 repo kind、Git URL、remote、默认分支和 repo path

#### Scenario: 记录外部本地路径
- **WHEN** service repo 来源是 workspace 外部本地路径
- **THEN** service metadata MUST 记录 repo kind 和外部路径

#### Scenario: 避免重复目录结构
- **WHEN** Organization、Project、Service 和默认 repo path 已能从目录结构推导
- **THEN** service metadata MUST NOT 要求重复记录这些层级信息作为必填字段

### Requirement: 共享服务通过 Project 表达
Buildr MVP MUST 使用普通 Project 表达共享、基础或平台服务，不得使用 root `shared/` 作为默认 service 命名空间。

#### Scenario: 用户未说明 service 归属
- **WHEN** 用户要求 Agent 接入 service repo 但没有说明它属于哪个项目或共享服务集合
- **THEN** Agent MUST 引导用户选择或创建一个 Project，例如 `foundation`、`platform` 或用户指定名称

#### Scenario: 共享服务 metadata
- **WHEN** service 归属共享、基础或平台服务集合
- **THEN** Buildr MUST 使用 `projects/<project>/services.yml` 维护 service metadata

#### Scenario: 共享服务默认目录
- **WHEN** Buildr 管理共享、基础或平台 service repo
- **THEN** Buildr MUST 使用 `projects/<project>/services/<service>/` 作为默认 service repo 目录

## REMOVED Requirements

### Requirement: shared service 属于组织级共享服务资产
**Reason**: root `shared/` 形成了第二套 service metadata、scope 和诊断模型，增加 Agent 使用和产品实现复杂度。

**Migration**: 创建一个普通 Project（例如 `foundation`、`platform` 或 `shared`），将原 `shared/services.yml` 和 `shared/services/*` 迁入 `projects/<project>/services.yml` 与 `projects/<project>/services/*`。
