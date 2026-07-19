## ADDED Requirements

### Requirement: Skill 可移植核心与 adapter 可选扩展分层
Buildr MUST 将 Skill 的可移植核心合法性与 Agent runtime adapter 的可选 vendor 扩展分别校验，且 MUST NOT 使用单一厂商扩展定义所有 builtin Skill 的通用合法性或发布资格。

#### Scenario: 校验 Skill 可移植核心
- **WHEN** Buildr 对本地、package 或 builtin Skill 执行通用源结构校验
- **THEN** Buildr MUST 要求存在有效的 `SKILL.md`
- **AND** `agents/`、`assets/`、`templates/`、`scripts/`、`references/`、`examples/` 和其他随附文件 MUST 是可选核心资源
- **AND** 缺少 `agents/openai.yaml` MUST NOT 单独使该 Skill 的通用源结构非法

#### Scenario: 校验已提供的 adapter 扩展
- **WHEN** Skill 包含目标 supported runtime adapter descriptor 声明的可选 vendor extension
- **THEN** Buildr MUST 应用该 adapter 声明的 extension validator
- **AND** 失败 MUST 归因到具体 adapter、Skill 和 vendor resource，而不是通用 builtin 合法性

#### Scenario: Skill 未提供 OpenAI metadata
- **WHEN** 面向 Codex 发布的 Skill 包含有效 `SKILL.md` 但没有 `agents/openai.yaml`
- **THEN** Buildr MUST 允许该 Skill 正常发布、投射和发现
- **AND** Buildr MUST NOT 在 render 时生成或反写该 vendor 文件

### Requirement: Skill 执行资源相对于当前 SKILL.md 解析
Buildr builtin Skill MUST 使用相对于当前 runtime `SKILL.md` 所在目录的路径定位执行所需的模板、脚本、references、examples 或其他可移植随附资源，且核心行为 MUST NOT 依赖 vendor metadata 才能执行。

#### Scenario: Skill 使用随附模板
- **WHEN** runtime Skill 正文要求 Agent 从 `assets/` 或 `templates/` 复制模板
- **THEN** Agent MUST 从当前 `SKILL.md` 所在目录解析该相对路径
- **AND** Skill MUST NOT 依赖源 workspace 路径或 `agents/openai.yaml` 定位该模板
