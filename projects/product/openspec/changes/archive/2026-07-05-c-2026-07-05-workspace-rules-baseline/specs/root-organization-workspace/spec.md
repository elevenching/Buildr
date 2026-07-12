## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST 创建可直接作为 Organization 上下文维护的根资产，而不是只创建空容器或低信息量占位文档。

#### Scenario: 初始化已有组合入口的 workspace
- **WHEN** Agent 在已有 root `AGENTS.md` 的目录执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 保留既有 `AGENTS.md`
- **AND** Buildr MUST 创建 `AGENTS.workspace.md` 承载默认 workspace 规则
