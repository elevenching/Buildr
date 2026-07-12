## MODIFIED Requirements

### Requirement: package manifest 声明产品内置 Agent Skills
Buildr package manifest MUST 显式声明产品随包内置 Agent Skills，并将其与 workspace baseline 文件映射分离。

#### Scenario: 声明 agentSkills
- **WHEN** Buildr 产品包包含内置 Agent Skill
- **THEN** `product/package/manifest.yml` MUST 通过专用字段声明 Skill id、源路径和适用 runtime

#### Scenario: agentSkills 不参与 init baseline
- **WHEN** Agent 执行 `buildr init`
- **THEN** manifest 中声明的产品内置 Agent Skills MUST NOT 被复制到目标 workspace `skills/` 目录
- **AND** Buildr MUST 继续只按 `workspaceDirectories` 和 `workspaceFiles` 生成 workspace baseline

#### Scenario: package check 校验内置 Agent Skills
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 manifest 声明的产品内置 Agent Skill 源路径存在
- **AND** Buildr MUST 校验该 Skill 不包含 forbidden patterns
- **AND** Buildr MUST 校验该 Skill 具备可渲染的 `SKILL.md`

#### Scenario: package check 校验 onboarding 同步契约
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 bootstrap guide 和 Buildr Skill 都满足 `product/package/bootstrap/onboarding.contract.yml`
- **AND** 同步契约 MUST 覆盖轻约束、命令地图、Agent runtime 分支和禁用入口
