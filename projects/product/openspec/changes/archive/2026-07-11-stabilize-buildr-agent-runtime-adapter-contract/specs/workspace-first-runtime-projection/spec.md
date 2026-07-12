## ADDED Requirements

### Requirement: Supported runtime adapter 使用静态完整契约
Buildr MUST 使用随产品发布的静态 registry 作为 supported Agent runtime adapter 的唯一事实源，并要求每个 registered adapter 完整声明和实现 runtime contract。

#### Scenario: 注册完整 adapter
- **WHEN** package verification 校验一个 supported adapter
- **THEN** adapter descriptor MUST 包含稳定且唯一的 runtime id、全部 required render capabilities、runtime targets、实现入口和 Agent-readable metadata
- **AND** `runtime list`、CLI 参数校验、render、sync、Skill install、runtime check 和 doctor MUST 从同一 registry 解析该 adapter

#### Scenario: Adapter contract 不完整
- **WHEN** registered adapter 缺少任一 required capability、实现入口或必要 capability evidence
- **THEN** package verification MUST fail
- **AND** Buildr MUST NOT 将该 adapter 报告为 supported

#### Scenario: 未注册 runtime
- **WHEN** Agent 请求一个不在静态 registry 中的 runtime id
- **THEN** Buildr MUST 将其作为 unsupported adapter 处理
- **AND** Buildr MUST NOT alias、猜测或 fallback 到其他 supported adapter

### Requirement: Adapter 只生成声明式运行时计划
每个 supported adapter MUST 从不可变 runtime context 生成无副作用的声明式计划，并由通用 Buildr core 执行全部文件系统副作用。

#### Scenario: 生成 runtime plan
- **WHEN** Buildr 为 supported adapter planning runtime
- **THEN** adapter MUST 返回预期 writes、native assets、managed removals、capability evidence 和适用 findings 或 repair hints
- **AND** adapter MUST NOT 直接写入或删除文件、修改 Buildr 源资产、运行 doctor 或执行 workspace 提供的代码

#### Scenario: 非法 runtime plan
- **WHEN** runtime plan 包含 target 越界、不安全路径、不同内容的重复 target、非法 removal 或与 descriptor 不一致的 capability evidence
- **THEN** 通用 plan validator MUST 在写入第一个文件前拒绝整个计划
- **AND** Buildr MUST 报告可归因于 adapter 和 target 的错误

#### Scenario: Native capability 不写文件
- **WHEN** adapter 以 native behavior 实现 `rules-entry`
- **THEN** runtime plan MUST 能将适用 `AGENTS.md` 表达为 native assets 和 capability evidence
- **AND** 通用 executor MUST NOT 因该 capability 自身写入 Rule bridge

### Requirement: Runtime 命令共享计划与 reconcile 管线
Buildr MUST 让 runtime render、sync、runtime check、doctor、产品 Buildr Skill 安装和 Component lifecycle 使用同一 source assembly、plan validation、preflight、apply、cleanup 和结果确认逻辑。

#### Scenario: Render 和 check 比较相同期望状态
- **WHEN** Buildr 对相同源资产、target、adapter 和 scope 分别运行 render 与 runtime check
- **THEN** 两者 MUST 从同一个 adapter plan 得到相同的预期 targets、content identity 和 managed removals
- **AND** runtime check MUST 使用 compare-only 模式而不写入文件

#### Scenario: Doctor 使用 adapter contract
- **WHEN** Agent 运行 `doctor --agent <agent>` 且 `<agent>` 是 supported adapter
- **THEN** doctor MUST 通过 registry 选择 adapter 并聚合通用 reconcile findings
- **AND** findings、repairs 和 capability 状态 MUST 归因到 `<agent>`
- **AND** doctor MUST NOT 通过独立 Agent allowlist 或分支重新定义该 adapter 的期望 runtime

#### Scenario: Component 生命周期 reconcile runtime
- **WHEN** Component source transaction 成功后需要 reconcile supported runtime
- **THEN** Component lifecycle MUST 调用与 `render` 相同的通用 runtime 管线
- **AND** Component lifecycle MUST NOT 调用 Component 提供的 adapter 或 runtime hook

### Requirement: Adapter 可以组合受约束的内置投射原语
Buildr MUST 允许不同静态 adapter 组合相同的内置投射原语，同时保持每个 runtime 的独立 identity、contract 和诊断归因。

#### Scenario: 两个 runtime 复用相同布局
- **WHEN** 两个 registered adapters 都使用 native `AGENTS.md` 或相同 Skills target layout
- **THEN** 它们 MAY 复用同一个内置投射原语
- **AND** 每个 adapter MUST 继续拥有独立 descriptor、capability evidence 和 contract tests
- **AND** Buildr MUST NOT 将其中一个 runtime id 解析为另一个 runtime id

#### Scenario: 验证 adapter 扩展点
- **WHEN** package tests 使用 fake adapter 验证新增 adapter 的集成路径
- **THEN** fake adapter MUST 只能通过测试注入点使用
- **AND** 发布的 `runtime list`、CLI help 和 package registry MUST NOT 将 fake adapter 报告为 supported

### Requirement: 现有 supported runtime 迁移保持兼容
Buildr MUST 在采用统一 adapter contract 后保持 `codex` 和 `claude-code` 的公开命令、runtime targets、managed ownership、冲突和清理语义兼容。

#### Scenario: Codex parity
- **WHEN** Buildr 使用迁移后的 `codex` adapter render 或 check 相同 workspace 状态
- **THEN** Buildr MUST 保持 native `AGENTS.md`、`.agents/skills/`、Skill install plans、managed marker 和 doctor 结果的既有语义

#### Scenario: Claude Code parity
- **WHEN** Buildr 使用迁移后的 `claude-code` adapter render 或 check 相同 workspace 状态
- **THEN** Buildr MUST 保持同目录 `CLAUDE.md` reference bridges、`.claude/skills/`、Skill install plans、managed marker 和 doctor 结果的既有语义

#### Scenario: 重复同步保持幂等
- **WHEN** 任一迁移后的 supported adapter 在源资产与目标状态不变时连续同步两次
- **THEN** 第二次同步 MUST 不新增、更新或删除 runtime 文件
