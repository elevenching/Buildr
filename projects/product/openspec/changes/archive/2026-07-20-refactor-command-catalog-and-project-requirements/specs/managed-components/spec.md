## ADDED Requirements

### Requirement: Component 只拥有 workspace Command catalog collection
Buildr Component MUST 只把 workspace `commands/<collection>/manifest.yml` 作为 Command member，并 MUST NOT 拥有 Project requirements 或 machine state。

#### Scenario: Component 安装 Command collection
- **WHEN** Component definition 声明 Command collection member
- **THEN** Component MAY 物化 workspace catalog definitions
- **AND** MUST NOT 创建或修改任一 Project `commands.yml`
- **AND** MUST NOT 安装 binary、写入凭证或生成 machine observation source

#### Scenario: Component 卸载被引用 collection
- **WHEN** Component 卸载或更新将删除某个 Command 的最后一个有效 definition
- **AND** 任一 Project requirement 仍引用该 Command ID
- **THEN** Buildr MUST 在 source transaction 前阻止整个 Component mutation
- **AND** MUST 列出引用 Projects 和解除引用 nextActions

#### Scenario: Component definition 冲突
- **WHEN** Component definition 与用户或其他 Component catalog collection 使用同一 Command ID 但 identity 字段不同
- **THEN** Buildr MUST 报告 catalog ownership/identity conflict
- **AND** Project requirement MUST NOT 用于选择其中一个 definition
