## ADDED Requirements

### Requirement: service link 支持本地路径和 Git URL
Buildr MVP MUST 使用一个 `service link` 命令接入本地路径或 Git URL，并根据 repo-ref 类型自动选择处理方式。

#### Scenario: 接入本地路径
- **WHEN** Agent 调用 `buildr service link [<org>/]<project>/<service> <local-path>`
- **THEN** Buildr MUST 校验本地路径可访问性和 Git 仓库状态，并维护 service 引用关系

#### Scenario: 接入 Git URL
- **WHEN** Agent 调用 `buildr service link [<org>/]<project>/<service> <git-url>`
- **THEN** Buildr MUST 默认 clone 该 Git repo 到项目下的 service 目录，并维护 service 引用关系

### Requirement: Git URL 默认使用远端 HEAD
Buildr MVP MUST 在 Git URL 未指定分支时使用远端 HEAD 作为默认 clone 目标。

#### Scenario: 用户未指定分支
- **WHEN** `service link` 接收到 Git URL 且用户没有指定分支
- **THEN** Buildr MUST 使用远端 HEAD 对应分支完成 clone

#### Scenario: 用户指定分支
- **WHEN** 用户或 Agent 明确指定 service repo 分支
- **THEN** Buildr MUST 使用指定分支完成 clone 或记录该分支意图

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

### Requirement: service metadata 支持跨用户补全 repo
Buildr MVP MUST 允许 Agent 根据 service metadata 识别缺失 service repo，并引导用户决定是否自动 clone 或补全。

#### Scenario: 共享 workspace 后缺失 service repo
- **WHEN** 新用户或另一个 Agent 打开共享的 Buildr workspace 且某个 metadata 声明的 Git service repo 不存在于本地
- **THEN** Buildr MUST 能提供足够信息让 Agent 询问用户是否自动 clone 该 repo

#### Scenario: 不要求用户手动查找 Git URL
- **WHEN** service metadata 已记录 Git URL
- **THEN** Agent MUST NOT 要求用户打开 Git 页面复制该 URL 才能补全 repo

### Requirement: shared service 属于组织级共享服务资产
Buildr MVP MUST 支持 Organization 下的 shared service，用于表达不隶属于单个 Project、可被多个 Project 复用的公共代码仓或能力单元。

#### Scenario: 用户未说明 service 归属
- **WHEN** 用户要求 Agent 接入 service repo 但没有说明它是业务项目服务还是组织共享服务
- **THEN** Agent MUST 引导用户确认该 service 应归属 Project 还是 Organization shared service

#### Scenario: shared service metadata
- **WHEN** service 归属 Organization shared service
- **THEN** Buildr MUST 能使用 `organizations/<org>/shared/services.yml` 维护 shared service metadata

#### Scenario: shared service 默认目录
- **WHEN** Buildr 管理 shared service repo
- **THEN** Buildr SHOULD 使用 `organizations/<org>/shared/services/<service>/` 作为默认 shared service repo 目录

#### Scenario: 历史 shared service 目录
- **WHEN** 现有 workspace 已在 `organizations/<org>/shared/<service>/` 放置 shared service repo
- **THEN** Buildr MAY 通过 `shared/services.yml` 记录相对路径纳入资产管理，而不强制迁移目录

### Requirement: service metadata 表达服务语义和规则入口
Buildr MVP MUST 允许 service metadata 记录服务类型和服务级规则资产位置。

#### Scenario: 记录服务类型
- **WHEN** Agent 或用户指定 service 类型
- **THEN** Buildr MUST 能在 service metadata 中记录 backend、frontend、mobile、library 或 infra 等服务语义

#### Scenario: 记录服务规则入口
- **WHEN** service 存在服务级 Agent 规则源
- **THEN** Buildr MUST 能在 service metadata 中记录该规则源位置

#### Scenario: 不记录 service repo runtime 投射意图
- **WHEN** Buildr 写入 service metadata
- **THEN** service metadata MUST NOT 要求或默认记录向 service repo 投射 Agent runtime 的意图
