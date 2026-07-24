## Why

当前 `buildr app` 在启动时固定到一个 Workspace，用户同时在 Buildr、jixian 等多个 Workspace 工作时，需要分别启动和管理多个进程，也无法从统一入口切换工作空间。现在需要把现有本机 Web 应用提升为普通用户可直接打开的全局入口，同时继续让每个 Workspace 的 `.buildr/workspace.yml` 保持自身事实权威。

## What Changes

- **BREAKING**：将 `buildr app` 从启动时固定单 Workspace 的 Web 服务改为全局单实例本机 Web 服务；Workspace 通过已登记身份成为页面和 API 的显式上下文。
- 在现有 Workspace 产品能力中增加本机工作空间登记列表，只保存 Workspace root；Workspace 身份、名称和说明仍从目标目录的 `.buildr/workspace.yml` 实时读取。
- 增加全局工作空间页面，支持选择目录登记已有 Workspace、从 App 移除登记、查看不可用状态、切换 Workspace 和恢复最近使用项。
- 将现有 Workspace、Project、Service、Change 页面和 API 调整为 `workspaceId` scoped，不接受普通业务请求传入任意 filesystem path。
- `buildr app` 启动时复用已有健康实例或创建新实例，并自动打开默认浏览器；增加由当前 Web session 发起的安全退出能力和陈旧实例状态恢复。
- 为 macOS 和 Windows 普通用户提供带 Buildr 品牌图标的可双击轻量启动入口；入口只负责启动或唤起本机 Web 应用，不引入 Desktop UI、菜单栏或登录启动。
- 保留 `buildr app --target <workspace>` 作为开发与兼容入口，用于登记并打开指定 Workspace。
- 不扫描磁盘、不聚合多个 Workspace 的 Project/Service/Change 为第二事实源，也不启动或管理 Agent。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `local-workspace-application`: 将固定单 Workspace 本机应用改为全局单实例、多 Workspace 登记与切换的本机 Web 应用，并明确浏览器启动、安全退出和普通用户启动入口。

## Impact

- Workspace Application/Infrastructure：增加本机登记列表、路径验证、最近使用项和原子持久化。
- Local App HTTP/Web：调整路由、API 上下文、实例发现、浏览器打开、退出端点和全局工作空间页面。
- CLI/package：调整 `buildr app` 行为并交付 macOS、Windows 可双击的轻量启动入口。
- 安全契约：从 fixed target 改为 server-side registered `workspaceId` 解析，继续保持 loopback、same-origin、session token、JSON、body size 和 revision CAS。
- 验证：覆盖多 Workspace 隔离、登记/移除、无效路径、重复启动、陈旧实例恢复、浏览器打开、安全退出和 package parity。
