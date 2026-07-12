## ADDED Requirements

### Requirement: workspace/project Skills manifest 支持引用型来源
Buildr MUST 支持 workspace/project `skills/manifest.yml` 同时声明本地源目录 Skill 和引用型 Skill。

#### Scenario: 本地源目录条目
- **WHEN** Skill manifest 条目包含 `id` 和 `path`
- **THEN** Buildr MUST 将该条目解析为当前 scope 的本地 Skill 源目录
- **AND** Buildr MUST 要求该目录包含可读取的 `SKILL.md`
- **AND** Buildr MUST 将 `path` 作为默认 runtime path

#### Scenario: 引用型条目
- **WHEN** Skill manifest 条目包含 `id` 和 `source`
- **THEN** Buildr MUST 将该条目解析为引用型 Skill
- **AND** Buildr MUST 通过受支持的 source resolver 定位实际 Skill 源资产
- **AND** Buildr MUST NOT 要求当前 workspace 或 project 下存在 `skills/<skill-id>/SKILL.md`

#### Scenario: path 与 source 互斥
- **WHEN** Skill manifest 条目同时包含 `path` 和 `source`
- **THEN** Buildr MUST 将 manifest 视为无效

#### Scenario: 缺少来源字段
- **WHEN** Skill manifest 条目不包含 `path` 且不包含 `source`
- **THEN** Buildr MUST 将 manifest 视为无效

#### Scenario: 引用来源不可解析
- **WHEN** Skill manifest 条目的 `source` 使用未支持的来源类型或无法定位到 `SKILL.md`
- **THEN** Buildr MUST 在 render、runtime check 或 doctor 中报告错误
- **AND** Buildr MUST NOT 静默跳过该 Skill

#### Scenario: 引用来源名称必须匹配
- **WHEN** Buildr 解析引用型 Skill 来源
- **AND** resolved `SKILL.md` frontmatter 的 `name` 与 manifest 条目 `id` 不一致
- **THEN** Buildr MUST 报告错误

## MODIFIED Requirements

### Requirement: Buildr 技能引导工具型资产维护
Buildr 内置技能 MUST 引导 Agent 使用 Buildr 源资产维护规则、技能和命令行工具清单，并区分源资产维护与运行环境投射。

#### Scenario: 维护规则
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的规则
- **THEN** Buildr 技能 MUST 引导 Agent 修改当前 scope 的 `AGENTS.md` 或 `rules/`
- **AND** Buildr 技能 MUST NOT 引导 Agent 使用不存在的 `rules add/remove`
- **AND** Buildr 技能 MUST 引导 Agent 在需要时运行 runtime check 或 rules render

#### Scenario: 维护技能
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的技能
- **THEN** Buildr 技能 MUST 引导 Agent 区分本地源目录 Skill 与引用型 Skill
- **AND** 对于需要团队直接维护内容的 Skill，Buildr 技能 MUST 引导 Agent 使用 `skills add/remove` 装载或移除完整 Skill 源目录
- **AND** 对于由产品包或受支持外部来源维护的 Skill，Buildr 技能 MUST 引导 Agent 维护 `skills/manifest.yml` 中的引用型条目
- **AND** Buildr 技能 MUST 说明 workspace/project 技能源资产至少由 `skills/manifest.yml` 组成，本地作者型 Skill 还包含 `skills/<skill-id>/` 目录
- **AND** 本地技能目录 MUST 至少包含 `SKILL.md`
- **AND** Buildr 技能 MUST 引导 Agent 按当前 Agent runtime 能力运行对应 render 或 runtime check

#### Scenario: 从零创建技能内容
- **WHEN** 用户要求从零设计一个新 Skill
- **THEN** Buildr 技能 MUST 引导 Agent 直接在目标 scope 的 `skills/<skill-id>/SKILL.md` 和配套目录中维护源内容
- **AND** Buildr 技能 MAY 引导 Agent 在内容完成后使用 `skills add --source <scope>/skills/<skill-id>` 登记为本地源目录条目
- **AND** Buildr 技能 MUST NOT 将 `skills add` 描述为自动生成高质量 Skill 内容的命令

#### Scenario: 维护引用型技能
- **WHEN** 用户要求启用或移除由 Buildr 产品包维护的 workspace/project Skill
- **THEN** Buildr 技能 MUST 引导 Agent 使用引用型 manifest 条目
- **AND** Buildr 技能 MUST NOT 引导 Agent 将该 Skill 的完整 `SKILL.md` 复制到 workspace 作为默认维护方式

#### Scenario: 维护命令行工具清单
- **WHEN** 用户要求团队使用某个外部命令行工具且该需求需要沉淀或复用
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `commands add/remove` 维护 `commands/manifest.yml`
- **AND** Buildr 技能 MUST 引导 Agent 运行 `commands check` 或 `doctor --json`

#### Scenario: 区分产品内置技能安装和 workspace 技能维护
- **WHEN** Agent 需要安装或修复 Buildr 产品内置技能
- **THEN** Buildr 技能 MUST 引导 Agent 使用 `buildr skill install <agent>`
- **AND** Buildr 技能 MUST NOT 将 `buildr skill install <agent>` 描述为新增、装载或维护 workspace/project 技能的入口

#### Scenario: 本机缺少命令行工具
- **WHEN** 命令行工具清单检查报告本机缺少命令或版本不满足要求
- **THEN** Buildr 技能 MUST 引导 Agent 根据清单中的 `installHint` 向用户说明差异
- **AND** Buildr 技能 MUST NOT 要求 Buildr 自动安装该命令行工具

#### Scenario: Agent runtime 找不到 workspace/project 技能
- **WHEN** 当前 Agent runtime 找不到用户所需技能
- **THEN** Buildr 技能 MUST 引导 Agent 先检查 Buildr workspace/project Skills manifest、引用来源和 runtime 状态
- **AND** 当源资产存在但 runtime 未同步或已过期时，Buildr 技能 MUST 引导 Agent 按当前 adapter 执行 Skills render 或 runtime check
- **AND** 当源资产不存在且该技能需要沉淀复用时，Buildr 技能 MUST 引导 Agent 先维护 Buildr Skills 源资产
- **AND** Buildr 技能 MUST NOT 引导 Agent 直接把 Agent runtime 目录当作源资产维护

#### Scenario: 本机找不到未声明的命令行工具
- **WHEN** 本机找不到用户所需命令行工具，且命令行工具清单没有对应团队声明
- **THEN** Buildr 技能 MUST 引导 Agent 判断该工具是否需要团队复用
- **AND** 当需要团队复用时，Buildr 技能 MUST 引导 Agent 先用 `commands add` 登记源资产，再运行 `commands check`
- **AND** 当只需一次性本机操作时，Buildr 技能 MUST NOT 要求写入 Buildr 命令行工具清单

### Requirement: workspace/project Skills 源资产维护命令
Buildr MUST 提供 workspace/project Skills 源资产的 add/remove 维护命令，用于装载本地完整 Skill 源目录和登记引用型 Skill。

#### Scenario: 装载完整 Skill 源目录
- **WHEN** Agent 运行 `buildr skills add --source <skill-dir> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 要求 `<dir>` 是已初始化 Buildr workspace
- **AND** Buildr MUST 要求 `<scope>` 是 `.` 或 `projects/<project>`
- **AND** Buildr MUST 从 `<skill-dir>/SKILL.md` frontmatter 的 `name` 读取 Skill id
- **AND** Buildr MUST 将该 Skill 登记到对应 scope 的 `skills/manifest.yml`
- **AND** Buildr MUST 将支持的 Skill 源资产内容装载到对应 scope 的 `skills/<skill-id>/`
- **AND** Buildr MUST 将 manifest 条目写为 `path` 本地源目录条目

#### Scenario: 登记引用型 Skill
- **WHEN** Agent 运行 `buildr skills add <id> --reference <source-ref> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 要求 `<dir>` 是已初始化 Buildr workspace
- **AND** Buildr MUST 要求 `<scope>` 是 `.` 或 `projects/<project>`
- **AND** Buildr MUST 校验 `<source-ref>` 可由受支持 resolver 解析为 Skill 源资产
- **AND** Buildr MUST 校验 resolved `SKILL.md` frontmatter 的 `name` 与 `<id>` 一致
- **AND** Buildr MUST 将该 Skill 登记到对应 scope 的 `skills/manifest.yml`
- **AND** Buildr MUST 将 manifest 条目写为 `source` 引用型条目
- **AND** Buildr MUST NOT 将 resolved Skill 源目录复制到 workspace 或 project

#### Scenario: 显式 id 必须对齐
- **WHEN** Agent 运行 `buildr skills add <id> --source <skill-dir> --scope <scope> --target <dir>`
- **THEN** Buildr MUST 校验 `<id>` 与 `<skill-dir>/SKILL.md` frontmatter 的 `name` 一致
- **AND** 当二者不一致时 Buildr MUST 报告错误

#### Scenario: Skill 源资产结构
- **WHEN** Buildr 装载本地 Skill 源目录
- **THEN** Buildr MUST 要求 source 目录包含 `SKILL.md`
- **AND** Buildr MUST 支持装载 `SKILL.md` 以及可选的 `scripts/`、`templates/`、`assets/`、`examples/`、`references/`
- **AND** 当 source 目录包含未知顶层内容时 Buildr MUST 默认报错
- **AND** 当 Agent 显式提供 `--ignore-unsupported` 时 Buildr MUST 跳过未知顶层内容并在输出中说明未装载内容

#### Scenario: 登记已在目标位置的 Skill
- **WHEN** `--source` 指向对应 scope 的 `skills/<skill-id>/`
- **THEN** Buildr MUST 校验该目录是完整 Skill 源目录
- **AND** Buildr MUST 只更新 `skills/manifest.yml`
- **AND** Buildr MUST NOT 复制或删除该目录

#### Scenario: 替换本地 Skill 源资产
- **WHEN** Agent 运行 `buildr skills add --source <skill-dir> --replace`
- **AND** 对应 scope 已存在同 id Skill
- **THEN** Buildr MUST 使用整目录替换语义
- **AND** 当 source 不在目标位置时 Buildr MUST 先校验 source，再替换目标 `skills/<skill-id>/`
- **AND** Buildr MUST 保留原 manifest 条目位置
- **AND** Buildr MUST NOT 执行局部文件合并

#### Scenario: 替换为引用型 Skill
- **WHEN** Agent 运行 `buildr skills add <id> --reference <source-ref> --replace`
- **AND** 对应 scope 已存在同 id Skill
- **THEN** Buildr MUST 替换 manifest 条目为引用型条目
- **AND** Buildr MUST NOT 删除既有本地源目录，除非 Agent 另行请求删除该源目录

#### Scenario: 删除本地 Skill 源资产
- **WHEN** Agent 运行 `buildr skills remove <id> --scope <scope> --target <dir>`
- **AND** 被删除条目是 `path` 本地源目录条目
- **THEN** Buildr MUST 从对应 scope 的 `skills/manifest.yml` 删除该 Skill 条目
- **AND** Buildr MUST 在安全校验后删除对应 `skills/<skill-id>/` 源目录
- **AND** Buildr MUST NOT 删除任何 Agent runtime 投射产物

#### Scenario: 删除引用型 Skill
- **WHEN** Agent 运行 `buildr skills remove <id> --scope <scope> --target <dir>`
- **AND** 被删除条目是 `source` 引用型条目
- **THEN** Buildr MUST 从对应 scope 的 `skills/manifest.yml` 删除该 Skill 条目
- **AND** Buildr MUST NOT 删除 resolved 引用来源的包内或外部源资产
- **AND** Buildr MUST NOT 删除任何 Agent runtime 投射产物

#### Scenario: Skills manifest 摘要字段
- **WHEN** Buildr 写入 `skills/manifest.yml`
- **THEN** Skill 条目 MAY 包含 `description` 字段
- **AND** `description` MUST 只作为 manifest 中供人和 Agent 快速扫描的摘要
- **AND** 本地 Skill 的完整触发条件、步骤和执行说明 MUST 以 `skills/<skill-id>/SKILL.md` 为准
- **AND** 引用型 Skill 的完整触发条件、步骤和执行说明 MUST 以 resolved `SKILL.md` 为准

#### Scenario: 输出下一步行为
- **WHEN** Buildr 完成 `skills add` 或 `skills remove`
- **THEN** Buildr MUST 输出中文 Agent-readable 回执
- **AND** 回执 MUST 说明已更新的源资产
- **AND** 回执 MUST 引导 Agent 按当前 Agent runtime 能力执行 Skills render、runtime check 或 doctor
- **AND** 回执 MUST NOT 硬编码特定 Agent adapter 命令
