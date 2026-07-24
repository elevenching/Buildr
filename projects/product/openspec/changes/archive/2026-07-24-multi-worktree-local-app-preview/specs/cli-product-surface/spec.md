## MODIFIED Requirements

### Requirement: CLI 产品表面必须显式分层
Buildr MUST 将当前可执行命令、兼容输入和内部数据标识区分为 public、legacy compatibility 与 internal/maintenance 产品表面，并在 help、产品文档、current-state knowledge 和验证中保持同一分类。

#### Scenario: Public workspace surface
- **WHEN** 用户或 Agent 查看 Buildr 根帮助与主产品文档
- **THEN** Buildr MUST 展示正式支持的 workspace 初始化、资产维护、诊断、修复、runtime 操作和本地应用入口
- **AND** `buildr app --target <workspace>` MUST 作为人查看 Workspace 并执行受控 metadata 修改的 public 产品入口
- **AND** `buildr app preview start|list|stop` MUST 作为 Agent 并行验收 task worktree 的 public 开发入口
- **AND** 低频但由 doctor、bootstrap 或 Buildr Skill 正式调用的 workspace 命令 MUST 保持 public，而不能仅因其底层或高级而标为 internal

#### Scenario: Local application help
- **WHEN** 用户运行 `buildr app --help`、`buildr help app` 或 preview 子命令帮助
- **THEN** Buildr MUST 说明默认本机应用与 task preview 的边界、target、loopback、port、实例身份、页面修改白名单和 prompt-only 新增边界
- **AND** help MUST 明确 preview 不安装或替换 `Buildr Dev.app`
- **AND** help MUST NOT 声称本地应用提供数据库、远程服务或 Agent session connector

#### Scenario: Workspace init description help
- **WHEN** 用户运行 `buildr init --help`
- **THEN** Buildr MUST 展示可选 `--description <description>` 参数
- **AND** help MUST 说明未提供说明时会产生待补全提示，而不是静默编造 Workspace 说明

#### Scenario: Internal maintenance surface
- **WHEN** 根帮助或产品文档提及产品构建、发布、自举或 workflow 编排命令
- **THEN** Buildr MUST 将这些入口与普通 workspace 用户主路径分区并标明 maintenance 或 workflow internal 用途
- **AND** 分类 MUST NOT 改变命令的现有可执行性、安全契约或安装后行为
