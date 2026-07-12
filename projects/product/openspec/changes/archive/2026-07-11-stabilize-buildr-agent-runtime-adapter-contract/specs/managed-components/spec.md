## ADDED Requirements

### Requirement: Component 不构成 runtime adapter 扩展机制
Buildr MUST 将 Component 限定为 workspace 源资产和自然语言 Skill Contribution 的生命周期边界，不得允许 Component 注册、替换、注入或执行 Agent runtime adapter。

#### Scenario: Component 声明 adapter 扩展
- **WHEN** Component definition 声明 adapter、adapter module、runtime hook、executable member 或 runtime registry patch
- **THEN** Component/package check MUST fail closed
- **AND** Buildr MUST NOT 注册、加载或执行该声明
- **AND** Buildr MUST NOT 因该 Component 改变 supported runtime adapter list

#### Scenario: Component runtime reconcile
- **WHEN** enabled installed Component 的源成员变化需要投射到 Agent runtime
- **THEN** Buildr MUST 先通过通用 Component 校验解析其受管源资产和 Skill Contributions
- **AND** Buildr MUST 将验证后的源输入交给静态 registered adapter 和通用 runtime reconcile 管线
- **AND** Component MUST NOT 提供 adapter-specific apply 逻辑

### Requirement: Component 必须验证自身完整性后参与 runtime 投射
Buildr MUST 在 Component 安装、更新、卸载、check、doctor 和 runtime source assembly 中验证 Component definition、成员和贡献声明的完整性，并禁止未通过验证的 Component 内容进入 runtime plan。

#### Scenario: Component 完整性有效
- **WHEN** Component definition schema、identity、source、version、成员枚举、成员路径、成员 integrity、ownership、manifest 对齐和 Contribution 引用全部有效
- **THEN** Buildr MUST 将该 Component 报告为完整
- **AND** enabled installed Component 的有效 Contributions MAY 进入 runtime source assembly

#### Scenario: Component 成员 integrity 不匹配
- **WHEN** workspace 中的 Component member 内容不匹配已安装 definition 记录的 integrity
- **THEN** Component check 和 doctor MUST 报告可归因到 Component 和 member 的 finding
- **AND** mutation preflight MUST fail closed
- **AND** runtime source assembly MUST NOT 消费该 Component 的未验证 Contribution 内容

#### Scenario: Contribution 声明不完整
- **WHEN** Skill Contribution 未引用已登记且 integrity 有效的 member，或其目标 Skill、稳定 slot、路径或 ownership 声明无效
- **THEN** Component/package check MUST 报告错误
- **AND** runtime planning MUST NOT 将该 fragment 组合到任何目标 Skill

#### Scenario: 无关 runtime diagnostics 仍可继续
- **WHEN** doctor 发现某个 Component 完整性失败
- **THEN** doctor MUST 保留 Component-specific error 和可执行修复建议
- **AND** doctor MUST 继续执行不消费该 Component 内容的 source asset 和 runtime 只读诊断
- **AND** Buildr MUST NOT 将需要该 Component 内容的 mutation 报告为完整成功
