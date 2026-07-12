## MODIFIED Requirements

### Requirement: 默认 scope 使用根相对表达
Buildr MUST 使用真实 workspace 相对路径作为 canonical scope 表达。

#### Scenario: workspace scope
- **WHEN** Agent 使用 `--scope .`
- **THEN** Buildr MUST 将 scope 解析为 workspace root

#### Scenario: Project scope
- **WHEN** Agent 运行 `buildr runtime check claude-code --scope projects/pig --target <root>`
- **THEN** Buildr MUST 将 scope 解析为真实目录 `<root>/projects/pig`
- **AND** Buildr MUST 解析根规则、Project 规则和相关 runtime 投射状态

#### Scenario: Service canonical scope
- **WHEN** Agent 使用 `--scope projects/pig/services/api`
- **THEN** Buildr MUST 将 scope 解析为真实目录 `<root>/projects/pig/services/api`
- **AND** Buildr MUST NOT 隐式插入第二个 `services/` 路径段

#### Scenario: Service 深层 scope
- **WHEN** Agent 使用 `--scope projects/pig/services/api/src/orders`
- **THEN** Buildr MUST 将整个输入作为 workspace 相对真实路径解析
- **AND** Buildr MUST reject absolute paths, workspace escape paths, and missing scope directories

#### Scenario: 旧 Service scope 无歧义兼容
- **WHEN** Agent 使用旧 scope `projects/pig/api`，`api` 是已登记 Service，真实输入位置不存在且 canonical Service 路径唯一
- **THEN** Buildr MUST 将其兼容解析为 `projects/pig/services/api`
- **AND** Buildr MUST 输出迁移 warning
- **AND** receipt、doctor next step、help 和 runtime metadata MUST 只输出 canonical scope

#### Scenario: 旧 Service scope 存在歧义
- **WHEN** 旧 Service scope 既可能表示真实 Project 子目录又可能表示已登记 Service
- **THEN** Buildr MUST reject the ambiguous scope
- **AND** Buildr MUST 提示用户使用真实 workspace 相对路径

### Requirement: 多层 AGENTS.md 规则资产投射
Buildr MUST treat `AGENTS.md` files at every supported directory level as rule source assets and expose the selected scope's ancestor chain plus recursively discovered subtree through supported Agent runtime adapters.

#### Scenario: Project scope 递归发现
- **WHEN** Buildr renders rules for scope `projects/pig`
- **THEN** Buildr MUST discover applicable `AGENTS.md` from workspace root through `projects/pig`
- **AND** Buildr MUST recursively discover `AGENTS.md` under the `projects/pig` subtree
- **AND** Buildr MUST order broader sources before more specific sources

#### Scenario: Service scope 隔离
- **WHEN** Buildr renders rules for scope `projects/pig/services/api`
- **THEN** Buildr MUST include applicable Root、Project and API Service ancestor rules
- **AND** Buildr MUST recursively include deeper `AGENTS.md` under the API Service
- **AND** Buildr MUST NOT include sibling Service subtree rules

#### Scenario: Claude Code recursive rule bridges
- **WHEN** recursive discovery returns multiple `AGENTS.md` files for Claude Code
- **THEN** Buildr MUST project a Claude Code rule bridge beside every discovered source file
- **AND** each bridge MUST reference the `AGENTS.md` in the same directory

#### Scenario: Codex native recursive rules
- **WHEN** Buildr syncs or checks Codex runtime for a canonical scope
- **THEN** Buildr MUST rely on Codex native `AGENTS.md` behavior for rule loading
- **AND** Buildr runtime check MUST verify every applicable and recursively discovered `AGENTS.md` source without writing bridge files

#### Scenario: 递归扫描安全边界
- **WHEN** Buildr recursively discovers rule sources
- **THEN** Buildr MUST NOT follow directory symlinks or enter VCS metadata、Agent runtime、dependency or build-output directories
- **AND** Buildr MUST traverse a nested Git repo only when it is a Buildr-managed Project or Service asset root
- **AND** Buildr MUST treat unregistered nested Git repos as opaque boundaries
