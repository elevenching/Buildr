## ADDED Requirements

### Requirement: CLI version JSON 必须声明稳定 identity
Buildr CLI MUST 为 `buildr version --json` 输出登记的公开 version payload，且不得向该输出混入文本说明。

#### Scenario: Agent 查询 CLI version
- **WHEN** Agent 运行 `buildr version --json`
- **THEN** stdout MUST 是单一有效 JSON 对象
- **AND** 顶层 `schemaVersion` MUST 为 `buildr.version/v1`
- **AND** payload MUST 至少包含非空 package name 与 semver version

### Requirement: CLI 路由错误必须提供机器可读 envelope
Buildr CLI MUST 在无法匹配命令且输入请求 `--json` 时输出登记的公开 error payload，并保持失败退出语义。

#### Scenario: 未知命令请求 JSON
- **WHEN** Agent 运行 `buildr <unknown-command> --json`
- **THEN** stdout MUST 是单一有效 JSON 对象且 stderr MUST 为空
- **AND** 顶层 `schemaVersion` MUST 为 `buildr.cli-error/v1`
- **AND** payload MUST 包含稳定 error code、未知输入、canonical suggestions 和根帮助提示
- **AND** 命令 MUST 以 2 退出

#### Scenario: checkout 与 tarball 错误一致
- **WHEN** 产品验证对 checkout 和 npm tarball CLI 运行相同未知 JSON 命令
- **THEN** 两者 MUST 使用相同 schema identity、error code 和字段类型
- **AND** schema coverage registry MUST 在任一新 JSON family 未登记时失败
