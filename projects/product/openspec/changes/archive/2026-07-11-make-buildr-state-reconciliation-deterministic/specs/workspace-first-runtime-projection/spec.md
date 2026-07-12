## ADDED Requirements

### Requirement: 运行时同步必须得到稳定结果
Buildr MUST 根据相同的源资产、目标目录、Agent 和 scope 得到相同的运行时结果。

#### Scenario: 重复执行同步
- **WHEN** 用户在源资产没有变化时连续执行两次相同的 render 或 sync
- **THEN** 第二次执行 MUST 不再新增、更新或删除任何运行时文件

#### Scenario: 相关命令使用相同逻辑
- **WHEN** `render`、`skills render`、`sync` 或 Component 生命周期需要更新运行时
- **THEN** Buildr MUST 使用相同的目标检查、写入、清理和结果确认逻辑

### Requirement: 运行时冲突必须在写入前发现
Buildr MUST 在写入第一个运行时文件前检查当前命令范围内的所有目标冲突。

#### Scenario: 用户文件占用目标路径
- **WHEN** 任一目标路径存在非 Buildr 管理的文件
- **THEN** Buildr MUST 在零写入状态失败
- **AND** Buildr MUST 保留该用户文件并报告全部已发现冲突

#### Scenario: 不同内容使用相同目标路径
- **WHEN** 当前命令范围内的两个源要把不同内容写入同一个运行时路径
- **THEN** Buildr MUST 在零写入状态失败并报告两个来源

### Requirement: 运行时同步必须清理失去来源的受管文件
Buildr MUST 删除当前命令范围内已经没有来源的 Buildr 受管运行时文件和安装计划，并保留非 Buildr 管理的内容。

#### Scenario: Skill 被删除
- **WHEN** Skill 已从当前 scope 的源资产中删除并再次执行 `skills render` 或 `render`
- **THEN** Buildr MUST 删除对应的受管运行时 Skill

#### Scenario: 远程 Skill 被删除
- **WHEN** 需要 Agent 安装的远程 Skill 已从源资产中删除并再次渲染
- **THEN** Buildr MUST 删除对应的受管安装计划

#### Scenario: 受管目录包含额外用户文件
- **WHEN** 待清理的受管目录包含不能证明由 Buildr 管理的额外文件
- **THEN** Buildr MUST 保留该目录并报告需要用户处理

### Requirement: Project render 必须遵守明确范围
Buildr MUST 根据命令 scope 决定参与 Skill 渲染和冲突检查的 Project。

#### Scenario: 渲染单个 Project
- **WHEN** 用户明确 render 某个 Project scope
- **THEN** Buildr MUST 只处理 workspace 和当前 Project 可见的 Skills
- **AND** Buildr MUST NOT 因其他 Project 的 Skill 声明而报错

#### Scenario: workspace 全量渲染相同 Skill
- **WHEN** workspace 全量 render 发现多个 Project 引入来源、版本和内容相同的 Skill
- **THEN** Buildr MUST 将其视为同一个运行时 Skill，且只写入一份

#### Scenario: workspace 全量渲染不同 Skill
- **WHEN** workspace 全量 render 发现多个 Project 要把不同内容写入同一个 Skill 运行时路径
- **THEN** Buildr MUST 在写入前报错并列出相关 Project

### Requirement: 运行时同步必须确认结果
Buildr MUST 在写入结束后确认本次命令负责的运行时状态已经与源资产一致。

#### Scenario: 同步后仍有差异
- **WHEN** 写入结束后仍存在本次命令负责的缺失、过期、孤儿或冲突状态
- **THEN** 命令 MUST 返回失败并给出可重新执行的修复动作

### Requirement: Buildr Core 要求简明表达
Buildr required Core MUST 要求 Agent 面向用户时优先使用常用、直接和简练的语言，避免使用不必要的专业术语。

#### Scenario: Agent 说明方案或结果
- **WHEN** Agent 向用户说明问题、方案、进度或结果
- **THEN** Agent MUST 优先使用用户容易理解的简练语言
- **AND** 只有准确表达所必需时才使用专业术语，并在需要时解释
