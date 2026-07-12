## ADDED Requirements

### Requirement: Root Rules manifest CLI maintenance
Buildr CLI MUST 提供 root/Organization-level commands，用于维护 user-managed Rules manifest entries，且不得接管 Agent context decisions。

#### Scenario: Add existing root Rule
- **WHEN** Agent runs `buildr rules add <id> --target <dir> --description <text>` for an initialized Buildr workspace
- **THEN** Buildr MUST add or replace a root `rules/manifest.yml` entry only when the referenced Markdown file already exists and the id, path, source, description, enabled, required, and state metadata are valid
- **AND** Buildr MUST default the rule path to `rules/<id>.md` when `--path` is omitted
- **AND** Buildr MUST allow `--path <relative-md-path>` to register an existing relative Markdown file inside the workspace
- **AND** Buildr MUST require a non-empty description
- **AND** Buildr MUST NOT modify `AGENTS.md`正文 or Agent runtime files

#### Scenario: Add missing root Rule file
- **WHEN** Agent runs `buildr rules add <id>` with a path that does not exist
- **THEN** Buildr MUST fail without changing `rules/manifest.yml`
- **AND** Buildr MUST explain that `rules add` registers an existing root Rule file

#### Scenario: Remove root Rule asset
- **WHEN** Agent runs `buildr rules remove <id> --target <dir>` for a user-managed Rule
- **THEN** Buildr MUST remove the matching entry from root `rules/manifest.yml`
- **AND** Buildr MUST delete the referenced Rule source file by default
- **AND** Buildr MUST keep the Rule source file only when `--keep-file` is provided
- **AND** Buildr MUST NOT modify `AGENTS.md`正文 or Agent runtime files

#### Scenario: Keep root Rule file while unregistering
- **WHEN** Agent runs `buildr rules remove <id> --target <dir> --keep-file` for a user-managed Rule
- **THEN** Buildr MUST remove the matching entry from root `rules/manifest.yml`
- **AND** Buildr MUST keep the referenced Rule source file
- **AND** subsequent doctor MUST report the kept Markdown file as unregistered unless it is re-registered or removed

#### Scenario: Protect required Buildr Rule
- **WHEN** Agent runs `buildr rules remove <id>` for a Rule whose manifest entry has `source: buildr` and `required: true`
- **THEN** Buildr MUST fail without changing `rules/manifest.yml`
- **AND** Buildr MUST explain that required Buildr Rules cannot be removed through `rules remove`

#### Scenario: Project Rules manifest remains out of scope
- **WHEN** Agent attempts to use `rules add/remove` for `projects/<project>` scope
- **THEN** Buildr MUST reject the operation
- **AND** Buildr MUST explain that Project rules are currently maintained through `projects/<project>/AGENTS.md`

## MODIFIED Requirements

### Requirement: 默认 workspace 规则路由工具型资产维护
Buildr MUST 在默认 workspace 规则中要求 Agent 识别规则、技能、命令行工具相关任务，并通过 Buildr 技能维护源资产。

#### Scenario: Agent 读取默认规则
- **WHEN** Agent 读取 `buildr init` 生成的 workspace `AGENTS.md`
- **THEN** Agent MUST 能看到“Buildr 管理组织资产，不接管个人机器”的规则
- **AND** Agent MUST 能看到 Agent 运行环境、本机状态和临时提示都不是资产源

#### Scenario: 用户要求维护 manifest-backed 工具型资产
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的技能或命令行工具
- **THEN** 默认 workspace 规则 MUST 要求 Agent 先使用 Buildr 技能
- **AND** 默认 workspace 规则 MUST 要求 Agent 通过对应 manifest-backed CLI 维护 Buildr workspace 源资产
- **AND** 默认 workspace 规则 MUST 要求 runtime 投射或本机环境补齐按需在源资产维护后执行

#### Scenario: 用户要求维护规则资产
- **WHEN** 用户要求新增、修改或删除需要沉淀或复用的 root/Organization 规则
- **THEN** 默认 workspace 规则 MUST 要求 Agent 先使用 Buildr 技能
- **AND** 默认 workspace 规则 MUST 要求 Agent 使用 `rules add/remove` 维护 `rules/manifest.yml`
- **AND** 默认 workspace 规则 MUST 允许 Agent 直接编辑 `AGENTS.md` 或 `rules/*.md` 正文来维护规则内容
- **AND** 默认 workspace 规则 MUST 要求 Agent 将 runtime 投射或 doctor 复查放在源资产维护之后按需执行

#### Scenario: Agent 不确定如何维护资产
- **WHEN** Agent 不确定如何维护 Buildr 工具型资产
- **THEN** 默认 workspace 规则 MUST 引导 Agent 使用 Buildr 技能
- **AND** 当 Buildr 技能不可用时 MUST 引导 Agent 使用 `buildr bootstrap guide`

#### Scenario: runtime 或本机缺少能力
- **WHEN** 当前 Agent runtime 找不到所需技能，或本机找不到所需命令行工具
- **THEN** 默认 workspace 规则 MUST 引导 Agent 先使用 Buildr 技能
