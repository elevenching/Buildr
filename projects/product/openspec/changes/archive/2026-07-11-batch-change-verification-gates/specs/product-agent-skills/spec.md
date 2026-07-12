## ADDED Requirements

### Requirement: 实现任务采用分层验证门禁
Buildr 任务流程 Skills MUST 将实现期间的验证分为单任务最小反馈、任务组受影响范围验证和最终候选完整验证，并 MUST 防止同一候选状态重复执行已被上层入口覆盖的检查。

#### Scenario: 单任务只做最小反馈检查
- **WHEN** Agent 完成任务组内的一个实现任务且没有跨越高风险边界
- **THEN** Agent MUST 只运行语法、类型或与该任务直接相关的小范围检查
- **AND** Agent MUST NOT 默认运行当前 workspace 或 Project 定义的完整验证入口

#### Scenario: Workspace 定义具体验证入口
- **WHEN** Buildr 将任务流程 Skills 交付到用户 workspace
- **THEN** Skills MUST 使用通用的最小反馈、受影响范围和完整验证语义
- **AND** 具体检查命令 MUST 由当前 workspace 或 Project 的规则、OpenSpec 或开发文档定义
- **AND** Skills MUST NOT 将 Buildr 产品仓的 package check、临时 workspace E2E 或产品总验证命令规定为所有项目的固定入口

#### Scenario: 任务组边界集中验证
- **WHEN** 一组共享实现区域、验证入口或失败影响面的任务全部完成
- **THEN** Agent MUST 对该任务组运行一次受影响范围验证
- **AND** Agent MUST NOT 为组内每个任务机械重复同一专项检查

#### Scenario: 最终候选冻结后完整验证
- **WHEN** 计划中的实现、自然语言资产、生成资产同步和 review 修订均已完成
- **THEN** Agent MUST 将当前状态视为最终候选并运行一次完整验证
- **AND** 完整验证通过后相同 tree 的 commit、集成、push 和清理 MUST 复用该证据

#### Scenario: 上层入口覆盖底层检查
- **WHEN** Agent 能够证明即将运行的上层验证入口包含某个底层检查
- **THEN** Agent MUST NOT 在同一候选状态中先后单独重复运行该底层检查
- **AND** 无法证明覆盖关系时 Agent MUST 保留必要检查

#### Scenario: 运行中验证复用进程
- **WHEN** 验证命令返回 session、cell、process id 或仍在运行状态
- **THEN** Agent MUST 使用 wait、poll 或 resume 继续同一进程
- **AND** 暂时没有新输出 MUST NOT 触发相同命令的重复启动

#### Scenario: 完整验证失败后的修复循环
- **WHEN** 最终完整验证失败且 Agent 正在修复失败原因
- **THEN** Agent MUST 优先重跑失败项和受修复影响的专项检查
- **AND** 候选重新稳定后 Agent MUST 再执行一次最终完整验证

#### Scenario: OpenSpec tasks 表达验证阶段
- **WHEN** Agent 为实现型 change 编写或调整任务清单
- **THEN** tasks MUST 将实现工作组织为有语义的任务组
- **AND** tasks MUST 将任务组专项验证置于对应实现之后
- **AND** tasks MUST 将完整候选验证置于所有实现、文档、同步和 review 修订之后
