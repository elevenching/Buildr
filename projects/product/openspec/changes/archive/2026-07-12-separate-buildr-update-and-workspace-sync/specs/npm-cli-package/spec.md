## ADDED Requirements

### Requirement: registry package 支持 CLI 自更新
从支持的 npm registry 安装的 Buildr package MUST 支持 `buildr update` 检查和更新同一 package identity，且不得隐式维护 workspace。

#### Scenario: 检查 registry 更新
- **WHEN** registry 安装的 CLI 运行 `buildr update check --json`
- **THEN** Buildr MUST 查询当前配置 registry 中同一 package identity 的可用版本
- **AND** Buildr MUST NOT 修改 package、workspace 或 Agent runtime

#### Scenario: 更新 registry package
- **WHEN** registry 安装的 CLI 运行 `buildr update` 且存在可安全安装的新版本
- **THEN** Buildr MUST 更新承载当前 executable 的 package
- **AND** Buildr MUST 保持安装 prefix、registry、scope 和 tag
- **AND** Buildr MUST NOT 执行 workspace sync 或 doctor

#### Scenario: registry update 回归验证
- **WHEN** 产品验证构造包含旧版与新版 Buildr package 的临时 registry 或等价隔离 fixture
- **THEN** verifier MUST 证明旧版 installed executable 能检查并更新到新版
- **AND** verifier MUST 证明更新动作没有修改测试 workspace，后续显式 sync 才完成 workspace reconcile
