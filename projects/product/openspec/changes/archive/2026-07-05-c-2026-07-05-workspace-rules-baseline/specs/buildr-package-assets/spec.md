## MODIFIED Requirements

### Requirement: 随包资产使用 product/package manifest
Buildr MUST 使用 `product/package/manifest.yml` 声明产品随包资产和用户 workspace baseline。

#### Scenario: 默认规则源进入随包规则目录
- **WHEN** Buildr 维护默认 workspace/project 规则 baseline
- **THEN** 默认规则源 MUST 位于 `product/package/workspace-rules/`
- **AND** package manifest MUST 从 `product/package/workspace-rules/` 显式引用默认 workspace/project 规则源

### Requirement: 初始化从 manifest 映射生成
Buildr MUST 从 `product/package/manifest.yml` 声明的目录和文件映射生成默认 root baseline 和项目 baseline，并确保默认 workspace 规则和 README 具备可直接指导 Agent 工作的内容质量。

#### Scenario: 已有 root AGENTS 时保留组合入口
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **AND** `<dir>/AGENTS.md` 已经存在
- **THEN** Buildr MUST NOT 覆盖 `<dir>/AGENTS.md`
- **AND** Buildr MUST 将默认 workspace 规则写入 `<dir>/AGENTS.workspace.md`

#### Scenario: 新 workspace 仍生成 root AGENTS
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **AND** `<dir>/AGENTS.md` 不存在
- **THEN** Buildr MUST 将默认 workspace 规则写入 `<dir>/AGENTS.md`
