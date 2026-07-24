## Context

Buildr Local App 将单实例的 URL、secret 与 pid 写入用户级 `instance.json`。CLI 已支持 `buildr app --port <port>`，但 task-finish 只笼统要求迁移本机入口，未把已有实例的 URL 作为交接事实。因此旧实例停止后，新的 CLI 默认使用端口 `0`，会得到新的随机端口。

## Goals / Non-Goals

**Goals:**

- 在 task worktree 承载运行中 Local App 时，把健康实例的实际 loopback port 作为交接事实。
- 只在主 checkout 已完成集成、开发入口已迁回且新实例在原端口健康后，删除 task worktree。
- 原端口无法重新监听时 fail closed，不改用随机端口，也不删除 worktree。

**Non-Goals:**

- 不新增用户可见的固定端口配置。
- 不为非健康、未登记或未运行的实例虚构端口。
- 不接管浏览器标签页、Agent session 或远端服务。

## Decisions

### 将健康实例 URL 作为端口事实

收尾在停止实例前读取 `instance.json`，并通过带 secret 的 `/api/v1/health` 确认该实例仍健康；仅从已验证 URL 解析 127.0.0.1 的有效端口。这样不会相信陈旧状态文件或未认证 URL。

### 用显式 `--port` 执行迁移

旧实例停止、主 checkout 的 CLI 与 development launcher 重装后，必须运行 `buildr app --port <旧端口> --no-open`。成功条件包括该实例报告原端口、健康检查通过，并确认 CLI/静态资源来自保留 checkout。禁止以端口 `0` 或其他端口作为成功替代。

### 将 worktree 删除放在同端口健康之后

端口交接发生在删除前；它失败时保留 task worktree 与任务分支，以便恢复或调查。没有正在运行的健康 Local App 时，正常入口迁移和清理流程不受影响。

## Risks / Trade-offs

- [旧端口在停机窗口被其他进程占用] → 不选择新端口；停止清理并保留 worktree，报告端口占用。
- [instance.json 陈旧或不可信] → 只有健康握手成功才触发同端口交接；其余情况按无运行实例处理。
- [新实例启动后实现来源错误] → 用 `command -v buildr`、解析路径和静态资源/健康事实证明迁移，失败则不清理。
