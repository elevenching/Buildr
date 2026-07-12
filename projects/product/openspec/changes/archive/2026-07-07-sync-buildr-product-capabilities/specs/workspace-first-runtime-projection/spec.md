## MODIFIED Requirements

### Requirement: Runtime 投射按 Agent 能力选择
Buildr MUST 将支持的 Agent runtime 视为从 Buildr 源资产和已启用内置能力生成的 adapter 投射。

#### Scenario: Codex runtime 投射
- **WHEN** Buildr 渲染 Codex adapter
- **THEN** Buildr MUST 保持 scope `AGENTS.md` 作为 Codex 原生规则入口
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到当前 Codex 打开项目根目录的 `.agents/skills/`
- **AND** Buildr MUST 将 `.agents/skills/` 视为 runtime 投射产物，而不是长期 Buildr 源资产

#### Scenario: Claude Code runtime 投射
- **WHEN** Buildr 渲染 Claude Code adapter
- **THEN** Buildr MUST 写入或更新 `CLAUDE.md`，并用 Claude Code runtime 格式桥接 scope `AGENTS.md`
- **AND** Buildr MUST 将适用的已渲染 Skills 安装到 `.claude/skills/`
- **AND** Buildr MUST 将 `CLAUDE.md` 和 `.claude/skills/` 视为 runtime 投射产物，而不是长期 Buildr 源资产

#### Scenario: 支持的 adapters
- **WHEN** Buildr 在本变更中 sync 或 render Agent runtime
- **THEN** Buildr MUST 支持 `codex` 和 `claude-code`
- **AND** Buildr MUST 清楚报告不支持的 adapter，且不得修改 runtime 文件

#### Scenario: Runtime 准备顺序
- **WHEN** Buildr 渲染 Agent runtime
- **THEN** Buildr MUST 按 `rules/manifest.yml` 暴露和检查 enabled rules
- **AND** Buildr MUST 按 `skills/manifest.yml` 投射 enabled skills
- **AND** Buildr 内置项 MUST 在 manifest 中排在用户项之前
- **AND** 在处理 project scope 时，Buildr MUST 在 workspace 资产之后处理 project 用户资产
- **AND** 更具体的源资产 MUST 在 Agent 可读入口中更靠后出现

#### Scenario: Rules 渐进式读取
- **WHEN** Agent 进入 Buildr workspace scope
- **THEN** Agent MUST 先读取 scope `AGENTS.md` 和 `rules/buildr/core.md`
- **AND** Agent MUST 再读取 `rules/manifest.yml`
- **AND** Agent MUST 根据 Rule `description` 判断 optional enabled rules 是否适用于当前任务

## ADDED Requirements

### Requirement: AGENTS.md 是 scope 规则入口
Buildr MUST 将 `AGENTS.md` 定义为 Buildr scope 规则入口，同时允许支持它的 Agent 原生消费。

#### Scenario: 根 AGENTS required block
- **WHEN** Buildr 初始化或更新 workspace root
- **THEN** 根 `AGENTS.md` MUST 包含 Buildr required block
- **AND** required block MUST 引用 `rules/buildr/core.md`

#### Scenario: Adapter 格式转换
- **WHEN** 某个 Agent 需要特殊 include 格式
- **THEN** 对应 adapter MUST 在 runtime render 阶段转换
- **AND** Buildr 源资产 MUST NOT 把 Claude Code 的 `@` 当作通用语义
