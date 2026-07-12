## MODIFIED Requirements

### Requirement: Buildr Skill 前置说明 Skill 类型和安装方式
Buildr 内置 Skill 的 `SKILL.md` MUST 在资产维护细节前说明 workspace/project Skill 的类型、登记方式和 render 方式。

#### Scenario: 前置 Skill 类型
- **WHEN** Agent 阅读 Buildr Skill
- **THEN** Buildr Skill MUST 先说明本地作者型 Skill 和远端发布型 Skill 的区别
- **AND** Buildr Skill MUST 说明本地作者型 Skill 适合项目专用流程、私有沉淀和未发布 Skill
- **AND** Buildr Skill MUST 说明远端发布型 Skill 适合已发布或外部维护的 Skill

#### Scenario: 前置三种登记方式
- **WHEN** Agent 阅读 Buildr Skill
- **THEN** Buildr Skill MUST 说明本地源目录、远端信息源和已解析安装源三种登记方式
- **AND** Buildr Skill MUST 引导 Agent 先登记 source，再在能解析时升级为 resolved

#### Scenario: 前置三种 render 方式
- **WHEN** Agent 阅读 Buildr Skill
- **THEN** Buildr Skill MUST 说明 Buildr 本地安装、Buildr 远端安装和 Agent 自行安装三种 render 结果
