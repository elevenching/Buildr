## MODIFIED Requirements

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
- **AND** 文档 MUST 区分官方文档、本机观察、安装包源码和推断等兼容证据来源
- **AND** 文档 MUST 说明自动 contract/parity 只能证明 Buildr 的投射与维护边界，不能证明目标 Agent 已在当前 workspace、版本或会话加载文件
- **AND** 文档 MUST NOT 维护 `documented`/`verified`、`pending`/`passed` 或品牌历史 marker smoke 快照

#### Scenario: Agent 按文档接入当前 runtime
- **WHEN** Agent 从权威文档识别到自身 runtime 已受支持
- **THEN** 文档 MUST 引导 Agent 使用匹配的 adapter id 运行 `buildr init --agent <agent>`、`buildr sync <agent>`、`buildr runtime check <agent>` 或相应 render 命令
- **AND** 文档 MUST 提醒 Agent 按 adapter-specific guidance 完成 reload、新会话或 UI toggle
- **AND** 文档 MUST 禁止为未列出的 runtime 或 surface 使用 supported fallback adapter
