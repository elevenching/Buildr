## ADDED Requirements

### Requirement: 移除 legacy organizations 入口
Buildr MUST NOT 将 `organizations/<org>/` 作为产品主线、兼容路径或默认 scope 解析入口。

#### Scenario: 拒绝 legacy project ref
- **WHEN** Agent 调用 `buildr project create acme/pig`
- **THEN** Buildr MUST 报告该 ref 不受支持，并提示使用 `buildr project create pig`

#### Scenario: 拒绝 legacy service ref
- **WHEN** Agent 调用 `buildr service create acme/pig/freshx <repo-ref>`
- **THEN** Buildr MUST 报告该 ref 不受支持，并提示使用 `buildr service create pig/freshx <repo-ref>`

#### Scenario: 拒绝 legacy scope
- **WHEN** Agent 调用 `buildr doctor --scope organizations/acme/projects/pig --json`
- **THEN** Buildr MUST 报告该 scope 不受支持，并提示使用 `projects/pig`

## MODIFIED Requirements

### Requirement: 初始化创建可直接工作的根资产
`buildr init` MUST 创建可直接作为 Organization 上下文维护的根资产，而不是只创建空容器。

#### Scenario: 初始化根资产
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST 在 `<dir>` 下创建根 `AGENTS.md`、`README.md`、`.buildr/workspace.yml`、`rules/`、`practices/`、`skills/`、`shared/` 和 `projects/` 的基础骨架
- **AND** `rules/` MUST 包含默认任务分流、OpenSpec 工作流、runtime 投射、worktree 和 Git 规则

#### Scenario: 默认不生成资产手册
- **WHEN** Agent 执行 `buildr init --target <dir> --name <name>`
- **THEN** Buildr MUST NOT 默认创建 `ASSETS.md`

#### Scenario: 初始化元数据
- **WHEN** Buildr 创建 `.buildr/workspace.yml`
- **THEN** 该文件 MUST 记录 schema version、上下文 kind、实例 name 和 profile

## REMOVED Requirements

### Requirement: 旧 organizations 布局可诊断
**Reason**: Buildr 早期产品已经收敛为 root-as-Organization。继续诊断并兼容 `organizations/<org>/` 会让 CLI、scope、doctor 和文档长期维护两套模型，削弱产品主线。

**Migration**: 旧 `organizations/<org>/` 目录不作为产品兼容路径处理。已有资产应通过一次性人工迁移或独立迁移脚本转为 root-as-Organization 布局。
