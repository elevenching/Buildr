## ADDED Requirements

### Requirement: `init --agent` 完成后必须提供首次使用交接
Buildr onboarding MUST 将成功的技术初始化转换为普通用户可理解的首次使用交接。Agent MUST 基于最终 doctor 和真实 Project/Service 状态解释 Workspace → Project → Service 最小模型，并只引导当前必要的下一步；CLI 成功输出 MUST NOT 把要求用户手动执行 Project/Service 命令作为默认结果。

#### Scenario: 初始化后没有 Project
- **WHEN** `buildr init --agent <agent>` 的最终 doctor 通过且当前 Workspace 没有 Project
- **THEN** Agent MUST 用普通语言说明 Workspace、Project 与 Service 的关系
- **AND** MUST 询问用户希望管理的业务、产品、系统、长期工作或已有 repo
- **AND** MUST NOT 首先讲解 Rules、Skills、Commands、runtime adapter 或要求用户执行 `project create`

#### Scenario: 初始化后 Project 没有 Service
- **WHEN** Workspace 中存在唯一可确认 Project，但该 Project 没有 Service
- **THEN** Agent MUST 说明 Service 只在存在代码仓、应用、模块或可执行资产时需要
- **AND** MUST 询问用户是接入已有资产还是直接开始 Project-scoped 工作
- **AND** MUST NOT 将 Service 作为 onboarding 完成的强制条件

#### Scenario: 初始化后存在唯一工作范围
- **WHEN** Workspace 中存在唯一可确认 Project 和唯一可确认 Service
- **THEN** Agent MUST 简短说明已识别的 Workspace、Project 与 Service
- **AND** MUST 邀请用户直接描述第一项工作目标
- **AND** MUST NOT 为已经唯一的范围重复要求用户填写 code、path 或 Git 声明

#### Scenario: 初始化后存在多个候选范围
- **WHEN** Workspace 中存在多个可能的 Project 或当前 Project 中存在多个可能的 Service
- **THEN** Agent MUST 只询问足以消除当前工作范围歧义的最少问题
- **AND** MUST NOT 根据排序、最近修改或第一个条目静默选择业务范围

#### Scenario: runtime 仍需要人工激活
- **WHEN** init/sync 已完成文件投射但当前 adapter 仍要求 reload、新会话或 UI toggle
- **THEN** Agent MUST 先说明剩余动作和原因
- **AND** MUST NOT 把文件已生成描述为当前会话已经可以使用新资产

#### Scenario: onboarding 不生成长期欢迎文件
- **WHEN** Buildr 完成首次初始化或首次教学
- **THEN** Buildr MUST NOT 创建 `WELCOME.md`、持久化 onboarding checklist 或把固定教学写入每次会话 required Rule
- **AND** 后续 Agent MUST 继续从真实 Workspace、Project、Service 与 runtime 状态判断是否需要引导

### Requirement: Onboarding 必须以第一次有效工作作为用户成功条件
Buildr MUST 区分技术 onboarding 完成与用户第一次有效工作。技术 onboarding 以 Workspace、runtime 和 doctor ready 为完成条件；用户成功路径 MUST 继续让用户理解或确认工作范围，并能够向 Agent 提出第一项真实目标。

#### Scenario: 技术 onboarding 完成
- **WHEN** Workspace 源资产、当前 Agent runtime 和最终 doctor 均已准备完成
- **THEN** Buildr MAY 报告技术 onboarding 已完成
- **AND** Agent MUST 继续执行首次使用交接，除非用户已经给出明确 Project/Service 和工作目标

#### Scenario: 用户已经给出完整目标
- **WHEN** 用户最初请求中已经包含业务或产品范围、已有 repo 和第一项工作目标
- **THEN** Agent MUST 在必要授权后连续完成 init、Project/Service 接入和任务范围确认
- **AND** MUST NOT 为展示教学而中断已经明确的工作流

#### Scenario: 用户完成第一次有效工作入口
- **WHEN** 用户已确认 Project、可选 Service 并向 Agent 提出真实工作目标
- **THEN** Agent MUST 使用当前范围适用的工作资产推进任务
- **AND** Buildr onboarding MUST NOT 要求用户先掌握其他资产类型或 CLI 命令

### Requirement: Onboarding 必须提供 local app 与 Agent-only 两种一致入口
Buildr MUST 允许用户通过 local app 或直接在 Agent 对话中开始使用，并 MUST 让两种入口使用相同的 Workspace → Project → Service 心智、同一 source authority 和同一 Agent 执行边界。

#### Scenario: 用户选择 local app
- **WHEN** 用户通过 Buildr App 添加或进入 Workspace
- **THEN** local app MUST 帮助用户理解和选择 Workspace、Project 与可选 Service
- **AND** 创建、迁移、修复和开始工作 MUST 通过可复制 Agent Action 交接给 Agent
- **AND** local app MUST NOT声称自己已经执行 Agent 的专业工作

#### Scenario: 用户只使用 Agent
- **WHEN** 用户不打开 local app 而在 supported Agent 中请求使用 Buildr
- **THEN** Agent MUST 完成 runtime discovery、init/doctor、首次教学和必要的 Project/Service 引导
- **AND** MUST NOT 要求用户为了完成 onboarding 打开 local app

#### Scenario: 用户在两种入口之间切换
- **WHEN** 用户先通过 Agent 创建或修改资产，再打开 local app，或者从 local app 复制 prompt 后回到 Agent
- **THEN** 两种入口 MUST 从同一 Workspace 源资产读取事实
- **AND** MUST NOT 维护需要双向同步的第二份 Project/Service/onboarding 状态
