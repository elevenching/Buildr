## ADDED Requirements

### Requirement: Onboarding 区分 Skill source authority 与 render destination
Buildr onboarding guidance MUST 说明 workspace 是唯一 Skill source authority，并 MUST 将 user/workspace destination 解释为 Agent runtime 投射位置而不是 source scope。

#### Scenario: 首次初始化 workspace
- **WHEN** Agent 为 supported runtime 执行首次 `buildr init --agent <agent>`
- **THEN** Buildr MUST 初始化 workspace `skills/manifest.yml` 和 workspace runtime
- **AND** MUST NOT 创建 Project Skill manifests 或隐式投射用户级 Skills

#### Scenario: Agent 询问 Project Skill
- **WHEN** 用户要求某个 Skill 只适用于一个 Project
- **THEN** onboarding guidance MUST 说明 Project applicability 是语义路由和 readiness 信息
- **AND** MUST 说明 Agent runtime 隔离只能由实际工作目录和 Agent discovery mechanism 决定

### Requirement: Runtime guidance 公开 Skills inventory 保证边界
Buildr guidance MUST 说明 adapter 是否能完整观察当前 Agent Skills 集，并 MUST 区分已证明冲突、未发现冲突和可见性不完整。

#### Scenario: Adapter inventory 为 partial
- **WHEN** runtime discovery 无法枚举 plugin、system 或其他 Agent 内部 Skill 来源
- **THEN** onboarding/runtime guidance MUST 报告 `partial` evidence 和受影响边界
- **AND** MUST NOT 将成功 render 描述为已证明全局唯一

## REMOVED Requirements

### Requirement: Buildr guidance names runtime render assets
**Reason**: 原 Requirement 将 workspace/project Skills 一起定义为 adapter render capability，保留了无效的 Project runtime scope。
**Migration**: guidance 改为 product Buildr Skill、workspace Skill source、user/workspace destinations、Skill install plans 和 runtime check。
