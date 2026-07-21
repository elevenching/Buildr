## ADDED Requirements

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

## MODIFIED Requirements

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
