## ADDED Requirements

### Requirement: CLI 必须公开自身版本 identity
Buildr CLI MUST 提供无需 workspace、网络或 Git 状态即可读取当前实际执行 package identity 的版本入口。

#### Scenario: 使用全局版本参数
- **WHEN** 用户运行 `buildr --version` 或 `buildr -V`
- **THEN** Buildr MUST 向 stdout 输出当前 CLI package 的 semver version
- **AND** 命令 MUST 以 0 退出且不读取或修改 workspace

#### Scenario: 使用 version 命令
- **WHEN** 用户运行 `buildr version`
- **THEN** Buildr MUST 输出与 `buildr --version` 相同的当前 package version
- **AND** checkout 与 npm tarball 入口 MUST 对相同 candidate tree 输出相同值

### Requirement: CLI 帮助入口必须支持命令式主题查询
Buildr CLI MUST 让 `help <command...>` 与既有 `<command...> --help`、`<command...> -h` 共享同一 canonical topic 和帮助正文。

#### Scenario: 查询一级命令帮助
- **WHEN** 用户运行 `buildr help doctor`
- **THEN** Buildr MUST 输出与 `buildr doctor --help` 相同的 canonical doctor 帮助
- **AND** 命令 MUST 以 0 退出且无 workspace 副作用

#### Scenario: 查询嵌套命令帮助
- **WHEN** 用户运行 `buildr help component install`
- **THEN** Buildr MUST 输出与 `buildr component install --help` 相同的 canonical topic
- **AND** 帮助 MUST NOT 回退到不相关的根帮助

### Requirement: 未知命令必须返回简洁可操作诊断
Buildr CLI MUST 对无法匹配的命令返回稳定非零退出码、未知输入和可执行下一步，而不是默认输出完整 legacy usage。

#### Scenario: 未知命令存在相近候选
- **WHEN** 用户运行拼写接近公开命令的未知输入
- **THEN** Buildr MUST 在 stderr 标识未知命令并给出有限的相近 canonical 命令建议
- **AND** Buildr MUST 提示通过 `buildr --help` 查看完整帮助并以 2 退出

#### Scenario: 未知 help topic
- **WHEN** 用户运行 `buildr help <unknown-topic>`
- **THEN** Buildr MUST 报告未知 help topic 而不是静默显示根帮助
- **AND** diagnostics MUST 保持零 workspace 副作用

#### Scenario: 不占用小写 v
- **WHEN** 用户运行 `buildr -v`
- **THEN** Buildr MUST NOT 将其解释为 version
- **AND** Buildr MUST 以未知 option 诊断失败，为未来 verbose 语义保留该短参数
