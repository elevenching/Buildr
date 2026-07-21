## MODIFIED Requirements

### Requirement: doctor 聚合命令行工具清单状态
Buildr doctor MUST 区分 Command catalog、Project requirements 和 machine observation，并 MUST 根据明确 scope 决定当前 readiness。

#### Scenario: root doctor 校验 Commands source
- **WHEN** Agent 在 workspace root 运行 doctor
- **THEN** doctor MUST 校验全部 catalog definitions、Project requirement schemas 和 references
- **AND** machine readiness MUST 只检查 workspace default requirements
- **AND** MUST NOT 因无关 Project binary 缺失而产生 root task warning

#### Scenario: Project doctor 检查有效 requirements
- **WHEN** Agent 使用 Project scope 运行 doctor
- **THEN** doctor MUST 解析该 Project requirements 和 workspace defaults
- **AND** MUST 输出 definition provenance、requirement provenance、合并约束和 machine observation

#### Scenario: Commands source 或 context 无效
- **WHEN** catalog definition 冲突、Project 引用缺失或跨 Project约束不兼容
- **THEN** doctor MUST 报告 error 和稳定 reason code
- **AND** repair plan MUST 指向对应 workspace catalog 或 Project requirement source

#### Scenario: Machine environment 不满足要求
- **WHEN** binary 缺失、版本不满足或版本不可解析
- **THEN** doctor MUST 报告 warning
- **AND** repair plan MAY 展示 catalog install hint
- **AND** MUST NOT 将该 warning 描述为 Buildr 源资产冲突

#### Scenario: 未配置 Commands
- **WHEN** workspace catalog、workspace defaults 和当前 Project requirements 均为空
- **THEN** doctor MUST 将 Commands 状态视为健康空集
- **AND** MUST NOT 报告缺失、warning 或 error
