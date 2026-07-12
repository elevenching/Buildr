## MODIFIED Requirements

### Requirement: Buildr 产品交付必须单向物化
Buildr MUST 将当前产品 package target 视为产品交付源，并将用户 workspace 和 Agent runtime 中的对应文件视为安装结果。

#### Scenario: Workspace target 单向物化
- **WHEN** Agent 使用当前 Buildr 产品执行 init、update 或 sync
- **THEN** Buildr MUST 从 `package/targets/workspace/` 向目标 workspace 物化 manifest 声明的资产
- **AND** Buildr MUST NOT 从目标 workspace 反向更新 Product Project 的 package 源

#### Scenario: Runtime target 单向物化
- **WHEN** Agent 执行 `buildr skill install <agent>` 或 `buildr sync <agent>`
- **THEN** Buildr MUST 从 `package/targets/runtime/` 安装 manifest 声明的产品入口 Agent Skill
- **AND** 安装后的 runtime 文件 MUST NOT 成为产品 Skill 的源资产

#### Scenario: 未合并候选产品使用隔离目标验证
- **WHEN** Buildr 维护者使用未合并的 task worktree Product checkout 验证候选产品
- **THEN** update/sync MUST 使用该 checkout 随附的 package target
- **AND** 验证目标 MUST 是临时 workspace 或 task worktree 自身，而不是主开发工作区的自举 workspace

#### Scenario: 相同候选 tree 集成后不重复物化验证
- **WHEN** 已完成隔离验证的候选 Git tree 未经内容改变集成到主开发分支
- **THEN** Buildr 开发流程 MUST NOT 要求仅为重复产品验证而从主开发分支 checkout 再次 update/sync 主自举 workspace
- **AND** 实际 workspace 后续需要消费新版产品资产时 MAY 独立执行 update/sync

#### Scenario: 保留 workspace 自有内容
- **WHEN** update/sync 向已有 workspace 物化产品管理资产
- **THEN** Buildr MUST 继续保留用户或自举 workspace 自有的 `AGENTS.md` 正文和未由 package manifest 管理的资产
- **AND** Buildr MUST 只修复 required block 和 manifest 声明的产品管理资产
