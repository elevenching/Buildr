## MODIFIED Requirements

### Requirement: 新增 adapters 的 checker 报告环境与前置条件事实
Buildr MUST 让每个新增 adapter 的 `runtime-check` 区分投射状态、安装/版本 probe 状态和 activation guidance，并且只执行随产品静态声明的有限时无 shell probe；产品级真实 Agent 验证缺口 MUST NOT 作为当前 workspace prerequisite finding。

#### Scenario: Environment probe 可自动执行
- **WHEN** descriptor 声明静态 command installation 或 version probe
- **THEN** runtime check MUST 使用静态 executable 和 arguments 在有限超时内执行
- **AND** 输出 MUST 包含 probe 状态与可审计 evidence

#### Scenario: Environment 只能人工确认
- **WHEN** 目标 surface 没有稳定、安全、跨安装形态的 command probe
- **THEN** descriptor MUST 使用 `manual` probe 并给出确认 guidance
- **AND** runtime check MUST NOT 把该项报告为自动检查成功

#### Scenario: 文件系统无法证明 Agent 已加载投射
- **WHEN** Buildr 只能证明 Rules 或 Skills 投射存在，无法从文件系统证明目标 Agent 已在会话中加载
- **THEN** runtime list、runtime check 或权威文档 MUST 提供对应 activation guidance
- **AND** runtime check MUST NOT 仅因没有真实 Agent marker smoke 而生成当前用户必须处理的 prerequisite warning

### Requirement: 每个新增 adapter 保留独立兼容证据与分层验证状态
Buildr MUST 为每个新增 adapter 记录 runtime-specific 官方文档、本机观察或安装包源码 provenance，并 MUST 以可重复的 descriptor、plan、projection、checker 和 lifecycle tests 验证 Buildr 可负责的兼容边界；descriptor MUST NOT 编码真实 Agent marker smoke 状态或品牌特有的历史通过快照。

#### Scenario: 自动 contract evidence
- **WHEN** 产品验证检查新增 adapter
- **THEN** 每个 adapter MUST 有独立 capability evidence 和 contract fixture
- **AND** 共享 primitive 的测试结果 MUST NOT 代替具体 adapter 的五项 capability evidence
- **AND** 自动 tests MUST 覆盖投射格式、scope 顺序、兄弟隔离、Skills root、冲突保护、清理和 checker

#### Scenario: 兼容证据不声明真实会话已加载
- **WHEN** descriptor 记录 Rules、Skills 或 activation 的文档、源码或本机 intake provenance
- **THEN** Buildr MUST 将其描述为 adapter contract evidence
- **AND** MUST NOT 将该 evidence 表述为当前 workspace、当前版本或当前 Agent 会话已经真实加载投射
- **AND** descriptor MUST NOT 使用 `verified`、`pending` 或等价 smoke 状态区分 supported adapters

#### Scenario: WorkBuddy 不保留 smoke 特例
- **WHEN** 产品验证或 runtime list 读取 WorkBuddy descriptor
- **THEN** WorkBuddy MUST 使用与其他 supported adapters 相同的 contract evidence 模型
- **AND** descriptor MUST NOT 包含历史 product/runtime version、marker result 或 headless transcript 摘要
