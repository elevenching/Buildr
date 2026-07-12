## ADDED Requirements

### Requirement: Buildr 通过声明式 Skill Contribution 编排 OpenSpec 契约门禁
Buildr MUST 由 OpenSpec Component 向通用 workspace Skills 的稳定 slot 贡献门禁说明，在 change 建立、同步和归档边界调用契约门禁，并保持通用 Skills 与外部 OpenSpec Skills 可独立更新。

#### Scenario: Change artifacts 达到 apply-ready
- **WHEN** task triage 选择 change-flow 且 proposal、design、specs 和 tasks 已达到 apply-ready
- **THEN** installed OpenSpec Component MUST 在 `task-triage` runtime Skill 的 change-ready slot 贡献建立基线和 proposal stage check 的说明
- **AND** Agent MUST 使用 `openspec-contract-guard` 建立契约基线并运行 proposal stage check
- **AND** 门禁未通过时 Agent MUST 将 change 报告为 blocked 而不是开始实现

#### Scenario: Delta 实现期间改变触达范围
- **WHEN** Agent 修改 delta 使其新增或改变 Requirement identity
- **THEN** Agent MUST 再次运行 proposal stage check
- **AND** Agent MUST 显式更新不完整基线而不是由普通 check 自动采用当前事实

#### Scenario: Task Finish 同步前后执行门禁
- **WHEN** `task-finish` 准备同步并归档带 delta specs 的 change
- **THEN** installed OpenSpec Component MUST 分别向 `task-finish` runtime Skill 的 pre-sync 和 post-sync slot 贡献对应门禁说明
- **AND** Task Finish MUST 在 canonical spec sync 前运行 pre-sync check
- **AND** Task Finish MUST 在 sync 后、archive 前运行 post-sync check
- **AND** 任一检查失败时 MUST 停止尚未执行的 archive、commit、push 和 cleanup

#### Scenario: OpenSpec Component 已卸载
- **WHEN** OpenSpec Component 为 disabled 或 uninstalled 且 Agent runtime 被重新渲染
- **THEN** `task-triage`、`task-finish` 和产品入口 Buildr Skill MUST NOT 包含 OpenSpec contract guard 的专用命令或路由
- **AND** 通用 Skills MUST 继续支持其不依赖 OpenSpec Component 的既有职责

#### Scenario: 外部 OpenSpec workflow 保持原样
- **WHEN** Buildr 发布或升级契约门禁
- **THEN** Buildr MUST 通过 Component-owned contribution、自有 Skill 和 CLI 编排门禁
- **AND** Buildr MUST NOT 要求修改外部 `openspec-*` Skills 来承载 Buildr 检查逻辑

#### Scenario: 门禁诊断对用户可见
- **WHEN** 契约检查阻塞 change-flow 或 task finish
- **THEN** Agent MUST 报告 change、stage、冲突或陈旧 Requirement、当前状态和可执行下一步
- **AND** Agent MUST NOT 把 warning 或未验证状态描述为门禁通过
