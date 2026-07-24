## ADDED Requirements

### Requirement: task worktree 必须支持隔离的 Local App 预览实例
Buildr MUST 提供 `buildr app preview start <instance>`，让 Agent 从指定 task worktree 启动或复用独立的 loopback Local App 预览。实例名 MUST 通过稳定安全校验；预览 MUST 使用独立于默认 Local App 的状态目录、Workspace registry、实例记录和启动锁，且默认随机选择可用端口。

#### Scenario: 启动两个不同任务预览
- **WHEN** 两个不同 worktree 分别使用不同实例名启动预览
- **THEN** Buildr MUST 让两个健康实例同时监听各自的 loopback URL
- **AND** 两个预览 MUST NOT 复用实例记录、启动锁或 Workspace registry
- **AND** 默认 `buildr app` 实例 MUST 保持不受影响

#### Scenario: 同一 worktree 复用健康预览
- **WHEN** 当前 worktree 使用相同实例名再次启动健康预览
- **THEN** Buildr MUST 复用原实例并返回同一 URL 与 owner identity
- **AND** MUST NOT 额外启动第二个服务进程

#### Scenario: 不同 worktree 请求已被占用的实例名
- **WHEN** 一个健康 preview 的 owner worktree 与启动请求的 worktree 不一致
- **THEN** Buildr MUST 拒绝复用或停止该 preview
- **AND** MUST 返回实例名、已登记 owner 与更换实例名或由 owner 停止的可执行动作

### Requirement: 预览必须提供可核验的运行身份
每个 preview MUST 持久化并返回实例名、规范化 worktree 路径、Git repository、branch、HEAD、dirty 状态与 URL。CLI 启动/查看输出、受认证 health 响应和页面开发预览身份条 MUST 表达同一身份；默认 Local App MUST 不显示 preview 身份条。

#### Scenario: Agent 启动预览后交接验收链接
- **WHEN** `buildr app preview start <instance>` 成功启动或复用实例
- **THEN** 输出 MUST 包含 URL、实例名、worktree、branch、HEAD 与 dirty 状态
- **AND** Agent MUST 能仅凭该输出向用户提供可区分的验收链接

#### Scenario: 用户查看并行预览页面
- **WHEN** 用户打开任一 preview 的页面
- **THEN** 页面 MUST 展示只读的开发预览实例名和 checkout identity
- **AND** 页面 MUST NOT 将该身份写入 Workspace 源资产或允许页面修改它

### Requirement: 预览实例必须可枚举并安全停止
Buildr MUST 提供 `buildr app preview list` 与 `buildr app preview stop <instance>`。list MUST 只枚举 Buildr preview 命名空间中的实例及其健康状态；stop MUST 仅能认证停止目标 preview，且不得停止默认实例或其他实例。

#### Scenario: 查看多个 preview 状态
- **WHEN** Agent 运行 `buildr app preview list`
- **THEN** Buildr MUST 分别返回每个 preview 的实例名、owner identity、URL、PID 与健康或陈旧状态
- **AND** MUST NOT 枚举或管理非 Buildr 进程

#### Scenario: 停止当前任务 preview
- **WHEN** Agent 停止一个健康 preview 并且状态记录的 secret 可认证该实例
- **THEN** Buildr MUST 请求该 preview 的显式退出并确认其不再健康
- **AND** MUST 只清理该 preview 命名空间内的实例记录

#### Scenario: 停止陈旧 preview 记录
- **WHEN** Agent 停止一个无法通过健康检查的 preview
- **THEN** Buildr MUST 只清理该 preview 命名空间内的陈旧记录
- **AND** MUST NOT 影响其他 preview、默认 Local App 或 Workspace 源资产

### Requirement: task preview 不得改变 development launcher
`buildr app preview` MUST 直接使用请求 worktree 的 checkout 启动预览，且 MUST NOT 安装、更新、替换、停止或重新指向 `Buildr Dev.app`、全局开发 CLI 或默认 Local App。

#### Scenario: worktree 启动 preview
- **WHEN** Agent 从 task worktree 启动 preview
- **THEN** 运行 identity MUST 指向该 task worktree 的 checkout
- **AND** `/Applications/Buildr Dev.app` 的安装 identity MUST 保持不变
