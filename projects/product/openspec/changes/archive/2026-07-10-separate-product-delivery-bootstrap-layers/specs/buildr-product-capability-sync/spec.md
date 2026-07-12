## ADDED Requirements

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

#### Scenario: 自举 workspace 使用当前候选产品
- **WHEN** Buildr 维护者使用未合并的当前 Product checkout 验证自举 workspace
- **THEN** update/sync MUST 使用该 checkout 随附的 package target
- **AND** 该验证 MUST NOT 依赖远端已发布版本替换当前候选产品

#### Scenario: 保留 workspace 自有内容
- **WHEN** update/sync 向已有 workspace 物化产品管理资产
- **THEN** Buildr MUST 继续保留用户或自举 workspace 自有的 `AGENTS.md` 正文和未由 package manifest 管理的资产
- **AND** Buildr MUST 只修复 required block 和 manifest 声明的产品管理资产
