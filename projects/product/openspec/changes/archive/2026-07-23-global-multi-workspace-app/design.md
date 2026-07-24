## Context

当前 `buildr app --target <workspace>` 创建一个绑定单一 root 的前台 HTTP server，打印随机 loopback URL，且不自动打开浏览器。Web、HTTP 安全校验和 Workspace/Project/Service/Change Application 都以启动时固定的 `targetRoot` 为上下文。

用户实际会同时维护多个 Buildr Workspace，例如 Buildr 与 jixian。首批仍采用浏览器中的本机 Web 应用，不引入 Desktop UI；需要解决的是全局入口、本机 Workspace 登记、单实例启动和普通用户可理解的退出方式。

## Goals / Non-Goals

**Goals:**

- 一个本机 Buildr Web App 进程管理多个已登记 Workspace，并保持 Workspace 之间严格隔离。
- 复用现有 Workspace Domain 与各 Workspace 的 `.buildr/workspace.yml`，不复制组织事实。
- 普通用户通过可双击入口启动或重新打开 Buildr，无需理解命令行、端口或进程。
- 启动自动打开默认浏览器，页面提供明确且安全的“退出 Buildr”。
- 保留现有 loopback、session、CAS、prompt-only 和 Agent-first 边界。

**Non-Goals:**

- 不实现 Desktop UI、菜单栏、登录启动或系统通知。
- 不扫描磁盘自动发现 Workspace。
- 不建立跨 Workspace Project/Service/Change 聚合或缓存。
- 不由 App 初始化 Workspace、启动 Agent 或管理 Agent session。
- 不把本机登记列表纳入 Workspace Git、Buildr sync 或 runtime 投射。

## Decisions

### 1. 登记列表属于现有 Workspace 产品能力

不新增独立顶层业务 Domain。Workspace entity 仍由 `.buildr/workspace.yml` 定义；Workspace Application 增加“列出、登记、移除、解析、记录最近使用”的本机用例，并通过 `WorkspaceRegistryRepository` port 持久化。

登记文件只保存规范化绝对 root 列表和最近使用 root，不复制 Workspace `id`、`name`、`description` 或下属资源。读取列表时逐项通过现有 Workspace repository 加载真实 entity；路径失效或内容无效时返回可解释状态，不影响其他 Workspace。

选择只保存 root，而不是维护一份 Workspace metadata catalog，可以避免第二事实源和同步问题。`workspaceId` 仍作为页面/API 的稳定上下文；server 每次从已登记 root 读取并核对真实 id 后建立请求上下文。

### 2. 登记和移除只是本机入口管理

登记操作由用户在全局页面选择目录，或由兼容 CLI 提供 `--target`。Application 验证目录是可读取的 Buildr Workspace 后，将 root 原子加入列表；同一路径重复登记幂等。同一 canonical Workspace id 出现在不同 root 时返回 identity conflict，不自动选择。

移除只删除本机 root 记录，不写目标目录，也不删除任何 Workspace、Project、Service 或 Change。创建尚不存在的 Workspace 继续生成 Agent prompt。

不采用递归磁盘扫描，因为它会扩大性能、隐私和路径授权范围。

### 3. 全局 server 使用 registered workspace context

HTTP server 不再闭包固定 `targetRoot`。全局路由使用 `/workspaces/:workspaceId/...`，API 使用 `/api/v1/workspaces/:workspaceId/...`。普通 Workspace 请求不得提交 root、target 或其他 filesystem path；interface 先由登记列表解析并重新验证 `workspaceId`，再调用现有单 Workspace Application 用例。

目录选择只存在于独立的登记动作中，必须经过当前 Origin、session token、JSON/body size 或受控本机 chooser 边界。Workspace 内 metadata mutation 继续使用原 manifest revision CAS；登记文件自身也使用原子写入和 revision CAS。

### 4. `buildr app` 管理单实例并自动打开浏览器

`buildr app` 启动时读取用户级 runtime state：若其中记录的 loopback endpoint 能通过随机实例 secret 完成 Buildr health handshake，则复用该实例并打开目标 URL；否则清理陈旧 state，启动新 server，原子写入 PID、端口和 secret，并打开默认浏览器。

server 继续使用动态可用端口，避免占用固定端口。runtime state 与持久登记文件分离：异常退出可以丢弃实例状态，但不能丢失 Workspace 列表。

`buildr app --target <workspace>` 保留兼容性：验证并登记 root，启动或复用全局实例，然后打开该 Workspace URL。开发和自动化可使用 `--no-open`，避免强制浏览器副作用。

### 5. 普通用户入口只是 Web launcher

产品为 macOS 和 Windows 分别交付可双击的轻量 launcher。两者只调用同一个 Buildr app entrypoint，等待 health ready，然后由该入口通过系统能力打开默认浏览器；不包含 WebView、Desktop 窗口或菜单栏，因此不构成另一套 UI。

macOS 使用 `Buildr.app` launcher，Windows 使用安装器登记的开始菜单/桌面图标与轻量 executable launcher。启动失败时两者必须展示可理解的错误和恢复建议，不能只留下终端堆栈。launcher 与 Buildr runtime/Web 资源由对应平台安装包共同交付，不依赖普通用户预先配置 Node、npm 或 PATH。Linux 首批仍使用 CLI。

两个平台从同一份透明高分辨率主图生成平台资源：macOS bundle 携带 `Buildr.icns` 并由 `Info.plist` 声明，Windows bundle 携带包含常用小尺寸的 `Buildr.ico`，桌面与开始菜单快捷方式通过 `IconLocation` 使用该图标。图标属于 launcher 交付资产，不改变 Web App 或 Workspace 事实模型。

### 6. 关闭浏览器不等于退出，退出必须显式

浏览器标签页生命周期不可靠，关闭页面只关闭视图，server 继续运行。全局页面提供“退出 Buildr”，经同源 session 保护的 POST 请求关闭 server；页面随后显示已退出状态。`SIGINT`/`SIGTERM` 仍用于开发和系统终止。

再次双击 launcher 或执行 `buildr app` 会复用已有实例并重新打开浏览器。正常退出删除 runtime state；异常退出由下一次 health handshake 恢复。

### 7. 全局页只提供 Workspace 级入口

根路由展示已登记 Workspace、真实名称/说明、可用状态和添加/移除操作。进入 Workspace 后沿用现有概览、项目、服务、变更和设置结构，只把 canonical route 加上 `workspaceId`。最近使用项只决定启动后的默认导航，不产生跨 Workspace 聚合视图。

## Risks / Trade-offs

- [本机路径列表可能因移动目录而失效] → 保留记录并显示不可用，允许用户移除后重新登记，不猜测新路径。
- [相同 Workspace checkout 可能出现在多个路径] → 按 canonical `workspaceId` 报 identity conflict，由用户决定保留哪个入口。
- [浏览器关闭后后台 server 仍运行] → 页面明确说明，并提供退出按钮；重复启动始终复用实例。
- [实例 state 被伪造或端口被其他进程复用] → 使用随机 secret 和 Buildr health handshake，不只依赖 PID 或端口。
- [macOS 与 Windows launcher/安装包增加平台交付面] → 两个平台只实现启动、错误展示和默认浏览器打开；Web、单实例协议与 Application 能力完全共享。
- [全局 API 扩大文件访问面] → 普通 API 只接受已登记 `workspaceId`，路径只允许进入独立登记用例。

## Migration Plan

1. 增加 Workspace 本机登记 repository 与 Application 用例，并保持 Workspace entity/manifest 不变。
2. 将 HTTP server 改为全局上下文，增加 workspace-scoped API、health、实例复用和安全退出。
3. 增加全局 Workspace 页面并迁移现有路由；保留原有资源功能与 CAS 行为。
4. 调整 CLI 行为、浏览器打开和 `--target`/`--no-open` 兼容入口。
5. 交付并验证 macOS、Windows 双击 launcher 与安装后启动生命周期，再完成 package parity 和完整候选验证。

回滚时可恢复固定 target server 和旧路由；登记文件属于新增的本机辅助状态，旧版本忽略即可，不影响任何 Workspace 源资产。

## Open Questions

无。Desktop、菜单栏、登录启动和 Linux 图形 launcher 由后续独立 change 决定。
