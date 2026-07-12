## MODIFIED Requirements

### Requirement: Buildr sync 是 Agent 升级主路径
Buildr MUST 提供 sync 命令，让 Agent 能把最新 Buildr 产品交付到支持的 Agent runtime；首次 `init --agent` MUST 复用同一 sync 管线，而不是维护独立的产品交付实现。

#### Scenario: 同步 Codex
- **WHEN** Agent 运行 `buildr sync codex --target <dir>`
- **THEN** Buildr MUST 同步 workspace 产品能力、安装或修复产品入口 Buildr Skill、渲染 Codex runtime，并报告最终 Codex doctor 状态

#### Scenario: 同步 Claude Code
- **WHEN** Agent 运行 `buildr sync claude-code --target <dir>`
- **THEN** Buildr MUST 同步 workspace 产品能力、安装或修复产品入口 Buildr Skill、渲染 Claude Code runtime，并报告最终 Claude Code doctor 状态

#### Scenario: 高层初始化复用 sync
- **WHEN** Agent 运行 `buildr init --agent <agent> --target <dir>`
- **THEN** Buildr MUST 先完成 workspace 源资产初始化，再通过与 `buildr sync <agent>` 相同的管线执行产品能力更新、Component reconcile、runtime 投射和 doctor
- **AND** Buildr MUST NOT 为初始化维护第二套 update、render 或 doctor 实现

#### Scenario: sync 遇到用户决策点时停止
- **WHEN** sync 遇到修改过的 optional 内置能力、manifest 对齐问题，或需要安装外部命令行工具
- **THEN** sync MUST 在执行破坏性或会修改本机环境的动作前停止
- **AND** sync MUST 提供清晰下一步，供 Agent 向用户确认

### Requirement: Buildr 产品交付必须单向物化
Buildr MUST 将当前产品 package target 视为产品交付源，并将用户 workspace 和 Agent runtime 中的对应文件视为安装结果。

#### Scenario: Workspace target 单向物化
- **WHEN** Agent 使用当前 Buildr 产品执行 init、update 或 sync
- **THEN** Buildr MUST 从 `package/targets/workspace/` 向目标 workspace 物化 manifest 声明的资产
- **AND** Buildr MUST NOT 从目标 workspace 反向更新 Product Project 的 package 源

#### Scenario: Runtime target 单向物化
- **WHEN** Agent 执行 `buildr skill install <agent>`、`buildr sync <agent>` 或 `buildr init --agent <agent>`
- **THEN** Buildr MUST 从 `package/targets/runtime/` 安装 manifest 声明的产品入口 Agent Skill
- **AND** 安装后的 runtime 文件 MUST NOT 成为产品 Skill 的源资产

#### Scenario: 未合并候选产品使用隔离目标验证
- **WHEN** Buildr 维护者使用未合并的 task worktree Product checkout 验证候选产品
- **THEN** init/update/sync MUST 使用该 checkout 随附的 package target
- **AND** 验证目标 MUST 是临时 workspace 或 task worktree 自身，而不是主开发工作区的自举 workspace

#### Scenario: 相同候选 tree 集成后不重复物化验证
- **WHEN** 已完成隔离验证的候选 Git tree 未经内容改变集成到主开发分支
- **THEN** Buildr 开发流程 MUST NOT 要求仅为重复产品验证而从主开发分支 checkout 再次 update/sync 主自举 workspace
- **AND** 实际 workspace 后续需要消费新版产品资产时 MAY 独立执行 update/sync

#### Scenario: 保留 workspace 自有内容
- **WHEN** init/update/sync 向 workspace 物化产品管理资产
- **THEN** Buildr MUST 继续保留用户或自举 workspace 自有的 `AGENTS.md` 正文和未由 package manifest 管理的资产
- **AND** Buildr MUST 只修复 required block 和 manifest 声明的产品管理资产
