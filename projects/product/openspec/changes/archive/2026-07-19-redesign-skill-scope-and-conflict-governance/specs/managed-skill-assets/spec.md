## ADDED Requirements

### Requirement: Workspace Skills 源资产维护命令
Buildr MUST 只在 workspace 根维护 Skill 源资产、contracts 和默认 bindings，并 MUST 将 Skill source authority 与 runtime destination 分离。

#### Scenario: 装载 workspace 本地 Skill
- **WHEN** Agent 运行 `buildr skills add --source <skill-dir> --target <workspace>`
- **THEN** Buildr MUST 从 `SKILL.md` frontmatter `name` 读取 Skill ID
- **AND** Buildr MUST 将完整受支持目录装载或登记到 `<workspace>/skills/<skill-id>/`
- **AND** Buildr MUST 只更新 `<workspace>/skills/manifest.yml`

#### Scenario: Project scope 不再受支持
- **WHEN** Agent 为 `skills add/remove` 提供 `--scope projects/<project>`
- **THEN** Buildr MUST 拒绝该操作并报告 breaking migration guidance
- **AND** Buildr MUST NOT 写入 Project manifest、源目录或 runtime

#### Scenario: 兼容 workspace scope 表达
- **WHEN** Agent 在迁移期为 `skills add/remove` 提供 `--scope .`
- **THEN** Buildr MUST 将其解析为 workspace source authority并输出 deprecated warning
- **AND** canonical help 和 receipt MUST 省略 source scope 或明确使用 workspace 术语

### Requirement: Skill asset identity 与 runtime name 分离
Buildr MUST 为每个 workspace Skill 保存稳定 `assetIdentity` 和 `sourceIdentity`，同时保持 Skill ID、`SKILL.md` name 与 runtime directory name 一致。

#### Scenario: 同一 manifest entry 内容更新
- **WHEN** 已登记本地 Skill 的受支持内容改变且 manifest entry identity 保持不变
- **THEN** Buildr MUST 将其视为同一 asset identity 的新 source digest
- **AND** Buildr MUST NOT 仅因 digest 改变将其分类为外部同名资产

#### Scenario: 不同实现使用同一 Skill ID
- **WHEN** 候选 Skill 与已有资产使用相同 Skill ID 但 source identity 不同
- **THEN** Buildr MUST 将其分类为名称冲突
- **AND** Buildr MUST 要求候选使用不同 Skill ID 或显式完成 ownership transfer

### Requirement: Skill render destination 明确区分 user 与 workspace
Buildr MUST 支持从同一 workspace Skill authority 向 `user` 或 `workspace` destination 生成 Agent runtime 投射，并 MUST 保持两种 destination 的授权和生命周期独立。

#### Scenario: Render 到 workspace
- **WHEN** Agent 运行 `buildr skills render <agent> --destination workspace --target <workspace>`
- **THEN** Buildr MUST 将 enabled workspace Skills 投射到 adapter 声明的当前工作目录 Skills root
- **AND** Buildr MUST NOT 修改用户级 Skills root

#### Scenario: Render 到 user
- **WHEN** 用户明确要求全局安装且 Agent 运行 `buildr skills render <agent> --destination user --target <workspace>`
- **THEN** Buildr MUST 从目标 workspace 读取 Skill source authority
- **AND** Buildr MUST 将候选投射到 adapter 声明的用户级 Skills root
- **AND** Buildr MUST 写入独立 ownership/projection receipt

#### Scenario: sync 不隐式写用户层
- **WHEN** Agent 运行 `init`、`sync` 或未显式选择 user destination 的组合 `render`
- **THEN** Buildr MUST 只维护 workspace destination
- **AND** Buildr MUST NOT 安装、更新、采用、转移或删除用户级 Skill

### Requirement: Buildr 对候选 Skill 执行冲突治理
Buildr MUST 在 mutation 前根据 Skill ID、asset identity、source identity、ownership 和完整 runtime digest 对候选涉及的有效 Agent Skills 执行冲突分类。

#### Scenario: 同 ID 同一投射
- **WHEN** target 已存在相同 asset identity 和 render digest 的受管 Skill
- **THEN** Buildr MUST 返回 `already_projected`
- **AND** Buildr MUST 保持 Skill 文件幂等零写入

#### Scenario: 同一资产受控更新
- **WHEN** target receipt 证明相同 asset identity、合法 ownership 且候选 digest 已变化
- **THEN** Buildr MUST 将操作分类为 `update`
- **AND** Buildr MUST 使用整包事务更新 Skill 和 receipt

#### Scenario: 同名外部不同内容
- **WHEN** 可观测有效 Skills 集存在相同 Skill ID，但 asset/source identity 或内容与候选不同
- **THEN** Buildr MUST 报告 `skill_name_conflict` 或 `skill_foreign_owner`
- **AND** Buildr MUST 在写入任何候选 runtime 文件前停止整次 mutation

#### Scenario: 同名同内容但无 receipt
- **WHEN** 可观测目标存在同名同内容 Skill 但 Buildr 无法证明 asset identity 和 ownership
- **THEN** Buildr MUST 报告 `skill_equivalent_external`
- **AND** Buildr MUST NOT 自动取得更新或卸载权

#### Scenario: 不相关的外部重复 Skill
- **WHEN** 有效 Skills 集存在外部重复 ID，但本次 mutation 没有该 ID 的候选
- **THEN** doctor MAY 报告 warning
- **AND** Buildr MUST NOT 仅因该不相关重复阻止本次 mutation

### Requirement: 同一 Buildr Skill 不重复进入有效发现集合
Buildr MUST 保证同一 Agent 当前 workspace 的可观测有效发现集合中，同一 Buildr asset identity 最多存在一个 active projection。

#### Scenario: 用户层已经满足 workspace Skill
- **WHEN** workspace render 发现用户层已有相同 asset identity 和 render digest
- **THEN** Buildr MUST 返回 `satisfied_by_user` 并记录 satisfaction evidence
- **AND** Buildr MUST NOT 创建重复 workspace Skill 目录

#### Scenario: 用户层与 workspace 层需要同名不同版本
- **WHEN** user 与 workspace destination 解析到相同 Skill ID 但不同 render digest
- **THEN** Buildr MUST 报告 blocking conflict
- **AND** nextActions MUST 要求统一版本、移除其中一个投射或为变体使用不同 Skill ID

### Requirement: Project Skill 源资产迁移保持保守和可恢复
Buildr MUST 提供 Project Skill migration check/apply，使 legacy Project Skills 收敛到 workspace authority，且无法无歧义合并时 MUST 保留现场。

#### Scenario: Project 独有 Skill
- **WHEN** legacy Project manifest 的 Skill ID 不存在于 workspace manifest
- **THEN** migration plan MUST 将该 Skill 移动或登记为 workspace Skill
- **AND** MUST 在 Project capability context 中保留 applicability

#### Scenario: workspace 与 Project Skill 等价
- **WHEN** legacy Project Skill 与 workspace Skill 的 identity/content 可证明等价
- **THEN** migration plan MUST 去重 Project 副本并创建逻辑引用
- **AND** MUST NOT 改变 workspace canonical Skill 内容

#### Scenario: workspace 与 Project Skill 同名不同内容
- **WHEN** legacy Project Skill 与 workspace Skill ID 相同但内容或来源不同
- **THEN** Buildr MUST 报告 `project_skill_name_conflict`
- **AND** migration apply MUST 零写入，直到用户选择重命名、canonical 版本或放弃迁移

#### Scenario: migration apply 失败
- **WHEN** migration 在 workspace manifest、Project context、源目录或最终 doctor 任一步失败
- **THEN** Buildr MUST 恢复事务前状态并保留 recovery evidence
- **AND** Buildr MUST NOT 删除 legacy Project Skill 源

## REMOVED Requirements

### Requirement: workspace/project Skills 源资产维护命令
**Reason**: Project 不是 Agent runtime 安装或隔离边界，双层 source authority 会产生重复与隐式覆盖。
**Migration**: 使用 Project Skill migration 将源统一到 workspace `skills/`；以后 `skills add/remove` 只维护 workspace authority。

### Requirement: workspace/project Skills 支持两种类型
**Reason**: 本地作者型与远端发布型仍保留，但不再分布在 workspace/Project 两种 source scope。
**Migration**: 使用新的 workspace-only Skill 类型契约，保留现有 path/source/resolved 信息。

### Requirement: Codex Skills runtime 投射
**Reason**: 原 Requirement 只描述项目根 `.agents/skills`，无法表达 user/workspace destination、有效 Skills inventory 和重复投射治理。
**Migration**: 使用统一 destination 和 adapter discovery requirements；Codex 继续将 workspace destination 投射到 `.agents/skills`。

### Requirement: Skills manifest schemaVersion
**Reason**: `buildr.skills/v2` 同时允许 workspace/Project source scope，无法表达 workspace-only asset identity 和 destination receipts。
**Migration**: workspace manifest 升级为 `buildr.skills/v3`；Project v1/v2 manifests 由显式 migration 处理，普通 sync 不静默删除。
