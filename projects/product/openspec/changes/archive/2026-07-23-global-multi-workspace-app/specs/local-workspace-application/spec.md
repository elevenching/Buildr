## REMOVED Requirements

### Requirement: 本地应用入口必须受限于单个 Workspace
**Reason**: 全局 Buildr Web App 需要在一个单实例进程中登记和切换多个 Workspace，启动时固定单 root 的约束不再成立。

**Migration**: `buildr app` 改为启动或复用全局实例；原 `--target` 兼容入口用于登记并打开指定 Workspace，普通 API 改用已登记 `workspaceId` 上下文。

### Requirement: 本机应用必须提供固定 Workspace 的应用外壳与路由
**Reason**: App Shell 将拥有全局 Workspace 列表，并在选定 Workspace 下展示原有资源页面。

**Migration**: 原页面路由迁移到 `/workspaces/:workspaceId/...`，根路由改为全局 Workspace 页面。

## ADDED Requirements

### Requirement: 本机应用必须管理多个已登记 Workspace
Buildr MUST 在现有 Workspace 产品能力中维护本机登记 root 列表，并 MUST 以各 root 的 `.buildr/workspace.yml` 作为 Workspace 信息的事实来源。

#### Scenario: 登记已有 Workspace
- **WHEN** 用户选择包含有效 canonical `.buildr/workspace.yml` 的目录进行登记
- **THEN** Application MUST 将规范化 root 原子加入本机登记列表
- **AND** 页面 MUST 使用目标 Workspace 的真实 id、name 和 description 展示该项
- **AND** 登记 MUST NOT 修改目标 Workspace

#### Scenario: 重复登记同一路径
- **WHEN** 用户再次登记已经存在的同一规范化 root
- **THEN** Application MUST 返回已有 Workspace 并保持登记列表幂等

#### Scenario: 移除 Workspace 登记
- **WHEN** 用户确认从 Buildr App 移除已登记 Workspace
- **THEN** Application MUST 只删除本机 root 记录
- **AND** MUST NOT 修改或删除目标目录及其中任何资产

#### Scenario: 已登记路径不可用
- **WHEN** 已登记 root 不存在、不可读取或不再包含有效 Workspace
- **THEN** 全局页面 MUST 显示可解释的不可用状态
- **AND** 其他已登记 Workspace MUST 继续可用

#### Scenario: Workspace identity 冲突
- **WHEN** 不同已登记 root 解析为相同 canonical Workspace id
- **THEN** Buildr MUST 报告 identity conflict
- **AND** MUST NOT 自动选择、合并或改写任一 Workspace

### Requirement: 全局应用必须通过已登记 Workspace 身份隔离请求
Buildr MUST 让 Workspace 内页面和 API 使用已登记 `workspaceId` 作为上下文，并 MUST 在调用既有 Application 用例前由 server 解析和重新验证真实 root。

#### Scenario: 访问已登记 Workspace
- **WHEN** 请求包含已登记且 identity 匹配的 `workspaceId`
- **THEN** HTTP interface MUST 只把该 Workspace 的 root 交给对应 Application 用例
- **AND** 返回结果 MUST NOT 混入其他 Workspace 的事实

#### Scenario: 普通请求提交路径
- **WHEN** Workspace、Project、Service 或 Change 请求包含 target、root、path 或其他 filesystem path
- **THEN** HTTP interface MUST 在读取或修改 Workspace 前拒绝请求

#### Scenario: 访问未知 Workspace
- **WHEN** 请求中的 `workspaceId` 未登记、不可用或与 root 中的 canonical identity 不匹配
- **THEN** HTTP interface MUST 返回稳定的不可用或冲突结果
- **AND** MUST NOT 回退到当前目录或其他 Workspace

### Requirement: 全局应用必须提供 Workspace 级应用外壳与路由
Buildr MUST 提供全局 Workspace 页面，并 MUST 在选定 Workspace 下提供原有概览、设置、Project、Service 和 Change 路由。

#### Scenario: 打开全局首页
- **WHEN** 用户打开根路由
- **THEN** 页面 MUST 展示全部已登记 Workspace 的真实身份和可用状态
- **AND** MUST 提供登记已有 Workspace、移除登记和进入 Workspace 的明确操作

#### Scenario: 进入 Workspace
- **WHEN** 用户选择一个可用 Workspace
- **THEN** 页面 MUST 导航到 `/workspaces/:workspaceId/` 下的 Workspace 概览
- **AND** Workspace 内导航 MUST 保持该 `workspaceId` 上下文

#### Scenario: 切换 Workspace
- **WHEN** 用户从 Workspace 内选择另一个已登记 Workspace
- **THEN** 页面 MUST 切换到目标 Workspace 的 canonical route
- **AND** MUST NOT 改变任一 Workspace 源资产

#### Scenario: 恢复最近使用项
- **WHEN** 全局实例启动且最近使用的 Workspace 仍可用
- **THEN** Buildr MUST 允许启动入口直接打开该 Workspace
- **AND** 最近使用状态 MUST NOT 写入 Workspace 源资产

### Requirement: Buildr App 必须以单实例本机 Web 服务运行
Buildr MUST 启动或复用一个只监听 loopback 的全局本机 Web 服务，并 MUST 在服务就绪后打开默认浏览器。

#### Scenario: 首次启动 App
- **WHEN** 当前用户没有健康的 Buildr App 实例
- **THEN** `buildr app` MUST 启动一个全局实例、记录可验证的 runtime state 并打开默认浏览器

#### Scenario: 重复启动 App
- **WHEN** 当前用户已经存在通过 Buildr health handshake 的实例
- **THEN** 启动入口 MUST 复用已有实例并重新打开浏览器
- **AND** MUST NOT 再启动一个 server

#### Scenario: 恢复陈旧实例状态
- **WHEN** runtime state 指向不存在或无法通过带实例 secret 的 health handshake 的进程
- **THEN** Buildr MUST 安全替换陈旧状态并启动新实例
- **AND** MUST 保留持久 Workspace 登记列表

#### Scenario: 开发环境不打开浏览器
- **WHEN** 调用方使用 `buildr app --no-open`
- **THEN** Buildr MUST 启动或复用实例但 MUST NOT 打开浏览器

#### Scenario: 兼容指定 Workspace 启动
- **WHEN** 调用方使用 `buildr app --target <workspace>`
- **THEN** Buildr MUST 验证并登记该 Workspace、启动或复用全局实例，并打开其 Workspace route

### Requirement: 普通用户必须能够启动和退出本机 Web 应用
Buildr MUST 提供无需用户理解命令行、端口或进程的可双击启动入口，并 MUST 在 Web 页面提供明确的安全退出操作。

#### Scenario: macOS 双击启动入口
- **WHEN** 普通用户双击已安装的 macOS `Buildr.app` launcher
- **THEN** launcher MUST 启动或复用 Buildr App 并在默认浏览器打开页面
- **AND** launcher MUST NOT 创建 Desktop WebView 或第二套 UI
- **AND** macOS application bundle MUST 声明并携带可识别的 Buildr application icon

#### Scenario: Windows 双击启动入口
- **WHEN** 普通用户点击 Windows 开始菜单或桌面的 Buildr 图标
- **THEN** Windows launcher MUST 启动或复用同一个 Buildr App 并在默认浏览器打开页面
- **AND** launcher MUST NOT 要求用户预先配置 Node、npm 或 PATH
- **AND** 桌面和开始菜单快捷方式 MUST 使用随包交付的 Buildr icon

#### Scenario: 关闭浏览器页面
- **WHEN** 用户关闭 Buildr 浏览器标签页或窗口
- **THEN** Buildr server MUST 继续运行
- **AND** 用户再次使用启动入口时 MUST 能重新打开已有实例

#### Scenario: 从页面退出 Buildr
- **WHEN** 当前同源页面携带有效 session 发起退出并得到用户确认
- **THEN** server MUST 停止接受新请求、清理当前 runtime state 并退出进程
- **AND** MUST 保留 Workspace 登记列表和所有 Workspace 源资产

#### Scenario: 非法退出请求
- **WHEN** 退出请求缺少有效 Origin、session token 或允许的请求格式
- **THEN** server MUST 拒绝退出并继续运行

### Requirement: 全局 Workspace 登记必须使用最小本机安全边界
Buildr MUST 将任意目录选择限制在显式登记用例中，并 MUST 保护登记文件和 Workspace 源资产不被普通 Web 请求越权访问。

#### Scenario: 合法登记请求
- **WHEN** 当前同源 session 通过受控目录选择或兼容 CLI 提供候选 root
- **THEN** Application MUST 在写登记列表前验证候选目录的 canonical Workspace identity

#### Scenario: 非法登记目录
- **WHEN** 候选目录不是有效 Buildr Workspace、不可读取或与已有 identity 冲突
- **THEN** Application MUST 拒绝登记或返回明确冲突
- **AND** 登记列表和候选目录 MUST 保持不变

#### Scenario: 并发修改登记列表
- **WHEN** 登记或移除请求携带的 registry revision 已过期
- **THEN** Application MUST 返回 conflict
- **AND** MUST NOT 覆盖另一页面或进程已经完成的修改
