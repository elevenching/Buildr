# project-registry Specification

## Purpose
定义 root Project registry 的结构、Project 创建与修复、Git 边界，以及从 `projects/` 目录事实收敛 registry 状态的行为。
## Requirements
### Requirement: root project registry
Buildr MUST 维护 root `projects/manifest.yml` registry，声明由 workspace 管理的 Projects。

#### Scenario: 初始化空 registry
- **WHEN** Agent executes `buildr init --target <root>`
- **THEN** Buildr MUST create `<root>/projects/manifest.yml` with schema version and an empty Project registry
- **AND** Buildr MUST create `<root>/projects/` even when no Project exists

#### Scenario: registry 记录 Project path
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** the registry MUST record its materialized path as `projects/<project>`
- **AND** the registry MUST NOT use an absolute path as the Project path

#### Scenario: registry 记录 Project title
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** the registry MUST record a human-readable `title` for the Project
- **AND** if no title is provided, Buildr MUST use `<project>` as the default title

#### Scenario: registry 记录 Project description
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** the registry MUST record a `description` for a concise human-readable Project summary
- **AND** the description MUST NOT be treated as the authoritative location for Project business facts
- **AND** if no description is available, Buildr update or sync MAY write a TODO description and doctor MUST report a warning

#### Scenario: registry 使用封闭 schema
- **WHEN** Buildr records Project metadata in `projects/manifest.yml`
- **THEN** the registry MUST limit Project data to the schema fields defined by Buildr
- **AND** Project rules, memory, business facts, OpenSpec, Skills and service metadata MUST remain in `projects/<project>/`
- **AND** Buildr update or sync MUST remove unknown Project registry fields

### Requirement: project create maintains registry
Buildr 在创建或修复 Project asset root 时 MUST 更新 `projects/manifest.yml`。

#### Scenario: 创建 workspace-managed Project
- **WHEN** Agent executes `buildr project create <project> --target <root>` without a repo URL
- **THEN** Buildr MUST create or repair `<root>/projects/<project>/` using the Project baseline
- **AND** Buildr MUST record the Project in `<root>/projects/manifest.yml` with `repo.kind` set to `workspace`
- **AND** Buildr MUST record a Project title, description and path

#### Scenario: 创建 Git-managed Project
- **WHEN** Agent executes `buildr project create <project> --repo <git-url> --target <root>`
- **THEN** Buildr MUST materialize the Project asset repo at `<root>/projects/<project>/`
- **AND** Buildr MUST record the Git URL, remote, default branch and path in `<root>/projects/manifest.yml`
- **AND** Buildr MUST repair missing Project baseline assets without overwriting existing Project files

#### Scenario: 创建 Project 时提供说明
- **WHEN** Agent executes `buildr project create <project> --title <title> --description <description> --target <root>`
- **THEN** Buildr MUST record the provided title and description in `<root>/projects/manifest.yml`
- **AND** Buildr MUST NOT write the description into Project OpenSpec specs or knowledge as an authoritative project fact

#### Scenario: 不支持外部 Project 链接
- **WHEN** Agent executes `buildr project create <project> --repo <local-path>`
- **THEN** Buildr MUST reject the command
- **AND** Buildr MUST explain that Project assets must be materialized under `projects/<project>/`

#### Scenario: 既有目录由 project create 补登记
- **WHEN** Agent executes `buildr project create <project> --target <root>` and `<root>/projects/<project>/` already exists
- **THEN** Buildr MUST repair missing Project baseline assets and update `projects/manifest.yml`
- **AND** Buildr MUST NOT require a separate `project register` command
- **AND** Buildr MUST NOT overwrite existing Project files

### Requirement: Project repo boundaries
Buildr MUST 在 root workspace repo 与独立 Project asset repos 之间保持清晰的 Git ownership boundaries。

#### Scenario: workspace-managed Project follows root Git
- **WHEN** a Project registry entry has `repo.kind: workspace`
- **THEN** Buildr MUST treat `projects/<project>/` as root workspace assets
- **AND** Buildr MUST NOT add `projects/<project>/` to root `.gitignore`

#### Scenario: Git-managed Project is ignored by root Git
- **WHEN** a Project registry entry has `repo.kind: git`
- **THEN** Buildr MUST ensure root `.gitignore` ignores `projects/<project>/`
- **AND** Buildr MUST NOT require the root Git repo to store the nested Project repo contents

### Requirement: Project registry remains separate from service metadata
Buildr MUST 将 Project registry metadata 与 service repo metadata 保存在独立 manifest files 中。

#### Scenario: Project registry 不记录 services
- **WHEN** Buildr records Project `<project>` in `projects/manifest.yml`
- **THEN** `projects/manifest.yml` MUST NOT record that Project's service repo list
- **AND** service repo metadata MUST remain in `projects/<project>/services/manifest.yml`

#### Scenario: service create 不改变 Project repo kind
- **WHEN** Agent executes `buildr service create <project>/<service> <repo-ref> --target <root>`
- **THEN** Buildr MUST update `projects/<project>/services/manifest.yml`
- **AND** Buildr MUST NOT change the Project registry entry's `repo.kind`

### Requirement: MVP Project registry convergence
Buildr MUST 从 `projects/` directory 收敛 Project registry state，且 MUST NOT 将 root `projects.yml` 视为 long-term source。

#### Scenario: 清理旧 projects.yml
- **WHEN** an existing workspace has `<root>/projects.yml`
- **THEN** Buildr update or sync MUST remove `<root>/projects.yml`
- **AND** Buildr MUST NOT read it as a migration source

#### Scenario: 从 Project 目录补登记
- **WHEN** `<root>/projects/<project>/` is a valid Project directory but `projects/manifest.yml` does not declare `<project>`
- **THEN** Buildr update or sync MUST add a minimal Project registry entry
- **AND** Buildr MUST infer `repo.kind` from whether `<root>/projects/<project>/.git/` exists

#### Scenario: Project registry drift
- **WHEN** `projects/manifest.yml` contains unknown fields, invalid paths, missing required fields or TODO descriptions
- **THEN** Buildr doctor MUST report a warning
- **AND** Buildr update or sync MUST repair low-risk defaults and remove unknown fields

### Requirement: Project create 验证既有 repo identity
Buildr MUST 在修复既有 Project baseline 或 registry 前验证 materialized Project 的实际 repo identity 与命令和 registry 一致。

#### Scenario: 相同 Git 来源幂等修复
- **WHEN** `project create --repo <git-url>` 的目标已是 Git repo，且实际 remote、命令 URL 和既有 registry identity 一致
- **THEN** Buildr MUST 允许修复缺失 baseline 和 registry 低风险字段
- **AND** Buildr MUST NOT 覆盖既有 Project 文件

#### Scenario: 既有 Project 来源冲突
- **WHEN** 目标 repo remote、命令 URL、registry repo kind 或 registry URL 互相不一致
- **THEN** Buildr MUST 在任何 Project、registry 或 `.gitignore` 写入前失败
- **AND** Buildr MUST NOT 静默 relink、replace 或改写 repo identity

#### Scenario: 新 Git Project clone 失败
- **WHEN** 新 Project Git clone 或后续 baseline preflight 失败
- **THEN** Buildr MUST NOT 留下半完成 Project 目录或 registry entry

### Requirement: Project 只引用 workspace 能力资产
Buildr MUST 允许 Project 声明对 workspace Skill 和 capability 的逻辑引用，并 MUST NOT 将这些引用解释为 Skill 安装、发现或访问隔离范围。

#### Scenario: Project 声明 capability requirement
- **WHEN** Project 声明一个 required 或 optional capability
- **THEN** Buildr MUST 将该声明解析到 workspace `skills/manifest.yml` 中的 contract 和 providers
- **AND** Project MUST NOT 内嵌或复制 provider Skill 内容

#### Scenario: Project 声明 Skill applicability
- **WHEN** Project 将一个 workspace Skill 标记为适用于自身业务任务
- **THEN** Buildr MUST 将该信息用于 Agent 路由提示和 doctor readiness 检查
- **AND** Buildr MUST NOT 将 applicability 描述为 Agent runtime 可见性限制

#### Scenario: Project 引用不存在的 workspace Skill
- **WHEN** Project 引用的 Skill ID 或 capability identity 无法从 workspace registry 解析
- **THEN** doctor MUST 报告 error、Project、缺失 identity 和可执行 nextActions
- **AND** Buildr MUST NOT 从 Project 目录猜测或生成 Skill 源

### Requirement: Project capability context 保持跨 Project 确定性
Buildr MUST 使用明确的 Project task context 解析 Project binding，并 MUST 在跨 Project 绑定不一致时 fail closed。

#### Scenario: 单 Project task 使用 Project binding
- **WHEN** 当前任务明确属于一个 Project 且该 Project 为 capability 声明 binding
- **THEN** Buildr MUST 使用该 binding 选择 workspace provider
- **AND** 该选择 MUST NOT 改变 provider 的 runtime 可见范围

#### Scenario: 跨 Project binding 冲突
- **WHEN** 当前任务涉及多个 Project 且它们为同一 capability 选择不同 providers
- **THEN** Buildr MUST 报告 `cross_project_binding_ambiguous`
- **AND** Agent MUST 拆分 Project 动作或取得明确选择，不得依据当前目录或 Project 顺序猜测

### Requirement: Project registry 识别 Command requirement context
Buildr MUST 将已登记 Project 的 `commands.yml` 识别为 Project context asset，并 MUST 验证其与 workspace Command catalog 的引用完整性。

#### Scenario: Project create 生成 Command context
- **WHEN** Buildr 成功创建一个 Project
- **THEN** Project baseline MUST 包含 `commands.yml`
- **AND** Project registry 与 doctor MUST 将其报告为已初始化 Project asset

#### Scenario: Project requirement 不影响 repo ownership
- **WHEN** Project 使用 workspace repo 或独立 asset repo
- **THEN** `commands.yml` MUST 跟随 Project asset ownership
- **AND** workspace Command catalog MUST 继续跟随 workspace root ownership

#### Scenario: 未登记目录不参与 requirements
- **WHEN** `projects/` 下存在未登记目录及其 `commands.yml`
- **THEN** Buildr MUST NOT 将其 requirements 纳入有效 task context
- **AND** doctor MAY 报告未登记目录，但 MUST 避免派生 machine readiness 噪音

### Requirement: Project registry 识别可选测试能力声明
Buildr MUST 将已登记 Project 的 `verification.yml` 识别为 Project context asset，并 MUST 保持该资产可选、跟随 Project ownership 且独立于 Skill capability context。

#### Scenario: Project 没有测试声明
- **WHEN** Buildr 创建 Project 或诊断没有 `verification.yml` 的既有 Project
- **THEN** Project MUST 保持有效且默认 baseline MUST NOT 强制生成空声明
- **AND** Buildr MUST NOT 因缺失声明改变 `capabilities.yml`、`commands.yml` 或 Service registry

#### Scenario: Project 初始化测试声明
- **WHEN** Agent 经用户意图在已登记 Project 中创建 `verification.yml`
- **THEN** 声明 MUST 跟随该 Project 的实际 asset repo ownership
- **AND** workspace runtime render MUST NOT 把声明复制为 Skill source 或 Service repo 文件

#### Scenario: 未登记目录包含测试声明
- **WHEN** `projects/` 下未登记目录包含 `verification.yml`
- **THEN** Buildr MUST NOT 将其能力纳入有效 Project task context
- **AND** doctor MAY 报告未登记目录，但 MUST NOT 执行声明中的测试命令
