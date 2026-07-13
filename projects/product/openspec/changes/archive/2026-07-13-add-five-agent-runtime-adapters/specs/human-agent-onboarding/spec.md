## ADDED Requirements

### Requirement: 公开文档提供已接入 Agent adapter 权威说明
Buildr MUST 维护一份可由人和 Agent 从根 README 发现的已接入 Agent runtime adapter 权威文档，并使其与 `buildr runtime list --json` 的 supported adapter 事实一致。

#### Scenario: README 引用 adapter 文档
- **WHEN** 用户或 Agent 阅读根 `README.md` 或 `README.en.md` 的当前支持摘要或文档导航
- **THEN** README MUST 链接已接入 Agent adapter 权威文档
- **AND** README MUST 引导 Agent 使用 `buildr runtime list --json` 获取当前机器可读事实矩阵
- **AND** README MUST NOT 复制一份容易与权威文档漂移的完整 adapter 机制表

#### Scenario: Adapter 文档说明接入方式
- **WHEN** 用户或 Agent 阅读已接入 Agent adapter 权威文档
- **THEN** 文档 MUST 对每个 supported adapter 说明 adapter id、适用 surface、Rules 入口与生成 target、Skills root、activation/reload、checker、前置条件和已知限制
- **AND** 文档 MUST 区分官方文档、本机观察、安装包源码和推断等证据等级
- **AND** 文档 MUST 标明 `documented` 或 `verified` 证据等级，以及真实产品 smoke 的通过或待验证状态

#### Scenario: Agent 按文档接入当前 runtime
- **WHEN** Agent 从权威文档识别到自身 runtime 已受支持
- **THEN** 文档 MUST 引导 Agent 使用匹配的 adapter id 运行 `buildr init --agent <agent>`、`buildr sync <agent>`、`buildr runtime check <agent>` 或相应 render 命令
- **AND** 文档 MUST 提醒 Agent 按 adapter-specific guidance 完成 reload、新会话或 UI toggle
- **AND** 文档 MUST 禁止为未列出的 runtime 或 surface 使用 supported fallback adapter

### Requirement: Buildr onboarding guidance 覆盖新增 adapters
Buildr Skill、bootstrap guide、CLI Reference 和 current-state knowledge MUST 将新增 supported adapters 与其 runtime-specific 前置条件纳入 Agent onboarding，同时继续以 `runtime list` 作为事实源。

#### Scenario: Agent 选择新增 adapter
- **WHEN** Agent 识别自身为 Cursor、Qoder、TRAE、TRAE Work 或 WorkBuddy 的已认证 surface
- **THEN** onboarding guidance MUST 要求 Agent 从 `runtime list --json` 选择 `cursor`、`qoder`、`trae`、`trae-work` 或 `workbuddy`
- **AND** Agent MUST 使用匹配 adapter 的命令，不得借用同品牌其他 surface 或其他 supported adapter

#### Scenario: 接入后仍需人工动作
- **WHEN** sync 或 render 已完成但 runtime check 报告 reload、新会话、UI toggle 或真实引用读取待确认
- **THEN** Agent MUST 向用户说明剩余动作及其原因
- **AND** Agent MUST NOT 把仅完成文件投射描述为当前 Agent 会话已经可用
