## MODIFIED Requirements

### Requirement: Runtime render asset scope
Buildr runtime render MUST 限定为由 Buildr 源资产派生出的 Agent runtime 入口资产。

#### Scenario: Supported runtime render
- **WHEN** Buildr render 或 sync 某个 supported Agent runtime
- **THEN** Buildr MUST 只 render 该 Agent runtime 使用 Buildr workspace rules 和 Skills 所必需的资产
- **AND** Buildr MUST 将 Commands、Project registry、Service registry、OpenSpec content、knowledge 和 docs 保持为 Buildr 源资产，而不是默认复制到 runtime 目录
- **AND** Buildr MUST NOT 将 Practices 表示为受管 source asset 或 runtime asset

#### Scenario: Product Buildr Skill boundary
- **WHEN** Buildr 为 supported Agent runtime 安装产品入口 Buildr Skill
- **THEN** Buildr MUST 使用 `buildr skill install <agent>`
- **AND** Buildr MUST NOT 将产品入口 Buildr Skill 登记到 workspace 或 Project `skills/manifest.yml`
