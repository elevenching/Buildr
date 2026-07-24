# task-asset-observation-lifecycle Specification

## Purpose

定义跨 worktree 共享的任务资产 observation、最小记录模型、人工决定和维护历史交接边界。

## Requirements

### Requirement: Buildr 按 Workspace 隔离共享任务资产观察
Buildr MUST 将任务资产 observation 保存到用户级共享状态，并 MUST 让同一 Workspace 的 worktree 与非 worktree 任务解析到同一 inbox。

#### Scenario: 不同 task environment 解析共享 inbox
- **WHEN** 两个 task environment 属于同一 `workspace.id`
- **THEN** provider MUST 将 observation 解析到同一 Workspace inbox
- **AND** 每个任务 MUST 使用独立 observation id 和文件

#### Scenario: 不同 Workspace 隔离
- **WHEN** 两个任务属于不同 `workspace.id`
- **THEN** 它们的 observation MUST 位于不同 Workspace 目录
- **AND** worktree 路径或当前 launcher checkout MUST NOT 决定该 identity

### Requirement: Observation 保存最小可审查状态
Observation MUST 使用 Markdown 与可解析 frontmatter 保存来源、精炼观察、审查状态、人工决定和去向，并 MUST NOT 保存完整任务轨迹。

#### Scenario: 创建 observation
- **WHEN** provider 在非简单 Workspace 任务中发现可能影响长期资产的可观察信号
- **THEN** observation MUST 记录 workspace、task owner、task/thread 以及可用的 worktree、branch、change、commit、Project、Service 来源
- **AND** 正文 MUST 只保存精炼事实、证据引用和待审查含义

#### Scenario: 禁止完整轨迹
- **WHEN** provider 更新 observation
- **THEN** provider MUST NOT 复制完整对话、完整工具日志、隐藏推理或逐节点 execution trace

### Requirement: Observation 写入保持单任务所有权
Provider MUST 以 observation owner 约束单文件写入，并 MUST 使用原子替换避免部分文件。

#### Scenario: Owner 更新自己的 observation
- **WHEN** 当前 task owner 与 observation owner 匹配
- **THEN** helper MUST 允许追加观察或推进 lifecycle 状态
- **AND** 写入 MUST 通过同目录原子替换完成

#### Scenario: Owner 不匹配
- **WHEN** 当前 task owner 尝试修改其他 owner 的 observation
- **THEN** helper MUST 拒绝修改并返回可诊断错误
- **AND** helper MUST NOT 选择任意文件或覆盖现有内容

### Requirement: 人工决定控制 Observation 去向
Provider MUST 在任务结束时完成审查并请求人工 accept 或 reject；未经决定 MUST NOT 把 observation 当作长期资产。

#### Scenario: 人工拒绝
- **WHEN** 用户明确判断 observation 无价值或拒绝候选
- **THEN** provider MUST 精确删除该 observation
- **AND** Buildr MUST NOT 创建 tracked tombstone 或维护记录

#### Scenario: 人工接受
- **WHEN** 用户接受 Rule、Skill、capability Contract 或 product follow-up 候选
- **THEN** provider MUST 记录目标类型和新任务 handoff
- **AND** 后续工作 MUST 重新进入 `task-triage`，不得重开原任务

### Requirement: 只有实际资产变更保留维护历史
Buildr MUST 只为实际修改的 Rule、Skill 或 capability Contract 保存 tracked 维护记录；product follow-up MUST 使用 OpenSpec 吸收来源事实而不复制维护历史。

#### Scenario: 新任务完成资产修改
- **WHEN** 接受的候选在新任务中实际修改 Rule、Skill 或 capability Contract
- **THEN** 新任务 MUST 在 `asset-maintenance/<type>/<asset-id>/records/` 创建记录并与资产变更一起提交
- **AND** observation MUST 只在该记录和资产变更成功集成后删除

#### Scenario: 调查后不修改
- **WHEN** 新任务正式核验后决定不修改目标资产
- **THEN** provider MUST 删除 observation
- **AND** Buildr MUST NOT 长期保留无修改调查记录

#### Scenario: Product follow-up 吸收来源
- **WHEN** 接受的候选属于 product follow-up
- **THEN** 新任务的 OpenSpec proposal 或 design MUST 吸收必要来源事实
- **AND** observation MUST 在 artifacts 安全保存事实后删除，不得创建重复 `asset-maintenance` 记录

### Requirement: Observation MVP 不引入后台系统
Buildr MUST 通过 task-asset-review Skill 的内部资源实现 observation lifecycle，并 MUST NOT 为 MVP 增加公共 CLI、daemon、watcher、数据库、全局索引或复杂锁。

#### Scenario: Skill 执行 lifecycle action
- **WHEN** provider 创建、更新、finalize、accept 或 reject observation
- **THEN** provider MUST 使用随 Skill 交付的内部 helper 或等价确定性资源
- **AND** 用户 MUST 能继续通过自然语言完成决定
