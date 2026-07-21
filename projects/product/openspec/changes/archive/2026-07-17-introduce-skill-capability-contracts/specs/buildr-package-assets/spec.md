## MODIFIED Requirements

### Requirement: package manifest 声明内置能力
Buildr package manifest MUST 声明可同步到用户 workspace 的产品内置 Rules、Skills、Commands 和 Skill capability contracts，并提供旧 workspace 安全采用所需的官方完整性证据。

#### Scenario: 声明内置 Rules
- **WHEN** Buildr package 包含产品内置 Rules
- **THEN** `package/manifest.yml` MUST 声明每个内置 Rule 的 id、源路径、目标路径、description 和 required 状态
- **AND** version 或 hash 元数据 MAY 声明，但不是必填

#### Scenario: 声明内置 Skills
- **WHEN** Buildr package 包含产品内置 Skills
- **THEN** `package/manifest.yml` MUST 声明每个内置 Skill 的 id、源路径、目标路径、适用 runtimes 和 required 状态
- **AND** composed Skill MUST additionally declare its `provides` and `requires` capability identities、versions and dependency modes
- **AND** version 或 hash 元数据 MAY 声明，但不是必填

#### Scenario: 发布工作能力适配 Skill
- **WHEN** Buildr package 发布 `capability-adaptation`
- **THEN** 该 Skill MUST 作为 optional 管理 Skill 随 workspace sync 投射到全部 supported runtimes
- **AND** 其 description MUST 覆盖采用内部流程、调整工作方式、修改或替换 Skill 行为等自然语言意图
- **AND** 该 Skill MUST NOT 为自身声明空洞 capability contract

#### Scenario: 声明内置 capability contracts
- **WHEN** Buildr package publishes builtin providers or consumers
- **THEN** `package/manifest.yml` MUST declare each referenced contract id、version、description and source path
- **AND** package metadata MUST identify initial default bindings without making provider Skill ids part of the contract identity
- **AND** package check MUST validate contract frontmatter、fixed semantic sections and manifest identity consistency

#### Scenario: 未声明版本的内置能力
- **WHEN** 某个内置能力未声明 version 或 hash
- **THEN** Buildr doctor MUST 仍使用安装回执检查该内置能力的精确 live 状态
- **AND** Buildr MUST NOT 仅因为没有独立 assets version 输出 warning

#### Scenario: 声明内置 Commands
- **WHEN** Buildr package 包含产品内置 Commands
- **THEN** `package/manifest.yml` MUST 声明每个内置 Command 在 `commands/manifest.yml` 中需要写入的 manifest entry
- **AND** 内置 Commands MUST 保持为声明和安装提示，不得变成自动本机安装

#### Scenario: 声明 legacy 官方完整性
- **WHEN** Buildr 需要让无回执 workspace 从受支持的旧版 Builtin 自动升级
- **THEN** package MUST 按 Builtin 身份声明对应 legacy SHA-256 完整性
- **AND** legacy 完整性 MUST 只用于证明随既有 CLI package 发布过的官方内容

#### Scenario: package check 校验内置能力
- **WHEN** Agent 运行 `buildr package check`
- **THEN** Buildr MUST 校验已声明的内置能力源路径
- **AND** Buildr MUST 校验 forbidden patterns、必需 Skill 文件、manifest entry 结构、目标路径安全性、legacy integrity 格式及身份唯一性
- **AND** Buildr MUST validate every contract reference、initial default binding、provides/requires version and dependency mode

#### Scenario: Rules 和 Skills manifest-first
- **WHEN** Buildr package 发布内置 Rules 或 Skills
- **THEN** sync MUST 将它们登记到 `rules/manifest.yml` 或 `skills/manifest.yml`
- **AND** Buildr MUST NOT 依赖扫描裸文件决定规则、技能或 capability bindings 是否生效

#### Scenario: Rule manifest metadata
- **WHEN** Buildr 创建、安装或更新 Rule manifest entry
- **THEN** entry MUST 声明 `id`、`source`、`path`、`description`、`enabled` 和 `required`
- **AND** `description` MUST 描述适用场景和用途，供 Agent 判断何时读取该规则
- **AND** `description` MUST NOT 用来承载规则正文

#### Scenario: package baseline 排除未声明内置能力
- **WHEN** Buildr 打包或校验产品资产
- **THEN** builtin package 源目录下的文件 MUST 只有在 package manifest 声明或被 package include 边界覆盖时才能进入发布包

### Requirement: 产品验证覆盖 Task Finish 收尾契约
Buildr package verification MUST 确保 `task-finish` 作为 `buildr.task-finish/v1` 默认 provider 发布、按 capability 路由，并通过绑定的 worktree-lifecycle 与 Git task-integration providers 保留安全收尾契约。

#### Scenario: 校验 Task Finish 随包发布
- **WHEN** Buildr 执行 package check
- **THEN** workspace Skill manifests MUST 声明 enabled、installed 的 `task-finish` 及其 provides/requires
- **AND** 产品入口 Buildr Skill MUST 将完整任务收尾意图路由到 `buildr.task-finish/v1` selected provider
- **AND** Git Ops Skill description MUST NOT 继续声明完整“收尾”意图

#### Scenario: 校验收尾状态机
- **WHEN** Buildr 验证随包 `task-finish` Skill
- **THEN** 验证 MUST 覆盖前置检查、两个 required provider resolutions 与披露、OpenSpec 归档、EOF 空白行处理、验证证据复用、提交、provider integration、push、入口迁移和本地清理
- **AND** 验证 MUST 确认 tree 改变后重验、tree 相同时不重复 E2E
- **AND** verification MUST NOT require `task-finish` to duplicate the selected provider's rebase、fast-forward or merge policy
- **AND** verification MUST NOT require `task-finish` to duplicate worktree placement、retention or cleanup policy

#### Scenario: 校验收尾授权边界
- **WHEN** Buildr 验证随包 `task-finish` Skill
- **THEN** 验证 MUST 确认“收尾”不授权 force push、远端任务分支删除、丢弃改动、共享分支历史改写或语义冲突决策
- **AND** merge commit MUST follow the selected provider contract and execution disclosure rather than a global Task Finish prohibition
- **AND** 验证 MUST 确认任何失败会停止尚未执行的 integrate、push 或 cleanup

#### Scenario: Core 不复制收尾流程
- **WHEN** Buildr 验证 required Core、capability contracts 和 Task Finish provider
- **THEN** 完整 task closeout 操作手册 MUST 只存在于 Skills
- **AND** required Core MUST NOT 包含 OpenSpec archive EOF 修复或 Git 收尾步骤
- **AND** Core MAY contain only the provider-binding and workspace-transition invariants required regardless of optional Skill lifecycle

## ADDED Requirements

### Requirement: 产品验证覆盖 capability provider replacement
Buildr product verification MUST 覆盖默认 provider、内部 provider 替换、provider 卸载、歧义、版本冲突和 optional degradation，并 MUST 验证所有 supported runtime adapters 获得一致 binding 语义。

#### Scenario: 默认 providers 完成现有工作流
- **WHEN** a temporary workspace uses package defaults
- **THEN** Git/task consumers MUST resolve to the declared builtin providers
- **AND** existing workspace update、worktree and finish behavior MUST remain available

#### Scenario: 内部 provider 替换 Git Ops
- **WHEN** a temporary workspace installs compatible internal Git providers、binds all required Git capabilities and uninstalls `git-ops`
- **THEN** product entry、`task-worktree` and `task-finish` MUST remain capability-ready
- **AND** render and doctor MUST identify the internal providers without restoring `git-ops`

#### Scenario: Required provider 缺失或有歧义
- **WHEN** a test removes the only compatible required provider or leaves multiple unbound providers in the nearest scope
- **THEN** doctor MUST report `blocked` with `missing_provider` or `ambiguous_provider` reason、affected consumers、candidates and nextActions
- **AND** runtime render MUST retain affected consumers with blocked safety guidance and retain unrelated Skills

#### Scenario: Optional provider 缺失
- **WHEN** `task-asset-review` is unavailable to `task-finish`
- **THEN** doctor MUST report non-blocking degradation
- **AND** rendered Task Finish binding evidence MUST declare the skipped optional stage

#### Scenario: Runtime adapters 接收相同解析结果
- **WHEN** Buildr renders the same scope for each supported Agent adapter
- **THEN** every adapter MUST project equivalent capability status、selected provider and provenance
- **AND** adapter-specific paths MUST NOT change provider resolution

#### Scenario: Transitive provider dependency 被阻断或成环
- **WHEN** selected provider 的 required dependency blocked，或 capability graph contains a required cycle
- **THEN** product verification MUST confirm blocked readiness propagates to every affected upstream consumer
- **AND** doctor MUST report `provider_not_ready` root cause chain or `dependency_cycle` path without hanging or selecting an arbitrary edge
