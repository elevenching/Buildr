## ADDED Requirements

### Requirement: Skills runtime 区分产品内置 Skill 与 workspace Skill
Buildr runtime projection MUST 区分产品内置 Agent Skills、workspace/root Skills 和 project Skills，并将它们都视为可重建 runtime 投射来源。

#### Scenario: 渲染产品内置 Skill
- **WHEN** 当前 Agent runtime 支持 Skills 且 Buildr package manifest 声明了适用的产品内置 Agent Skill
- **THEN** `buildr skills render <agent>` MUST 将该 Skill 渲染到目标 Agent runtime

#### Scenario: 保持 workspace Skill 解析
- **WHEN** workspace 或 project 定义了 Skills manifest
- **THEN** `buildr skills render <agent>` MUST 继续按现有 scope 规则解析并渲染 workspace/root/project Skills

#### Scenario: runtime 投射不是源资产
- **WHEN** Buildr 渲染产品内置 Agent Skill 到 `.claude/skills/` 或其他 Agent runtime 目录
- **THEN** 渲染结果 MUST 被视为 runtime 投射产物
- **AND** Agent MUST NOT 将渲染结果作为 Buildr 产品 Skill 或用户 workspace Skill 的源资产维护
