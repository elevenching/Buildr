# project-command-requirements Specification

## Purpose
定义 Project 如何以稳定 Command ID 引用 workspace catalog、表达 required/optional 与版本约束，并按明确的单 Project 或跨 Project task context 合并要求；本契约同时约束旧 Project 空集兼容、provenance 和冲突失败闭合行为。

## Requirements

### Requirement: Project 通过引用声明 Command requirements
Buildr MUST 使用 `projects/<project>/commands.yml` 保存 Project 对 workspace Command catalog 的逻辑要求，并 MUST NOT 在 Project 中复制 Command definition 或保存本机状态。

#### Scenario: Project Commands baseline
- **WHEN** Buildr 创建一个新 Project
- **THEN** Buildr MUST 创建 `commands.yml`
- **AND** 文件 MUST 声明 `schemaVersion: buildr.project-commands/v1` 和空 `requirements`

#### Scenario: Project 声明 Command requirement
- **WHEN** Project 声明某个 Command 为 required 或 optional
- **THEN** requirement MUST 引用 workspace catalog 中的稳定 Command ID
- **AND** MAY 声明版本约束和 Agent-readable purpose
- **AND** MUST NOT 重复 executable、version probe 或 install hint

#### Scenario: Project 引用不存在的 Command
- **WHEN** Project requirement 引用的 Command ID 无法从 workspace catalog 唯一解析
- **THEN** doctor 和 `commands check` MUST 报告 source/context error
- **AND** MUST 输出 Project、requirement source 和缺失 Command ID
- **AND** MUST NOT 猜测 executable 或自动创建 catalog definition

### Requirement: Command requirements 按明确 Project task context 解析
Buildr MUST 使用显式 Project task context 解析有效 Command requirements，并 MUST NOT 将全部 Projects 的要求自动视为当前机器的全局 readiness。

#### Scenario: 单 Project task
- **WHEN** commands check 或 doctor 收到一个明确 Project context
- **THEN** Buildr MUST 只合并 workspace default requirements 与该 Project requirements
- **AND** MUST 保留每个 requirement provenance

#### Scenario: root context
- **WHEN** doctor 或 commands check 没有收到 Project context
- **THEN** Buildr MUST 校验全部 Project requirement 文件的 schema 和 catalog 引用完整性
- **AND** machine readiness MUST 只依据 workspace default requirements
- **AND** MUST NOT 因无关 Project 的 required Command 缺失而将 root task 标记为未就绪

#### Scenario: 跨 Project task
- **WHEN** task context 明确包含多个 Projects
- **THEN** Buildr MUST 合并这些 Projects 对同一 Command ID 的 requirements
- **AND** MUST NOT 依据 Project 顺序或当前目录选择其中一个要求

### Requirement: 跨 Project Command 版本约束确定性合并
Buildr MUST 对同一 Command ID 的多个版本约束执行确定性兼容检查，并 MUST 在无法证明存在共同可接受版本时 fail closed。

#### Scenario: 版本约束存在交集
- **WHEN** 多个适用 requirements 对同一 Command ID 声明兼容版本范围
- **THEN** Buildr MUST 生成合并约束
- **AND** machine observation MUST 对该合并约束检查一次并保留全部来源

#### Scenario: 版本约束不兼容
- **WHEN** 多个适用 requirements 对同一 Command ID 的版本范围没有交集
- **THEN** Buildr MUST 报告 `command_requirement_conflict`
- **AND** MUST 列出冲突 Projects、约束和来源路径
- **AND** MUST NOT 执行版本探测或输出安装建议作为冲突解决结果

#### Scenario: required 与 optional 合并
- **WHEN** 同一 Command ID 同时被 required 和 optional requirement 引用
- **THEN** 合并结果 MUST 为 required
- **AND** 版本约束仍 MUST 按相同兼容规则求交

### Requirement: 旧 Project 缺少 Commands context 可安全兼容
Buildr MUST 将迁移期内缺少 `commands.yml` 的既有 Project 解释为空 requirements，而不是隐式推断工具需求。

#### Scenario: 旧 Project 没有 commands.yml
- **WHEN** 已登记 Project 存在但没有 `commands.yml`
- **THEN** doctor MUST 报告可修复的兼容状态
- **AND** Project Command requirements MUST 解析为空集
- **AND** Buildr MUST NOT 从代码文件、Service metadata 或 workspace catalog 猜测 requirements

#### Scenario: 安全补齐 baseline
- **WHEN** 用户运行受支持的 workspace sync 或显式 Project migration
- **THEN** Buildr MUST 能创建空 `commands.yml`
- **AND** MUST NOT 修改 workspace catalog、安装 binary 或改变其他 Project requirements
