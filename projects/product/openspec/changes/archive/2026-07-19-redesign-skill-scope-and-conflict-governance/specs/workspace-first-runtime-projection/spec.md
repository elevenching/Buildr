## ADDED Requirements

### Requirement: Adapter 声明 user 与 workspace Skills discovery inventory
Supported runtime adapter MUST 声明 user/workspace destination roots、可观测发现 roots、inventory evidence 和 activation 行为，使 Buildr 能在写入前检查候选 Skill 的有效发现集合。

#### Scenario: Adapter 完整声明 destination roots
- **WHEN** adapter 支持 workspace 和 user Skill render
- **THEN** descriptor MUST 分别声明两种 destination 的确定性 filesystem root
- **AND** MUST 声明从当前工作目录、用户、admin、system 或 plugin 中能够检查的发现来源

#### Scenario: Adapter 只能部分观察 Skills 集
- **WHEN** adapter 无法枚举一个可能参与 Agent 发现的内部来源
- **THEN** descriptor MUST 将 inventory evidence 标记为 `partial`
- **AND** render/doctor MUST 报告 `runtime.skill_visibility_incomplete`
- **AND** Buildr MUST NOT 宣称已经证明当前 Agent 全局无同名 Skill

#### Scenario: Destination root 不可确定
- **WHEN** adapter 无法确定 user 或 workspace destination root
- **THEN** Buildr MUST 将对应 destination 标为 unsupported
- **AND** MUST NOT 猜测目录或写入 runtime

### Requirement: Runtime plan 在统一 preflight 中治理 Skill 名称冲突
Buildr MUST 在生成任何 Skill mutation 前组合 source plan、capability graph、receipts、destination inventory 和同名候选，并对 blocking conflict 保持整次零写入。

#### Scenario: 候选与可观测外部 Skill 同名
- **WHEN** runtime plan 发现候选 Skill ID 与外部、plugin、system、人工或其他 workspace Skill 同名且 identity 不等价
- **THEN** plan MUST 包含冲突来源、路径或可用 provenance、digest 和 nextActions
- **AND** reconcile MUST NOT 写入任一候选 Skill 或 receipt

#### Scenario: 用户层满足 workspace 投射
- **WHEN** runtime plan 证明 user destination 已包含同一受管 asset identity 和 render digest
- **THEN** plan MUST 将 workspace candidate 标记为 `satisfied_by_user`
- **AND** checker MUST 使用 satisfaction evidence 检测后续 user projection 漂移

#### Scenario: 不透明来源不影响不相关候选
- **WHEN** adapter inventory 为 partial 但没有发现与候选 ID 相同的可观测 Skill
- **THEN** Buildr MAY 在披露 partial assurance 后继续投射
- **AND** MUST NOT 将该结果描述为顶层 Skill 路由无歧义已证明

## REMOVED Requirements

### Requirement: Project render 必须遵守明确范围
**Reason**: Project 是业务上下文而不是可由 Buildr兑现的 Agent Skills runtime 隔离范围。
**Migration**: Rules 继续按真实目录 scope 解析；Skills 统一从 workspace source authority render 到 user 或 workspace destination，Project 只保留 capability/applicability context。
