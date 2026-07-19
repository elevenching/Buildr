# Managed Skill Assets

## Purpose

定义 workspace/project Skill 源资产、类型、manifest schema 和 Codex runtime 投射契约。
## Requirements
### Requirement: workspace/project Skills 源资产维护命令
Buildr MUST 提供 workspace/project Skills 源资产的 add/remove 维护命令，用于登记本地源目录、远端信息源和已解析安装源。

#### Scenario: 装载完整 Skill 源目录
- **WHEN** Agent 运行 `buildr skills add --source <skill-dir> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 要求 `<dir>` 是已初始化 Buildr workspace
- **AND** Buildr MUST 要求 `<scope>` 是 `.` 或 `projects/<project>`
- **AND** Buildr MUST 从 `<skill-dir>/SKILL.md` frontmatter 的 `name` 读取 Skill id
- **AND** Buildr MUST 将该 Skill 登记到对应 scope 的 `skills/manifest.yml`
- **AND** Buildr MUST 将支持的 Skill 源资产内容装载到对应 scope 的 `skills/<skill-id>/`
- **AND** manifest 条目 MUST 写为 `path` 本地源目录条目

#### Scenario: 登记远端信息源
- **WHEN** Agent 运行 `buildr skills add <id> --remote-source <url> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 要求 `<dir>` 是已初始化 Buildr workspace
- **AND** Buildr MUST 要求 `<scope>` 是 `.` 或 `projects/<project>`
- **AND** Buildr MUST 将该 Skill 登记到对应 scope 的 `skills/manifest.yml`
- **AND** manifest 条目 MUST 保存 source URL 和 source kind
- **AND** 当 Agent 未提供 source kind时，Buildr MUST 将 source kind 记录为 `url`
- **AND** manifest 条目 MUST 标记该 Skill 需要 Agent 安装或解析
- **AND** Buildr MUST NOT 尝试复制或安装该 source

#### Scenario: 登记已解析安装源
- **WHEN** Agent 运行 `buildr skills add <id> --resolved-source <url> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 要求 `<dir>` 是已初始化 Buildr workspace
- **AND** Buildr MUST 将 `<url>` 登记为该 Skill 的精确安装源
- **AND** 当 Agent 未提供 resolved kind 时，Buildr MUST 将 resolved kind 记录为 `skill-url`
- **AND** `skill-url` MUST 表示该 URL 的内容是 raw `SKILL.md`
- **AND** manifest 条目 MUST 在 Agent 提供原始 source URL 时保存该 URL
- **AND** manifest 条目 MUST 在 Agent 提供 version 或 integrity 时保存到 `resolved`
- **AND** manifest 条目 MUST 标记该 Skill 可由 Buildr render 安装

#### Scenario: 已解析安装源默认 runtime 名称
- **WHEN** Agent 登记已解析安装源
- **AND** manifest 条目没有额外声明 Agent runtime 名称
- **THEN** Buildr MUST 默认使用 Skill id 作为 Agent runtime 中的 Skill 名称

#### Scenario: 已解析安装源保留原始信息源
- **WHEN** Agent 运行 `buildr skills add <id> --remote-source <source-url> --resolved-source <skill-md-url> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 将 `<source-url>` 保存到 `source`
- **AND** Buildr MUST 将 `<skill-md-url>` 保存到 `resolved`
- **AND** manifest 条目 MUST 标记该 Skill 可由 Buildr render 安装

#### Scenario: 不支持的 resolved kind
- **WHEN** Agent 使用 `skills add --resolved-source` 提供当前 CLI 不支持的 resolved kind
- **THEN** Buildr MUST 报告错误
- **AND** Buildr MUST NOT 猜测如何安装该来源

#### Scenario: 显式 id 必须对齐
- **WHEN** Agent 运行 `buildr skills add <id> --source <skill-dir> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 校验 `<id>` 与 `<skill-dir>/SKILL.md` frontmatter 的 `name` 一致
- **AND** 当二者不一致时 Buildr MUST 报告错误

#### Scenario: Skill 源资产结构
- **WHEN** Buildr 装载 Skill 源目录
- **THEN** Buildr MUST 要求 source 目录包含 `SKILL.md`
- **AND** Buildr MUST 支持装载 `SKILL.md` 以及可选的 `agents/`、`scripts/`、`templates/`、`assets/`、`examples/`、`references/`
- **AND** 当 source 目录包含未知顶层内容时 Buildr MUST 默认报错
- **AND** 当 Agent 显式提供 `--ignore-unsupported` 时 Buildr MUST 跳过未知顶层内容并在输出中说明未装载内容

#### Scenario: 登记已在目标位置的 Skill
- **WHEN** `--source` 指向对应 scope 的 `skills/<skill-id>/`
- **THEN** Buildr MUST 校验该目录是完整 Skill 源目录
- **AND** Buildr MUST 只更新 `skills/manifest.yml`
- **AND** Buildr MUST NOT 复制或删除该目录

#### Scenario: 替换 Skill 源资产
- **WHEN** Agent 运行任一 `skills add` 登记命令并提供 `--replace`
- **AND** 对应 scope 已存在同 id Skill
- **THEN** Buildr MUST 替换 manifest 条目
- **AND** 当替换为本地源目录且 source 不在目标位置时 Buildr MUST 使用整目录替换语义
- **AND** 当替换为远端信息源或已解析安装源时 Buildr MUST NOT 删除既有本地源目录，除非 Agent 另行请求删除该源目录

#### Scenario: 删除 Skill 源资产
- **WHEN** Agent 运行 `buildr skills remove <id> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 从对应 scope 的 `skills/manifest.yml` 删除该 Skill 条目
- **AND** 当被删除条目是本地作者型 Skill 时，Buildr MUST 在安全校验后删除对应 `skills/<skill-id>/` 源目录
- **AND** 当被删除条目是远端发布型 Skill 时，Buildr MUST NOT 删除远端来源或 Agent runtime 投射产物
- **AND** Buildr MUST NOT 删除任何 Agent runtime 投射产物

#### Scenario: Skills manifest 摘要字段
- **WHEN** Buildr 写入 `skills/manifest.yml`
- **THEN** Buildr MUST 允许 Skill 条目包含 `description` 字段
- **AND** `description` MUST 只作为 manifest 中供人和 Agent 快速扫描的摘要
- **AND** 本地作者型 Skill 的完整触发条件、步骤和执行说明 MUST 以 `skills/<skill-id>/SKILL.md` 为准
- **AND** 远端发布型 Skill 的完整触发条件、步骤和执行说明 MUST 以已安装 runtime Skill 或远端 source / resolved 内容为准

#### Scenario: 输出下一步行为
- **WHEN** Buildr 完成 `skills add` 或 `skills remove`
- **THEN** Buildr MUST 输出中文 Agent-readable 回执
- **AND** 回执 MUST 说明已更新的源资产
- **AND** 回执 MUST 引导 Agent 按当前 Agent runtime 能力执行 Skills render、runtime check 或 doctor
- **AND** 回执 MUST NOT 硬编码特定 Agent adapter 命令

### Requirement: 本地与 package Skill 完整投射受支持目录
Buildr MUST 将启用且适用于当前 runtime 的本地作者型 Skill 和 package Skill 的受支持源目录内容完整投射到 Agent Skill runtime 目录，并 MUST 保持 Skill 入口派生内容与随附资源的不同处理边界。

#### Scenario: 渲染带随附资源的本地 Skill
- **WHEN** 本地作者型 Skill 包含 `SKILL.md` 以及 `agents/`、`assets/`、`scripts/`、`templates/`、`examples/` 或 `references/` 下的普通文件
- **THEN** Buildr MUST 将 `SKILL.md` 和所有受支持随附文件投射到同一 runtime Skill 目录的对应相对路径
- **AND** runtime 中的目录结构 MUST 与源 Skill 的受支持目录结构一致

#### Scenario: 渲染 package Skill
- **WHEN** workspace manifest 通过 `package:<source-id>` 引用随包 Skill source
- **THEN** Buildr MUST 从 package Skill 完整源目录生成 runtime Skill
- **AND** Buildr MUST NOT 只因该 Skill 通过 package reference 解析而丢弃随附文件

#### Scenario: Skill 入口继续由 Buildr 派生
- **WHEN** Buildr 渲染完整 Skill 目录
- **THEN** runtime `SKILL.md` MUST 继续包含适用的 managed marker、contributions、capability bindings 和 adapter context
- **AND** 其他随附文件 MUST 保持源文件原始字节，不得注入 `SKILL.md` 专用内容

#### Scenario: 脚本保持可执行
- **WHEN** 受支持 Skill 目录中的普通文件具有 owner executable bit
- **THEN** Buildr MUST 在支持 POSIX 权限的 runtime target 上保留 owner executable 状态
- **AND** Buildr MUST NOT 把 source 的无关 group 或 other 权限当作 Skill 行为契约

#### Scenario: 远端单文件来源保持边界
- **WHEN** Skill 使用 `resolved.kind: skill-url`
- **THEN** Buildr MUST 继续把该来源解释为单个 raw `SKILL.md`
- **AND** Buildr MUST NOT 猜测、抓取或合成该 URL 未声明的随附目录

#### Scenario: 拒绝不安全的 Skill 包成员
- **WHEN** 本地或 package Skill 的受支持目录中包含符号链接、路径逃逸或非普通文件
- **THEN** Buildr MUST 在写入任何 runtime 文件前拒绝该次投射
- **AND** Buildr MUST NOT 跟随该成员读取或写入 Skill 源目录和 runtime target 之外的内容

### Requirement: workspace/project Skills 支持两种类型
Buildr MUST 将 workspace/project Skill 源资产区分为本地作者型 Skill 和远端发布型 Skill。

#### Scenario: 本地作者型 Skill
- **WHEN** Skill manifest 条目使用 `path`
- **THEN** Buildr MUST 将该 Skill 视为本地作者型 Skill
- **AND** 该 Skill 的完整源内容 MUST 位于当前 scope 的 `skills/<skill-id>/`
- **AND** 该目录 MUST 至少包含 `SKILL.md`

#### Scenario: 远端发布型 Skill
- **WHEN** Skill manifest 条目使用 `source` 或 `resolved`
- **THEN** Buildr MUST 将该 Skill 视为远端发布型 Skill
- **AND** Buildr MUST NOT 要求当前 workspace 或 project 下存在该 Skill 的完整源目录
- **AND** 当 manifest 条目包含 `source` 时，`source` MUST 表示信息来源，不等同于可直接安装的 Skill 包

#### Scenario: 远端信息源未解析
- **WHEN** 远端发布型 Skill 只有 `source` 且没有 `resolved`
- **THEN** Buildr MUST 将该 Skill 视为未解析远端信息源
- **AND** Buildr MUST 保留 source 信息供 Agent 后续解析或安装

#### Scenario: 远端信息源已解析
- **WHEN** 远端发布型 Skill 包含 `resolved`
- **THEN** Buildr MUST 将 `resolved` 视为精确安装源
- **AND** 当该条目同时包含 `source` 时，Buildr MUST 使用 `resolved` 而不是 `source` 执行可确定的安装或校验

### Requirement: Buildr Skill 前置说明 Skill 类型和安装方式
Buildr 内置 Skill 的 `SKILL.md` MUST 在资产维护细节前说明 workspace/project Skill 的类型、登记方式和 render 方式。

#### Scenario: 前置 Skill 类型
- **WHEN** Agent 阅读 Buildr Skill
- **THEN** Buildr Skill MUST 先说明本地作者型 Skill 和远端发布型 Skill 的区别
- **AND** Buildr Skill MUST 说明本地作者型 Skill 适合项目专用流程、私有沉淀和未发布 Skill
- **AND** Buildr Skill MUST 说明远端发布型 Skill 适合已发布或外部维护的 Skill

#### Scenario: 前置三种登记方式
- **WHEN** Agent 阅读 Buildr Skill
- **THEN** Buildr Skill MUST 说明本地源目录、远端信息源和已解析安装源三种登记方式
- **AND** Buildr Skill MUST 引导 Agent 先登记 source，再在能解析时升级为 resolved

#### Scenario: 前置三种 render 方式
- **WHEN** Agent 阅读 Buildr Skill
- **THEN** Buildr Skill MUST 说明 Buildr 本地安装、Buildr 远端安装和 Agent 自行安装三种 render 结果

### Requirement: Codex Skills runtime 投射
Buildr MUST 支持将适用的 Buildr Skills 渲染到当前 Codex 打开项目根目录的 `.agents/skills`。

#### Scenario: 渲染 Skill 到 Codex
- **WHEN** Buildr 为 workspace 渲染 Codex runtime
- **THEN** Buildr MUST 将每个已启用且适用的 Skill 安装到当前 Codex 打开项目根目录的 `.agents/skills/<skill-id>/`
- **AND** 每个已安装 Skill MUST 包含有效的 `SKILL.md`

#### Scenario: Codex Skill 源结构
- **WHEN** Buildr 校验面向 Codex runtime 的 Skill
- **THEN** Buildr MUST 要求存在带必需 frontmatter 字段的 `SKILL.md`
- **AND** Buildr MAY 包含受支持的可选 `scripts/`、`references/`、`assets/` 和 `agents/openai.yaml` 文件

#### Scenario: Codex Skill 冲突
- **WHEN** Buildr 内置 Skill id 与用户 Skill id 在 Codex runtime 中冲突
- **THEN** Buildr MUST 报告该冲突
- **AND** Buildr MUST 要求用户或 Agent 先卸载内置 Skill 或重命名用户 Skill，再进行 render，不能静默选择其中一个

### Requirement: Skills manifest schemaVersion
Buildr MUST 要求 workspace/project `skills/manifest.yml` 声明 Skill manifest schema version，并 MUST 通过 `buildr.skills/v2` 表达 capability contracts、bindings、providers 和 consumers。

#### Scenario: 新建 Skills manifest
- **WHEN** Buildr creates a workspace or project `skills/manifest.yml`
- **THEN** Buildr MUST write `schemaVersion: buildr.skills/v2`
- **AND** 没有 capability composition 的 manifest MAY 省略空的 `contracts` 和 `bindings`

#### Scenario: v1 Skills manifest 升级到 v2
- **WHEN** Buildr update or sync reads a valid `buildr.skills/v1` manifest
- **THEN** Buildr MUST transactionally migrate it to `buildr.skills/v2`
- **AND** migration MUST preserve every existing Skill identity、source/path、description、enabled、required、state、reason、runtime 和远端安装信息
- **AND** migration MUST add package-declared `provides`、`requires`、contracts 和 initial default bindings only where no user binding exists and the corresponding managed builtin state permits them
- **AND** migration MUST NOT restore an uninstalled builtin provider or overwrite an explicit user provider choice

#### Scenario: 旧 Skills manifest 缺 schemaVersion
- **WHEN** an existing `skills/manifest.yml` has valid Skill entries but no `schemaVersion`
- **THEN** Buildr update or sync MUST transactionally migrate it to `buildr.skills/v2`
- **AND** Buildr doctor MUST report a warning before the file is repaired

#### Scenario: Skills manifest schemaVersion 错误
- **WHEN** `skills/manifest.yml` declares an unsupported `schemaVersion`
- **THEN** Buildr doctor MUST report an error with supported versions and executable nextActions
- **AND** Buildr MUST NOT partially render or rewrite the unsupported manifest

#### Scenario: 旧 CLI 读取 v2 manifest
- **WHEN** a Buildr CLI version that does not support `buildr.skills/v2` reads a v2 manifest
- **THEN** the CLI MUST fail explicitly rather than ignore `contracts`、`bindings`、`provides` or `requires`
- **AND** rollback MUST use a pre-migration snapshot or an explicit lossy downgrade action

### Requirement: 已解析外部 Skill 保持上游源资产身份
Buildr MUST 将随包或 workspace Component 使用的已解析外部 Skill 物化为可验证的上游源资产，并将任何 Buildr 增强限制在 Agent runtime 派生阶段。

#### Scenario: 物化已解析外部 Skill
- **WHEN** enabled Component 声明一个具有 source、resolved source、version 和 integrity 的外部 Skill
- **THEN** Buildr MUST 将其物化到非 `skills/buildr/` 的来源命名空间
- **AND** 物化内容 MUST 匹配 resolved source 的版本和 integrity
- **AND** Buildr MUST NOT 将包含 sidebar 修改的副本登记为该外部 Skill 的源资产

#### Scenario: 渲染外部 Skill 派生版本
- **WHEN** 外部 Skill 与 enabled sidebar contribution 一起参与 Agent runtime render
- **THEN** runtime Skill MUST 由已验证上游内容和已验证 contributions 确定性组合
- **AND** runtime receipt/check MUST 追踪上游来源与每个 contribution provenance
- **AND** workspace 外部 Skill 的源内容 MUST 保持不变

#### Scenario: 外部 Skill 上游更新
- **WHEN** resolved source、version 或 integrity 更新
- **THEN** Buildr MUST 先验证新的上游内容和 sidebar 兼容性
- **AND** 验证通过后 MUST 以新上游内容重新生成 runtime 派生版本
- **AND** Buildr sidebar 内容 MUST 从独立的 Buildr-owned members 继续组合，不得人工合并回外部源正文

### Requirement: Skill 生命周期保留 capability declarations
Buildr MUST 在 Skill add/remove、builtin install/uninstall/restore、update、sync 和 render 生命周期中一致维护 capability identity、dependency 和 binding 信息，并 MUST 避免普通安装或更新静默改变现有 provider 选择。

#### Scenario: 更新 managed builtin provider
- **WHEN** package update changes a managed builtin Skill that provides or requires capabilities
- **THEN** Buildr MUST reconcile package-owned declarations while preserving user-owned bindings and uninstall state
- **AND** Buildr MUST only require pre-mutation impact disclosure when the update would remove、disable or rebind a selected provider
- **AND** final doctor MUST report the resulting dependency graph

#### Scenario: 移除用户 provider
- **WHEN** Agent removes a user Skill that is selected by one or more bindings
- **THEN** Buildr MUST expose the affected required and optional consumers before mutation
- **AND** Buildr MUST preserve enough manifest evidence for doctor to explain any resulting missing or ambiguous dependency

### Requirement: Skills CLI 提供最小 capability 声明与 binding 写入口
Buildr MUST 让 Agent 通过事务化 Skills CLI 声明 provider/consumer 和显式 binding，而不要求普通用户直接编辑 `buildr.skills/v2` 嵌套结构。

#### Scenario: 添加 provider 或 consumer declarations
- **WHEN** Agent 运行 `buildr skills add` 或 replace 并提供重复的 `--provides <capability>@<version>` 或 `--requires <capability>@<version>:<required|optional>`
- **THEN** Buildr MUST 校验 contract identity、version、scope、重复声明和 dependency mode 后再写入 Skill entry
- **AND** command MUST preserve all v2 contract、binding 和 unrelated Skill data not owned by the mutation

#### Scenario: 显式绑定 provider
- **WHEN** Agent 运行 `buildr skills bind <capability>@<version> --provider <skill-id> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 校验 contract 和 provider 在该 scope 可见且 version 兼容
- **AND** Buildr MUST transactionally write only the selected scope binding and run final doctor
- **AND** command MUST NOT install the provider、uninstall builtin or claim behavior verification

#### Scenario: 删除显式 binding
- **WHEN** Agent 运行 `buildr skills unbind <capability>@<version> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 删除且只删除当前 scope 的 matching binding
- **AND** resolver MUST 根据剩余 visible providers 产生 ready、blocked 或 degraded 结果
- **AND** final doctor MUST report any resulting ambiguity or missing provider
