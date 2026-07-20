## ADDED Requirements

### Requirement: Buildr sync 安全迁移被替代的 builtin identity
Buildr product package MUST 能为一个当前 builtin 声明单一 legacy predecessor identity；sync MUST 在只读 preflight 中解析 replacement，并 MUST 在 ownership、integrity 和目标唯一性可证明时原子迁移 builtin 源资产与 manifest 状态，再在同一次 sync 中清理旧 runtime、投射新 runtime 并运行最终 doctor。

#### Scenario: 迁移已安装的官方 builtin
- **WHEN** 当前 package 声明 `task-board` replaces `task-cockpit`，且 workspace 中旧 Skill 为 `installed`、内容匹配官方 receipt 或已知官方完整性、目标 identity 不存在
- **THEN** sync MUST 在同一 source mutation 中移除旧受管源、登记并物化 `task-board`，再清理匹配 receipt 的旧 runtime 投射并渲染当前 Agent runtime
- **AND** 最终 workspace 和 runtime MUST NOT 同时保留可用的受管 `task-cockpit` 与 `task-board`

#### Scenario: 继承显式卸载状态
- **WHEN** 被替代的 optional builtin 为 `uninstalled`
- **THEN** sync MUST 将该 opt-out 迁移为 `task-board` 的 `uninstalled` 状态
- **AND** sync MUST NOT 因 identity rename 重新安装该能力

#### Scenario: 旧 builtin 已被用户修改
- **WHEN** 旧 Skill 内容或 runtime 文件不匹配官方 receipt、当前 package 或已知官方完整性，或者包含未知文件
- **THEN** sync preflight MUST 在创建 mutation lock、transaction、journal、backup 或写入 workspace 前停止
- **AND** 输出 MUST 标识 predecessor、replacement、冲突路径和可供 Agent解释的下一步

#### Scenario: replacement 目标已存在
- **WHEN** workspace 已存在非本次 replacement 产生的 `task-board` identity、源目录或 runtime path
- **THEN** sync preflight MUST 将迁移标记为冲突并保持 workspace 零写入
- **AND** Buildr MUST NOT 覆盖、合并或根据名称猜测目标 ownership

#### Scenario: replacement source 事务失败
- **WHEN** builtin identity 迁移在源目录、manifest 或 builtin receipt 任一步失败
- **THEN** Buildr MUST 回滚本次 source mutation 中已发生的受管变更
- **AND** Buildr MUST NOT 留下两个部分安装的 Skill source identity

#### Scenario: replacement runtime 阶段失败
- **WHEN** source identity 已迁移，但随后 runtime render 或最终 doctor 失败
- **THEN** sync MUST 报告未完成并保留可由重复 sync 修复的受管 source 状态
- **AND** Buildr MUST NOT 把仍存在旧 runtime orphan 或缺少新 runtime 的状态报告为迁移成功

#### Scenario: 新 workspace 初始化
- **WHEN** 新 workspace 从只声明 `task-board` 的当前 package 初始化
- **THEN** init MUST 直接物化 `task-board`
- **AND** init MUST NOT 创建 legacy `task-cockpit` entry、目录或 runtime receipt
