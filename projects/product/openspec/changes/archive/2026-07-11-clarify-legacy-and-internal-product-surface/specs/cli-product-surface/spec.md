## ADDED Requirements

### Requirement: CLI 产品表面必须显式分层
Buildr MUST 将当前可执行命令、兼容输入和内部数据标识区分为 public、legacy compatibility 与 internal/maintenance 产品表面，并在 help、产品文档、current-state knowledge 和验证中保持同一分类。

#### Scenario: Public workspace surface
- **WHEN** 用户或 Agent 查看 Buildr 根帮助与主产品文档
- **THEN** Buildr MUST 展示正式支持的 workspace 初始化、资产维护、诊断、修复和 runtime 操作
- **AND** 低频但由 doctor、bootstrap 或 Buildr Skill 正式调用的 workspace 命令 MUST 保持 public，而不能仅因其底层或高级而标为 internal

#### Scenario: Internal maintenance surface
- **WHEN** 根帮助或产品文档提及产品构建、发布、自举或 workflow 编排命令
- **THEN** Buildr MUST 将这些入口与普通 workspace 用户主路径分区并标明 maintenance 或 workflow internal 用途
- **AND** 分类 MUST NOT 改变命令的现有可执行性、安全契约或安装后行为

### Requirement: Canonical 输出不得推荐 legacy 形式
Buildr MUST 只在兼容解析、迁移诊断或历史事实中接受和描述 legacy surface；主帮助、主题帮助、bootstrap canonical 示例、doctor repair command 和当前使用说明 MUST NOT 生成或推荐 legacy 参数、scope 或数据布局。

#### Scenario: Legacy 输入仍被兼容
- **WHEN** 旧 workspace 或旧调用使用仍受支持的 legacy 参数、scope 或 manifest
- **THEN** Buildr MUST 按对应 canonical spec 保留、迁移或兼容解析
- **AND** Buildr MUST 输出可操作的 warning、info 或迁移提示，不得静默把 legacy 形式重新定义为 canonical

#### Scenario: Unsupported layout is not compatibility surface
- **WHEN** 输入使用 canonical specs 已明确拒绝的 `organizations/<org>/` layout 或 scope
- **THEN** Buildr MUST 继续拒绝该输入
- **AND** 产品分类 MUST NOT 将它描述为受支持的 legacy compatibility surface

### Requirement: service create rules 参数仅作为兼容 no-op
Buildr MUST 将 `service create --rules <path>` 保留为 deprecated legacy compatibility no-op，而 Service Rule 的唯一 canonical 入口 MUST 是 Service 目录层级的 `AGENTS.md`。

#### Scenario: 旧调用携带 rules 参数
- **WHEN** Agent 调用 `buildr service create <project>/<service> <repo-ref> --rules <path>`
- **THEN** Buildr MUST 保持不带该参数时的 Service 创建和登记语义
- **AND** Buildr MUST 输出 deprecated 与迁移提示
- **AND** Buildr MUST NOT 读取、验证、复制或持久化 `<path>`，也不得向 Service manifest 写入 rule-source 字段

#### Scenario: Canonical Service help
- **WHEN** 用户查看根帮助、`service create --help`、bootstrap guide 或当前产品示例
- **THEN** canonical usage MUST NOT 包含 `--rules`
- **AND** Service 主题说明 MUST 指向目录层级 `AGENTS.md` 约定

### Requirement: Package 命令属于产品维护表面
Buildr MUST 保留 `package check` 与 `package build` 作为产品包校验、构建和发布维护命令，并 MUST NOT 将它们描述为普通 workspace 用户的日常资产管理入口。

#### Scenario: Maintainer discovers package commands
- **WHEN** 产品维护者查看根帮助的维护分区、package 主题帮助或 release checklist
- **THEN** Buildr MUST 提供 `package check` 与 `package build` 的准确用途和用法
- **AND** 两个命令 MUST 继续遵循现有 package manifest、output receipt、integrity 与安全替换契约

#### Scenario: User follows onboarding path
- **WHEN** 普通用户或 Agent 按 quick start、bootstrap 或主 workspace workflow 操作
- **THEN** Buildr MUST NOT 要求运行 `package check` 或 `package build` 才能完成 workspace onboarding 和日常维护

### Requirement: package source identity 不得成为公开资产 id
Buildr MUST 将 `package:<source-id>` 保留为 package manifest `skillSources` 与随包 Skill resolver 之间的内部 source reference，并 MUST NOT 将其作为用户创建的 Skill id、通用 source scheme 或 `skills add` 的公开参数格式推荐。

#### Scenario: Package baseline references bundled source
- **WHEN** Buildr package baseline 使用 `source: package:<source-id>` 引用已声明的 `skillSources`
- **THEN** Buildr MUST 按现有 package manifest 与 runtime 约束解析该引用
- **AND** `<source-id>` MUST 继续只标识随包 source，不改变 Skill 的用户可见 asset id

#### Scenario: Public Skill authoring guidance
- **WHEN** 用户查看 workspace/project Skill 的创建或安装说明
- **THEN** Buildr MUST 只推荐公开支持的 local path、remote source 或 resolved source 模型
- **AND** 说明 MUST NOT 引导用户手工构造 `package:<source-id>` 引用

### Requirement: 产品表面分类必须由验证保护
Buildr 产品验证 MUST 同时验证 public 可发现性、legacy 输入兼容与 canonical 输出收敛、internal/maintenance 定位，防止 help、docs、spec 和实现再次漂移。

#### Scenario: Verify help and compatibility boundaries
- **WHEN** 产品验证检查根帮助、主题帮助、bootstrap guide 和 legacy Service 调用
- **THEN** 验证 MUST 确认 public 命令可发现、maintenance/workflow internal 命令有明确分区、canonical Service usage 不含 `--rules`
- **AND** 验证 MUST 确认携带 `--rules` 的旧调用仍输出 deprecated 提示且不写入 rule-source metadata

#### Scenario: Verify internal source identity boundary
- **WHEN** package check 或产品测试检查随包 Skill source reference
- **THEN** 验证 MUST 确认 `package:<source-id>` 只能解析 package manifest 已声明的 source
- **AND** 主用户文档与公开 Skill authoring help MUST NOT 把该引用描述为用户 asset id
