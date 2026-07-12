## MODIFIED Requirements

### Requirement: 随包资产使用 package manifest
Buildr MUST 使用产品 root 下的 `package/manifest.yml` 声明产品随包资产、交付 target 和用户 workspace baseline。

#### Scenario: 随包资产边界
- **WHEN** Buildr 发布产品包或校验 package baseline
- **THEN** 发布包和 baseline MUST 只包含产品 root 内 `package/manifest.yml` 显式声明或引用的资产和 CLI 运行所需文件

#### Scenario: 开发资产引用随包资产
- **WHEN** Buildr 产品开发需要验证初始化或 runtime baseline
- **THEN** package manifest MAY 引用产品 root 下的 `package/` 随包资产源

#### Scenario: 默认 workspace baseline 源进入 workspace target
- **WHEN** Buildr 维护默认 workspace baseline
- **THEN** 默认 workspace 规则、workspace metadata、Git ignore 模板、命令行工具清单入口和 workspace Skills 源 MUST 位于产品 root 下的 `package/targets/workspace/`
- **AND** package manifest MUST 从 `package/targets/workspace/` 显式引用默认 workspace baseline 源

#### Scenario: 默认 Project 模板源归属 workspace projects 容器
- **WHEN** Buildr 维护默认 Project baseline 文件
- **THEN** 默认 Project 模板源 MUST 位于产品 root 下的 `package/targets/workspace/projects/`
- **AND** package manifest MUST 从 `package/targets/workspace/projects/` 显式引用默认 Project baseline 文件

#### Scenario: 随包资产不得引用开发 overlay
- **WHEN** Buildr 校验 `package/manifest.yml`
- **THEN** package baseline MUST NOT 引用产品仓根特有规则、私有业务项目、私有组织名或私有路径

#### Scenario: 通用根规则进入 workspace target 规则源
- **WHEN** Buildr 维护默认 root 工作规则
- **THEN** 通用规则 MUST 以产品 root 下 `package/targets/workspace/rules/` 中可独立维护的规则文件作为源
- **AND** package manifest MUST 显式引用允许发布的规则文件，不得默认发布整个 `rules/` 目录

### Requirement: package manifest 声明产品内置 Agent Skills
Buildr package manifest MUST 显式声明产品随包内置 Agent Skills，并将其与 workspace target 文件映射分离。

#### Scenario: 声明 agentSkills
- **WHEN** Buildr 产品包包含内置 Agent Skill
- **THEN** `package/manifest.yml` MUST 通过专用字段声明 Skill id、源路径和适用 runtime
- **AND** 产品入口 Buildr Skill 源路径 MUST 位于 `package/targets/runtime/skills/<skill-id>/`

#### Scenario: agentSkills 不参与 init baseline
- **WHEN** Agent 执行 `buildr init`
- **THEN** manifest 中声明的产品内置 Agent Skills MUST NOT 被复制到目标 workspace `skills/` 目录
- **AND** Buildr MUST 继续只按 `workspaceDirectories` 和 `workspaceFiles` 生成 workspace baseline

#### Scenario: package check 校验内置 Agent Skills
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 manifest 声明的产品内置 Agent Skill 源路径存在
- **AND** Buildr MUST 校验该 Skill 不包含 forbidden patterns
- **AND** Buildr MUST 校验该 Skill 具备可渲染的 `SKILL.md`

#### Scenario: package check 校验 bootstrap 入口契约
- **WHEN** Agent 执行 `buildr package check`
- **THEN** Buildr MUST 校验 bootstrap guide 和 Buildr Skill 满足 `package/bootstrap/contract.yml`
- **AND** bootstrap 契约 MUST 分别约束 guide 的恢复入口、Buildr Skill 的必要章节、生成后 runtime Skill 的 adapter 内容和禁用入口
- **AND** bootstrap 契约 MUST NOT 要求 bootstrap guide 覆盖 Buildr Skill 的完整资产维护细节

## ADDED Requirements

### Requirement: Package 顶层职责必须分离
Buildr package MUST 将维护说明、机器映射、恢复入口和交付 target 表达为不同职责。

#### Scenario: Package 维护说明与机器契约
- **WHEN** 维护者查看 `package/` 顶层
- **THEN** `package/README.md` MUST 只说明 package 的维护用途
- **AND** `package/manifest.yml` MUST 是发布边界和 source-to-target 映射的机器契约

#### Scenario: Bootstrap 恢复入口
- **WHEN** Buildr Skill 不可用且 Agent 运行 `buildr bootstrap guide`
- **THEN** Buildr MUST 从 `package/bootstrap/guide.md` 输出恢复指南
- **AND** bootstrap 资产 MUST NOT 被当作 workspace target 或 runtime target 物化

#### Scenario: Target 目录只表达交付目的地
- **WHEN** Buildr 维护 `package/targets/`
- **THEN** `package/targets/workspace/` MUST 只保存面向 workspace 的交付源
- **AND** `package/targets/runtime/` MUST 只保存直接面向 Agent runtime 的交付源

#### Scenario: 旧 package 源路径被拒绝
- **WHEN** Buildr 校验新版本 package manifest 和活动产品引用
- **THEN** Buildr MUST NOT 接受 `package/workspace/` 或 `package/agent-skills/` 作为 canonical 源路径
- **AND** 新版本 npm package MUST NOT 同时发布旧路径兼容副本
