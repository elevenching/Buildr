## MODIFIED Requirements

### Requirement: doctor 检查 workspace 和层级状态
Buildr MVP MUST 诊断 workspace、Organization、Project 和 Service 的基础状态。

#### Scenario: workspace 未初始化
- **WHEN** 当前目录不是有效 Buildr workspace
- **THEN** `doctor` MUST 报告 workspace 未初始化并提供初始化建议

#### Scenario: 项目资产缺失
- **WHEN** Organization 或 Project 资产目录缺失
- **THEN** `doctor` MUST 报告缺失层级和建议的创建动作

#### Scenario: root shared 不作为默认层级
- **WHEN** `doctor` 在 Buildr root 发现 `shared/`
- **THEN** `doctor` MUST 报告该目录不是默认 service 入口，并建议迁移到某个 Project

### Requirement: doctor 检查 service metadata 和 repo 状态
Buildr MVP MUST 诊断项目级 service metadata 与本地 service repo 的一致性。

#### Scenario: metadata 声明的 repo 缺失
- **WHEN** project service metadata 声明某个 Git repo 但本地路径不存在
- **THEN** `doctor --json` MUST 报告该 service repo 缺失，并给出可供 Agent 引导 clone 的建议

#### Scenario: repo remote 不匹配
- **WHEN** 本地 service repo 的 remote 与 metadata 记录不一致
- **THEN** `doctor --json` MUST 报告不一致状态和修复建议

#### Scenario: 外部本地路径不可访问
- **WHEN** project service metadata 记录的外部本地路径不可访问
- **THEN** `doctor --json` MUST 报告路径不可访问并提示用户确认新路径
