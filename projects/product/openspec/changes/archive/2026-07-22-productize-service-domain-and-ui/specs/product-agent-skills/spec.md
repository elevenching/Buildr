## ADDED Requirements

### Requirement: Buildr Skill 必须引导 Agent 使用 Service Domain
产品入口 Buildr Skill MUST 解释 Service 字段、父实体关联、source、显式迁移和 Git 声明/观察边界。

#### Scenario: Agent 创建 Service
- **WHEN** 用户要求接入本地目录或 Git Service
- **THEN** Skill MUST 引导 Agent 核对 Project、Domain 字段、物化路径和 Git identity 后调用 canonical service create

#### Scenario: Agent 看到 branch drift
- **WHEN** doctor 或 UI 报告 current branch 偏离 integration branch
- **THEN** Skill MUST 引导 Agent 结合当前任务判断，而不是让 Buildr 自动切换分支
