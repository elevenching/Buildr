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

#### Scenario: Rules 语义索引读取
- **WHEN** Agent 进入 Buildr workspace scope
- **THEN** Agent MUST 先读取 scope `AGENTS.md` 和 `rules/buildr/core.md`
- **AND** Agent MUST 再读取 `rules/manifest.yml`
- **AND** Agent MUST 根据用户目标、修改范围、代码语义、workspace context 和 Rule `description` 判断 enabled user Rules 是否与当前任务相关
- **AND** Agent MUST NOT require `rules/manifest.yml` to contain structured role, path, service, or directory routing tables

#### Scenario: Rule 和 Skill 加载语义
- **WHEN** Buildr exposes Rules and Skills to an Agent runtime
- **THEN** Buildr MUST distinguish Rules and Skills by asset semantics rather than by whether they are always loaded
- **AND** Buildr MUST treat Rules as values, boundaries, and constraints
- **AND** Buildr MUST treat Skills as reusable professional actions and procedures
