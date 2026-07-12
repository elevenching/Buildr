## ADDED Requirements

### Requirement: 产品验证覆盖 Task Finish 收尾契约
Buildr package verification MUST 确保 `task-finish` 作为独立内置 workspace Skill 发布、路由并保留安全收尾契约。

#### Scenario: 校验 Task Finish 随包发布
- **WHEN** Buildr 执行 package check
- **THEN** workspace Skill manifests MUST 声明 enabled、installed 的 `task-finish`
- **AND** 产品入口 Buildr Skill MUST 将完整任务收尾意图路由到 `task-finish`
- **AND** Git Ops Skill description MUST NOT 继续声明完整“收尾”意图

#### Scenario: 校验收尾状态机
- **WHEN** Buildr 验证随包 `task-finish` Skill
- **THEN** 验证 MUST 覆盖前置检查、OpenSpec 归档、EOF 空白行处理、验证证据复用、提交、fetch/rebase、fast-forward、push、入口迁移和本地清理
- **AND** 验证 MUST 确认 tree 改变后重验、tree 相同时不重复 E2E

#### Scenario: 校验收尾授权边界
- **WHEN** Buildr 验证随包 `task-finish` Skill
- **THEN** 验证 MUST 确认“收尾”不授权 force push、merge commit、远端任务分支删除、丢弃改动、共享分支历史改写或语义冲突决策
- **AND** 验证 MUST 确认任何失败会停止尚未执行的 merge、push 或 cleanup

#### Scenario: Core 不复制收尾流程
- **WHEN** Buildr 验证 required Core 和 Task Finish Skill
- **THEN** 完整 task closeout 操作手册 MUST 只存在于 Skills
- **AND** required Core MUST NOT 包含 OpenSpec archive EOF 修复或 Git 收尾步骤
