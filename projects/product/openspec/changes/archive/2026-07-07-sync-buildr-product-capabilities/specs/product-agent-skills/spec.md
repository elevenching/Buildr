## MODIFIED Requirements

### Requirement: 产品内置 Agent Skills
Buildr MUST 支持面向支持 runtime 的产品内置 Agent Skills，并将其作为向用户交付最新 Buildr 产品的一部分进行同步。

#### Scenario: 产品内置 Buildr Skill
- **WHEN** Buildr 产品包包含 Buildr 使用 Skill
- **THEN** 该 Skill MUST 由 package 的产品入口 Skill 声明管理
- **AND** `buildr update` MUST 能够为支持的 Agent runtime 安装或修复该 Skill
- **AND** 该 Skill MUST NOT 写入 workspace 的 `skills/manifest.yml`

#### Scenario: Buildr Skill 感知更新意图
- **WHEN** 用户要求 Agent “更新 Buildr”
- **THEN** 产品内置 Buildr Skill 的 description 和正文 MUST 能让 Agent 识别该意图
- **AND** Buildr Skill MUST 引导 Agent 先更新或检查 Buildr CLI，再重新安装产品内置 Buildr Skill，最后同步 Buildr 内置能力并 render 当前 Agent runtime

#### Scenario: Buildr Skill 与用户 Skills 保持区分
- **WHEN** Buildr 同步产品内置 Skills
- **THEN** Buildr MUST 将产品入口 Buildr Skill 与 `skills/buildr/*` 能力 Skills 区分开
- **AND** 用户 workspace/project Skill 维护 MUST 继续使用 `skills/manifest.yml` 和源目录，而不是编辑 runtime 目录

#### Scenario: 内置能力 Skills 默认 optional
- **WHEN** Buildr 提供 `skills/buildr/*` 能力 Skills
- **THEN** 这些 Skills MUST 默认为 optional
- **AND** 用户 MUST 能够卸载 optional 内置 Skill，卸载时删除源目录和 runtime 投射，并在 `skills/manifest.yml` 保留卸载状态

## ADDED Requirements

### Requirement: Codex Skills runtime 投射
Buildr MUST 支持将适用的 Buildr Skills 渲染到当前 Codex 打开项目根目录的 `.agents/skills`。

#### Scenario: 渲染 Skill 到 Codex
- **WHEN** Buildr 为 workspace 渲染 Codex runtime
- **THEN** Buildr MUST 将每个已启用且适用的 Skill 安装到当前 Codex 打开项目根目录的 `.agents/skills/<skill-id>/`
- **AND** 每个已安装 Skill MUST 包含有效的 `SKILL.md`

#### Scenario: Codex Skill 源结构
- **WHEN** Buildr 校验面向 Codex runtime 的 Skill
- **THEN** Buildr MUST 要求存在带必需 frontmatter 字段的 `SKILL.md`
- **AND** Buildr MAY 包含受支持的可选 `scripts/`、`references/`、`assets/` 和 `agents/openai.yaml` 文件

#### Scenario: Codex Skill 冲突
- **WHEN** Buildr 内置 Skill id 与用户 Skill id 在 Codex runtime 中冲突
- **THEN** Buildr MUST 报告该冲突
- **AND** Buildr MUST 要求用户或 Agent 先卸载内置 Skill 或重命名用户 Skill，再进行 render，不能静默选择其中一个
