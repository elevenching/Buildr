## ADDED Requirements

### Requirement: 产品验证覆盖分层验证门禁契约
Buildr package verification MUST 防止随包任务 Skills 和 Product Project 开发契约回退为逐任务完整 E2E、重复启动运行中验证或重复执行被上层入口覆盖的检查。

#### Scenario: 校验三级验证边界
- **WHEN** Buildr 验证随包任务 Skills 和 Product Project 开发契约
- **THEN** 验证 MUST 确认单任务只要求最小反馈检查
- **AND** 验证 MUST 确认任务组边界要求一次受影响范围验证
- **AND** 验证 MUST 确认只有冻结后的最终候选要求完整验证

#### Scenario: 校验完整 E2E 去重语义
- **WHEN** Buildr 验证实现阶段和收尾阶段的流程文本
- **THEN** 验证 MUST 确认流程不要求每个任务后运行完整 E2E
- **AND** 验证 MUST 确认上层入口已覆盖的底层检查在同一候选状态中不会被机械重复
- **AND** 验证 MUST 确认相同最终候选 tree 的后续 Git 动作复用已有验证证据

#### Scenario: 校验运行中验证进程复用
- **WHEN** Buildr 验证随包任务 Skills
- **THEN** 验证 MUST 确认 session、cell、process id 或仍在运行状态通过 wait、poll 或 resume 继续
- **AND** 验证 MUST 确认暂时无输出不会触发相同命令的重复启动

#### Scenario: 校验失败后的重验范围
- **WHEN** Buildr 验证最终候选完整验证失败后的流程
- **THEN** 验证 MUST 确认修复期间优先重跑失败项和受影响专项检查
- **AND** 验证 MUST 确认候选重新稳定后执行一次新的最终完整验证

#### Scenario: 校验外部 OpenSpec Skill 所有权
- **WHEN** Buildr 验证分层验证门禁的交付来源
- **THEN** 门禁 MUST 由 Buildr-owned Skills 或 Product Project 开发契约提供
- **AND** Component 管理的外部 `openspec-apply-change` Skill MUST 保持上游所有权
