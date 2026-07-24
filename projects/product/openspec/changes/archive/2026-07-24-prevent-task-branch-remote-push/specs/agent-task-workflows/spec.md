## ADDED Requirements

### Requirement: Task Finish 默认不推送远端任务分支
Buildr Task Finish MUST 将当前轮次“收尾”授权中的默认推送范围限制为包含已集成任务内容的目标分支。Task Finish 与兼容的 Git 任务集成 provider MUST NOT 因任务分支存在、已提交或已合入而自动创建或推送对应的远端任务分支。

#### Scenario: 普通收尾只推送目标分支
- **WHEN** 用户要求收尾，任务分支已经安全集成到已确认的目标分支，且用户没有明确要求远端任务分支
- **THEN** Agent MUST 只披露并推送目标分支
- **AND** MUST NOT 执行 `git push -u <remote> <task-branch>` 或其他会创建、更新远端任务分支的动作
- **AND** 最终收尾结果 MUST 说明目标分支推送结果与任务分支未推送状态

#### Scenario: 用户明确要求远端任务分支
- **WHEN** 用户在当前轮次明确要求为 PR、远程备份、交接或其他具体目的推送任务分支
- **THEN** Agent MAY 在执行前披露任务分支、远端、目的和待推送提交后推送该分支
- **AND** MUST 继续遵守 force push、远端删除和共享历史改写的既有授权边界
