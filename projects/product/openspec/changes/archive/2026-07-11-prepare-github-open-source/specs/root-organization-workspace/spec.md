## MODIFIED Requirements

### Requirement: Buildr root 作为 Organization 上下文实例
Buildr MUST 将默认初始化目录定义为一个 Organization 上下文实例，而不是多 Organization 容器。

#### Scenario: 个人上下文
- **WHEN** 个人用户在 `~/personal` 初始化 Buildr
- **THEN** Buildr MUST 将 `~/personal` 作为该用户个人项目的 Organization 上下文根目录

#### Scenario: 公司上下文
- **WHEN** 用户在 `~/acme` 初始化 Buildr
- **THEN** Buildr MUST 将 `~/acme` 作为示例公司或组织的 Project 资产根目录

### Requirement: 移除 legacy organizations 入口
Buildr MUST NOT 将 `organizations/<org>/` 作为产品主线、兼容路径或默认 scope 解析入口。

#### Scenario: 拒绝 legacy project ref
- **WHEN** Agent 调用 `buildr project create acme/shop`
- **THEN** Buildr MUST 报告该 ref 不受支持，并提示使用 `buildr project create shop`

#### Scenario: 拒绝 legacy service ref
- **WHEN** Agent 调用 `buildr service create acme/shop/api <repo-ref>`
- **THEN** Buildr MUST 报告该 ref 不受支持，并提示使用 `buildr service create shop/api <repo-ref>`

#### Scenario: 拒绝 legacy scope
- **WHEN** Agent 调用 `buildr doctor --scope organizations/acme/projects/shop --json`
- **THEN** Buildr MUST 报告该 scope 不受支持，并提示使用 `projects/shop`
