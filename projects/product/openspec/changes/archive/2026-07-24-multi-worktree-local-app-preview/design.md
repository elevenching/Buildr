## Context

`buildr app` 当前以用户级 `instance.json`、`workspace-registry.json` 和启动锁管理默认 Local App。它适合普通用户在多个 Workspace 间切换，但不能证明一个运行中的页面来自哪个开发 worktree；多个 Agent 任务也会争用同一状态目录和实例。

`Buildr Dev.app` 是主开发 checkout 的稳定图形启动入口，不是 task worktree 的验收机制。任务预览需要直接运行该 worktree 的 CLI/源码，并且不能替换该 launcher 或默认实例。

## Goals / Non-Goals

**Goals:**

- 让 Agent 为每个显式 task 实例启动、复用、列出和停止隔离的 Local App 预览。
- 让预览进程、状态目录、Workspace 登记、锁、端口和身份与默认实例及其他预览隔离。
- 在 CLI 输出、健康响应和 Web Shell 中展示可核验的 worktree、分支、HEAD 和 dirty 身份。
- 让 task-finish 只停止和清理当前任务拥有的预览，不中断其他并发任务。

**Non-Goals:**

- 不改变 `buildr app` 的默认单实例语义、默认 Workspace 登记或用户级 `Buildr Dev.app`。
- 不为每个 worktree 安装 macOS/Windows launcher、Desktop WebView、菜单栏或后台常驻管理器。
- 不管理 Agent 会话、Git checkout、stash、merge 或用户未授权的其他任务进程。

## Decisions

### 1. 使用显式预览实例名，而不从 worktree 路径推断

新增 `buildr app preview start <instance>`、`buildr app preview list` 和 `buildr app preview stop <instance>`。实例名必须是稳定、安全的标识；启动时 `--target` 指向当前 task worktree，默认端口为随机 loopback 端口。

显式名称能让 Agent 在对话中交接可读 URL，也避免 worktree 改名、复用或不同仓库同名目录造成隐式状态碰撞。自动按路径派生名称被拒绝，因为它会隐藏所有者和清理边界。

### 2. 每个预览使用自己的受管用户级状态命名空间

预览状态位于默认 Local App 数据根的 `previews/<instance>/` 下，至少包含实例记录、启动锁、Workspace registry 和 preview owner 记录。默认应用继续使用既有根目录文件，二者不迁移也不共享锁。

owner 记录保存规范化 worktree 路径、Git repository、branch、HEAD、dirty 状态和启动来源。启动同名健康实例时，只有 owner 与请求 worktree 一致才能复用；其他 worktree 的同名实例必须失败并给出停止或更换名称的动作。这样一个任务不能静默接管另一个任务的预览。

### 3. 预览控制命令负责后台启动与认证关闭

`preview start` 从当前 checkout 启动受限 loopback 子进程，等待带 secret 的 health endpoint 就绪后才返回 URL 和 identity；默认打开浏览器，`--no-open` 保持 Agent 自动化可控。它不依赖全局 `buildr` 符号链接，也不重装 launcher。

`preview stop` 只能使用该实例状态中保存的 secret 调用显式退出 endpoint；健康记录失效时只清理由该预览命名空间拥有的陈旧记录。`preview list` 只报告 Buildr 自己的 preview 目录，不扫描或控制任意系统进程。

直接让 Agent 设置 `BUILDR_APP_DATA_DIR` 虽可工作，但被拒绝为公开方案：它会暴露内部状态路径、无法列出所有者，也没有一致的启动/停止或诊断契约。

### 4. 预览身份贯穿 CLI、health 与页面

服务器从受控 preview 环境读取 owner 身份，并将其作为 health payload 的兼容性扩展及 Web Shell 的只读开发预览条。CLI 启动结果包含相同身份和 URL。默认应用没有 preview 环境时不显示该条，也不改变原 health 语义。

浏览器标签本身不是可信来源；用户验收必须能从页面看到实例名和 checkout identity。

### 5. 收尾只处理当前任务拥有的 preview

task-finish 先枚举预览状态并按 owner worktree 匹配。属于当前任务的健康 preview 必须先经认证停止并确认不再健康，才允许删除 worktree；属于其他 worktree 的 preview 必须保持运行且在最终报告中标为未触碰。默认实例仍按既有同端口 handoff 规则处理。

把全部 preview 都迁回主 checkout 被拒绝，因为预览的价值正是验证未合入代码；随机端口替换当前任务预览也被拒绝，因为它会丢失验收 URL 的可追溯性。

## Risks / Trade-offs

- [同名实例被误用] → owner 绑定 worktree，健康实例 owner 不匹配时拒绝复用。
- [遗留子进程或状态文件] → `list` 显示健康/陈旧状态；`stop` 仅清理自身命名空间并经认证关闭健康进程。
- [浏览器标签混淆] → 页面、CLI 和 health 返回同一 preview identity。
- [开发环境资源增加] → 预览显式启动、随机端口、无 launcher 副本；任务收尾停止自身实例。
- [默认应用兼容性回归] → 不改变默认状态路径、`buildr app` 参数或 `Buildr Dev.app` 生命周期，并保留原有单实例测试。

## Migration Plan

1. 保留默认数据根与 `buildr app` 行为；新增 preview 子目录和命令，不迁移既有 `instance.json`。
2. 增加独立 preview 集成和浏览器覆盖，并保留默认实例回归覆盖。
3. 更新 task-finish Skill/contract，使新 preview 生命周期在后续任务收尾中生效。
4. 若实现或发布出现问题，停止使用 preview 命令即可回到原默认实例；删除的 preview 状态只属于开发预览，不影响 Workspace 源资产或 development launcher。

## Open Questions

- 首版不提供持久化 Finder launcher；后续只有在用户明确需要长期图标入口时，才评估可选的任务预览 launcher。
