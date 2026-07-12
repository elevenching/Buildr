## ADDED Requirements

### Requirement: 公开 JSON 输出必须声明 schema identity
Buildr 所有可通过受支持 CLI 命令获得的 `--json` 对象输出 MUST 在顶层声明非空 `schemaVersion`，并 MUST 为不同命令家族使用稳定的 `buildr.<payload>/v<major>` identity。

#### Scenario: Agent 读取公开 JSON
- **WHEN** Agent 运行任一支持 `--json` 的 Buildr CLI 命令
- **THEN** 输出 MUST 是单一有效 JSON 对象
- **AND** 顶层 MUST 包含与该命令家族匹配的 `schemaVersion`
- **AND** checkout 与 npm tarball CLI 对同一命令 MUST 使用相同 schema identity

#### Scenario: 非 JSON 输出
- **WHEN** 用户运行同一命令但没有请求 `--json`
- **THEN** Buildr MUST 保持既有人类可读输出
- **AND** Buildr MUST NOT 为文本输出增加 JSON envelope

### Requirement: JSON schema major 必须按兼容规则演进
Buildr public JSON schema 在同一 major identity 内 MUST 只进行兼容性扩展；删除字段、重命名字段、改变字段类型或改变既有字段语义 MUST 使用新的 schema major，并 MUST 通过 OpenSpec change 定义迁移。

#### Scenario: v1 增加字段
- **WHEN** Buildr 在 `buildr.<payload>/v1` 中新增字段
- **THEN** 新字段 MUST 是 additive
- **AND** 既有字段的名称、类型和语义 MUST 保持兼容

#### Scenario: 消费者遇到未知字段
- **WHEN** Agent 或自动化消费同一 schema major 中较新 Buildr 输出的未知字段
- **THEN** 消费者 MUST 忽略未知字段并继续按已知字段解析

#### Scenario: 需要破坏性变化
- **WHEN** JSON payload 需要删除、重命名、改变类型或改变既有字段语义
- **THEN** Buildr MUST 发布新的 `v<major>` schema identity
- **AND** 对应 change MUST 说明旧 major 的兼容期限或迁移路径

### Requirement: JSON schema coverage 必须由自动验证保护
Buildr 产品验证 MUST 枚举所有受支持 `--json` 命令，校验 schema identity、有效 JSON、关键既有字段和 checkout/npm parity，并 MUST 在新增 JSON surface 未登记时失败。

#### Scenario: 新增 JSON 命令未登记
- **WHEN** command registry 新增或启用一个 `--json` 输出但 schema registry/coverage 未包含该命令
- **THEN** 产品验证 MUST 失败并报告缺失命令

#### Scenario: schema identity 漂移
- **WHEN** 同一命令的 checkout 与 tarball 输出使用不同 `schemaVersion`
- **THEN** parity verification MUST 失败并报告两个 identity
